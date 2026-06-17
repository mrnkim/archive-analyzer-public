"""SSE stream route — Phase 2: real Jockey stream with mock fallback."""

import asyncio
import json
import logging

from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse

from app.config import get_settings
from app.deps.jockey_client import JockeyClient, QueryError
from app.prompts import NARRATIVE_INSTRUCTIONS
from app.seeds import load_seed

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["stream"])


def _extract_delta(event: dict) -> str | None:
    """Pull a token delta from a Jockey SSE event.

    Jockey reuses the OpenAI-style event taxonomy. The most common ones are
    `response.output_text.delta` (with a `delta` string) and various lifecycle
    events we can ignore.
    """
    if "delta" in event and isinstance(event["delta"], str):
        return event["delta"]
    if event.get("type", "").endswith(".delta"):
        return event.get("delta") or event.get("text")
    return None


@router.get("/stream")
async def stream(query: str = "", session_id: str | None = None, scenario: str | None = None):
    # Route to the same KS the matching /query call used so the session_id
    # (which is bound to that KS) stays valid — e.g. the Narrative tab's
    # Trump archive.
    client = JockeyClient(ks_id=get_settings().ks_for_scenario(scenario))

    if not client.configured:
        # Mock mode — replay the pre-recorded narrative.
        seed = load_seed("narrative_stream")
        tokens: list[str] = seed["tokens"]
        delay = float(seed.get("delay_ms", 50)) / 1000.0

        async def mock_gen():
            for token in tokens:
                yield {"event": "token", "data": json.dumps({"delta": token})}
                await asyncio.sleep(delay)
            yield {"event": "done", "data": "[DONE]"}

        return EventSourceResponse(mock_gen())

    # Real Jockey streaming.
    async def jockey_gen():
        try:
            async for event in client.stream_response(
                question=query,
                instructions=NARRATIVE_INSTRUCTIONS,
                session_id=session_id,
            ):
                delta = _extract_delta(event)
                if delta:
                    yield {"event": "token", "data": json.dumps({"delta": delta})}
        except QueryError as e:
            logger.exception("Jockey stream failed: %s", e)
            yield {"event": "error", "data": json.dumps({"message": str(e)})}
        finally:
            yield {"event": "done", "data": "[DONE]"}

    return EventSourceResponse(jockey_gen())
