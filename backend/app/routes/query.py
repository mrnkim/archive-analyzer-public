"""Query route — Phase 2: real Jockey call with mock fallback."""

import json
import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ValidationError

import httpx

from app import cache
from app.config import get_settings
from app.deps import jockey_assets as jockey_api
from app.deps.jockey_client import JockeyClient, QueryError
from app.prompts import get_instructions
from app.schemas.trend_data import TREND_DATA_JSON_SCHEMA, TrendResponse
from app.seeds import load_seed


async def _list_all_ks_items(api_key: str, ks_id: str, base_url: str) -> list[dict]:
    """Paginated wrapper around GET /knowledge-stores/{id}/items.

    The bundled jockey_api.list_ks_items only fetches the first page (10
    items). For our 23-video corpus we need all pages so the citation-UUID
    → asset-hex map is complete.
    """
    url = f"{base_url.rstrip('/')}/knowledge-stores/{ks_id}/items"
    headers = {"x-api-key": api_key}
    out: list[dict] = []
    async with httpx.AsyncClient(timeout=30.0) as client:
        page = 1
        while True:
            r = await client.get(url, headers=headers, params={"page": page})
            r.raise_for_status()
            j = r.json()
            data = j.get("data") or []
            for raw in data:
                ksi_id = raw.get("_id") or raw.get("id") or ""
                ksi_uuid = ksi_id[len("ksi_"):] if ksi_id.startswith("ksi_") else ksi_id
                out.append({"ksi_uuid": ksi_uuid, "asset_id": raw.get("asset_id") or ""})
            info = j.get("page_info") or {}
            total_pages = info.get("total_page") or 1
            if page >= total_pages:
                break
            page += 1
    return out

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["query"])


class QueryRequest(BaseModel):
    query: str
    scenario: str | None = None  # "A" | "B" | "C"


class QueryResponse(BaseModel):
    entity: str
    query: str
    timeline: list[dict]
    narrative_summary: str
    estimated_value: dict
    session_id: str
    source: str  # "jockey" | "mock"


def _mock_response(query: str, scenario: str | None) -> QueryResponse:
    """Return the seed payload when Jockey is not configured."""
    seed = load_seed("adidas_trend")
    return QueryResponse(
        entity=seed["entity"],
        query=query,
        timeline=seed["timeline"],
        narrative_summary=seed["narrative_summary"],
        estimated_value=seed["estimated_value"],
        session_id="mock_session_001",
        source="mock",
    )


# Illustrative per-clip unit price used when Jockey refuses to attach a
# dollar value to a qualitative query (e.g. "how has female presence
# evolved?"). The sample app is a brand-intelligence concept demo —
# not an actual valuation — so a $0 widget is worse than a transparently
# illustrative figure. $12,500/clip mirrors the value Jockey itself uses
# when it does estimate, so the number stays in the same ballpark.
_DEFAULT_UNIT_PRICE_USD = 12_500


def _backstop_monetization(
    estimated: dict,
    timeline: list[dict],
) -> dict:
    """Ensure the Revenue widget never reads $0 when there's evidence.

    Jockey sometimes returns ``estimated_brand_intelligence_value_usd=0``
    with a basis like "not a financial valuation exercise" for queries it
    treats as qualitative. If the timeline actually has mentions, fall
    back to an illustrative ``total_mentions * unit_price`` figure and
    rewrite the calculation_basis to match.
    """
    total = sum(int(p.get("frequency") or 0) for p in timeline)
    if not total:
        total = int(estimated.get("total_mentions") or 0)
    usd = int(estimated.get("estimated_brand_intelligence_value_usd") or 0)
    if total > 0 and usd <= 0:
        estimated = dict(estimated)
        estimated["total_mentions"] = total
        estimated["estimated_brand_intelligence_value_usd"] = total * _DEFAULT_UNIT_PRICE_USD
        estimated["calculation_basis"] = (
            f"Illustrative estimate: {total} verified clips × "
            f"${_DEFAULT_UNIT_PRICE_USD:,} per clip "
            "(default unit price applied because Jockey did not attach a financial value)."
        )
    return estimated


