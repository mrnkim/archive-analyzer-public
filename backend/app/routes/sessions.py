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


def _context_followup(session_id: str, message: str, context: dict | None) -> FollowupResponse:
    """Fallback answer using the selected UI evidence when Jockey followup fails."""
    if not context:
        return FollowupResponse(
            session_id=session_id,
            answer=(
                "Jockey's multi-turn session endpoint was unavailable for this followup, "
                "and no selected timeline evidence was attached. Try selecting a year or "
                "scene first, then ask again."
            ),
            matched_key=None,
            source="context",
        )

    year = context.get("year")
    theme = context.get("theme") or "the selected theme"
    frequency = context.get("frequency")
    clip_title = context.get("clip_title") or "the selected clip"
    clip_reason = context.get("clip_reason")
    scenes = context.get("scenes") or []

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

    year_label = f"{year}" if year else "This selection"
    answer = (
        f"{year_label} stands out because it is anchored by **{theme}**. "
        f"The current evidence centers on _{clip_title}_"
    )
    if evidence_bits:
        answer += ": " + "; ".join(evidence_bits) + "."
    else:
        answer += "."
    answer += (
        "\n\nJockey's multi-turn session endpoint was unavailable for this followup, "
        "so this answer is based on the selected timeline evidence already loaded in the UI."
    )

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
    try:
        raw = await client.create_response(
            question=req.message,
            instructions=instructions,
            session_id=session_id,
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
