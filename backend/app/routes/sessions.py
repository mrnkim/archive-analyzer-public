"""Session / multi-turn route — Phase 2: real Jockey with mock fallback."""

import logging

from fastapi import APIRouter
from pydantic import BaseModel

from app.config import get_settings
from app.deps.jockey_client import JockeyClient, QueryError
from app.prompts import get_followup_instructions
from app.seeds import load_seed

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


class FollowupRequest(BaseModel):
    message: str
    scenario: str | None = None
    context: dict | None = None
    use_session: bool = True


class FollowupResponse(BaseModel):
    session_id: str
    answer: str
    matched_key: str | None = None
    source: str  # "jockey" | "mock"


def _mock_followup(session_id: str, message: str) -> FollowupResponse:
    seed = load_seed("chat_followups")
    followups = seed["followups"]
    msg_lower = message.lower()

    best_key = None
    best_score = 0
    for key, entry in followups.items():
        if key == "default":
            continue
        keywords = entry.get("question_keywords", [])
        score = sum(1 for kw in keywords if kw.lower() in msg_lower)
        if score > best_score:
            best_score = score
            best_key = key

    answer = (
        followups[best_key]["answer"]
        if best_key
        else followups["default"]["answer"]
    )
    return FollowupResponse(
        session_id=session_id,
        answer=answer,
        matched_key=best_key,
        source="mock",
    )


def _extract_text(jockey_response: dict) -> str:
    """Pull plain-text answer out of a /responses payload."""
    output = jockey_response.get("output") or []
    chunks: list[str] = []
    for item in output:
        for content in item.get("content", []) or []:
            text = content.get("text")
            if isinstance(text, str):
                chunks.append(text)
    if chunks:
        return "\n".join(chunks)
    # Fall back to top-level text if present.
    if isinstance(jockey_response.get("text"), str):
        return jockey_response["text"]
    return "(no answer returned)"


def _standalone_followup_question(message: str, context: dict | None) -> str:
    """Build a session-free followup prompt grounded in the visible result."""
    if not context:
        return message

    if context.get("type") == "result":
        timeline = context.get("timeline") or []
        points = [
            f"{p.get('year')}: {p.get('frequency')} scenes, {p.get('theme') or p.get('dominant_theme')}"
            for p in timeline[:12]
            if isinstance(p, dict)
        ]
        return (
            f"User followup: {message}\n\n"
            "Answer using this archive result summary, not a prior session.\n"
            f"Timeline points: {'; '.join(points)}\n"
            f"Narrative summary: {context.get('narrative_summary') or ''}"
        )

    scenes = context.get("scenes") or []
    scene_bits = [
        f"{s.get('title')}: {s.get('reason')}"
        for s in scenes[:4]
        if isinstance(s, dict)
    ]
    return (
        f"User followup: {message}\n\n"
        "Answer using this selected archive evidence, not a prior session.\n"
        f"Selected year: {context.get('year')}\n"
        f"Theme: {context.get('theme')}\n"
        f"Representative clip: {context.get('clip_title')}\n"
        f"Representative evidence: {context.get('clip_reason') or ''}\n"
        f"Other scenes: {'; '.join(scene_bits)}"
    )


def _context_followup(session_id: str, message: str, context: dict | None) -> FollowupResponse:
    """Fallback answer using the selected UI evidence when Jockey followup fails."""
    if not context:
        return FollowupResponse(
            session_id=session_id,
            answer=(
                "I need a selected year or scene to ground this followup in the archive "
                "evidence. Select a timeline point or scene, then ask again."
            ),
            matched_key=None,
            source="context",
        )

    if context.get("type") == "result":
        timeline = context.get("timeline") or []
        bullets = context.get("summary_bullets") or []
        peak = None
        if timeline:
            peak = max(
                (p for p in timeline if isinstance(p, dict)),
                key=lambda p: int(p.get("frequency") or 0),
                default=None,
            )

        answer_parts: list[str] = []
        if peak:
            year = peak.get("year")
            theme = peak.get("theme") or peak.get("dominant_theme") or "the strongest evidence cluster"
            frequency = peak.get("frequency")
            answer_parts.append(
                f"The biggest visible signal is **{theme}** in {year}, "
                f"where the archive shows {frequency} verified scene{'s' if frequency != 1 else ''}."
            )

        if bullets:
            first_bullets = [
                b for b in bullets[:2] if isinstance(b, dict) and (b.get("headline") or b.get("text"))
            ]
            if first_bullets:
                summary = "; ".join(
                    f"{b.get('year')}: {b.get('headline') or b.get('text')}"
                    for b in first_bullets
                )
                answer_parts.append(f"Across the timeline, the pattern is: {summary}.")

        if not answer_parts and context.get("narrative_summary"):
            answer_parts.append(str(context["narrative_summary"]))

        if not answer_parts:
            answer_parts.append(
                "The strongest insight is the shift from scattered archive visibility "
                "to more explicit, evidence-backed brand presence in the selected results."
            )

        return FollowupResponse(
            session_id=session_id,
            answer="\n\n".join(answer_parts),
            matched_key=None,
            source="context",
        )

    year = context.get("year")
    theme = context.get("theme") or "the selected theme"
    frequency = context.get("frequency")
    clip_title = context.get("clip_title") or "the selected clip"
    clip_reason = context.get("clip_reason")
    scenes = context.get("scenes") or []
    msg_lower = message.lower()

    def _clean_sentence(value: str) -> str:
        return value.strip().rstrip(".")

    evidence_bits: list[str] = []
    if frequency:
        evidence_bits.append(f"{frequency} verified scene{'s' if frequency != 1 else ''}")
    if clip_reason:
        evidence_bits.append(_clean_sentence(str(clip_reason)))
    for scene in scenes[:2]:
        reason = scene.get("reason") if isinstance(scene, dict) else None
        title = scene.get("title") if isinstance(scene, dict) else None
        if reason and title != clip_title:
            evidence_bits.append(_clean_sentence(str(reason)))

    if "what is" in msg_lower or "what's" in msg_lower or "define" in msg_lower:
        answer = (
            f"Based on the selected archive evidence, **{clip_title}** is being used here "
            f"as evidence for **{theme}**."
        )
    else:
        year_label = f"{year}" if year else "This selection"
        answer = (
            f"{year_label} stands out because it is anchored by **{theme}**. "
            f"The current evidence centers on _{clip_title}_"
        )
    if evidence_bits:
        answer += ": " + "; ".join(evidence_bits) + "."
    else:
        answer += "."

    return FollowupResponse(
        session_id=session_id,
        answer=answer,
        matched_key=None,
        source="context",
    )


@router.post("/{session_id}/messages", response_model=FollowupResponse)
async def followup(session_id: str, req: FollowupRequest) -> FollowupResponse:
    client = JockeyClient(ks_id=get_settings().ks_for_scenario(req.scenario))

    if not client.configured:
        return _mock_followup(session_id, req.message)

    instructions = get_followup_instructions(req.scenario)
    followup_session_id = session_id if req.use_session else None
    question = req.message if req.use_session else _standalone_followup_question(req.message, req.context)
    try:
        raw = await client.create_response(
            question=question,
            instructions=instructions,
            session_id=followup_session_id,
        )
    except QueryError as e:
        logger.exception("Jockey followup failed: %s", e)
        return _context_followup(session_id, req.message, req.context)

    answer = _extract_text(raw)
    new_session_id = raw.get("session_id") or session_id

    return FollowupResponse(
        session_id=new_session_id,
        answer=answer,
        matched_key=None,
        source="jockey",
    )