def _extract_structured_payload(jockey_response: dict) -> dict:
    """Pull the JSON Schema output text out of the /responses payload.

    The Responses API returns its structured text under
    `output[].content[].text` (the same shape OpenAI uses). We grab the
    first text node and parse it as JSON.
    """
    output = jockey_response.get("output") or []
    for item in output:
        for content in item.get("content", []) or []:
            text = content.get("text")
            if not text:
                continue
            try:
                return json.loads(text)
            except json.JSONDecodeError:
                continue
    # Fall back to top-level `text` if present.
    text = jockey_response.get("text")
    if isinstance(text, str):
        return json.loads(text)
    raise QueryError("No structured text found in Jockey response payload")


@router.post("/query", response_model=QueryResponse)
async def query(req: QueryRequest) -> QueryResponse:
    client = JockeyClient()

    # Dev convenience: fall back to seed data when env isn't fully configured.
    if not client.configured:
        logger.info("JockeyClient not configured — returning mock response")
        return _mock_response(req.query, req.scenario)

    # Cache lookup — same query within TTL skips the Jockey call entirely.
    cached = cache.get(req.query, req.scenario)
    if cached:
        logger.info("Cache hit for query")
        return QueryResponse(**cached)

    instructions = get_instructions(req.scenario)
    try:
        raw = await client.create_response(
            question=req.query,
            instructions=instructions,
            text_format=TREND_DATA_JSON_SCHEMA,
        )
    except QueryError as e:
        logger.exception("Jockey /responses failed: %s", e)
        raise HTTPException(status_code=502, detail=f"Jockey error: {e}") from e

    try:
        structured = _extract_structured_payload(raw)
        validated = TrendResponse(**structured)
    except (QueryError, ValidationError, json.JSONDecodeError) as e:
        logger.exception("Schema validation failed: %s", e)
        raise HTTPException(
            status_code=502,
            detail=f"Jockey returned malformed structured output: {e}",
        ) from e

    session_id = raw.get("session_id") or raw.get("id") or "unknown"

    # Enrich each timeline point's representative clip with thumbnail_url
    # and manifest_url. Jockey's structured-output path emits KSI UUIDs
    # (knowledge-store item IDs), but GET /assets/{id} only accepts the
    # 24-char hex asset primary key — so we resolve via list_ks_items first
    # to build a UUID->hex map. Without this step the UI gets placeholders.
    settings = get_settings()
    api_key = settings.twelvelabs_api_key
    raw_ids = [
        p.representative_clip.asset_id
        for p in validated.timeline
        if p.representative_clip.asset_id
    ]

    uuid_to_hex: dict[str, str] = {}
    try:
        ks_items = await _list_all_ks_items(api_key, settings.ks_id, settings.jockey_base_url)
        uuid_to_hex = {item["ksi_uuid"]: item["asset_id"] for item in ks_items if item.get("asset_id")}
    except Exception as e:
        logger.warning("list_ks_items failed; thumbnails will be missing: %s", e)

    hex_ids = []
    for rid in raw_ids:
        if jockey_api.is_hex_asset_id(rid):
            hex_ids.append(rid)
        elif rid in uuid_to_hex:
            hex_ids.append(uuid_to_hex[rid])

    resolved = await jockey_api.resolve_assets(api_key, hex_ids)

    enriched_timeline = []
    for point in validated.timeline:
        clip = point.representative_clip.model_dump()
        rid = clip["asset_id"]
        hex_id = rid if jockey_api.is_hex_asset_id(rid) else uuid_to_hex.get(rid)
        info = resolved.get(hex_id) if hex_id else None
        if info:
            clip["thumbnail_url"] = info.get("thumbnail_url")
            clip["manifest_url"] = info.get("manifest_url")
            clip["duration"] = info.get("duration")
        enriched_timeline.append(
            {**point.model_dump(), "representative_clip": clip}
        )

    estimated_value = _backstop_monetization(
        validated.estimated_value.model_dump(),
        enriched_timeline,
    )

    response = QueryResponse(
        entity=validated.entity,
        query=req.query,
        timeline=enriched_timeline,
        narrative_summary=validated.narrative_summary,
        estimated_value=estimated_value,
        session_id=session_id,
        source="jockey",
    )
    # Quality gate: don't cache "I couldn't find anything" responses.
    # Jockey is stochastic — a future call might find evidence the first
    # one missed. Caching an empty timeline would lock the user into the
    # bad answer for 24h.
    if enriched_timeline:
        cache.put(req.query, req.scenario, response.model_dump())
    else:
        logger.info("Empty timeline — skipping cache write so the next call can retry")
    return response
