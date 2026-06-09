"""CSV export — one row per scene, ready for licensing / handoff."""

import csv
import io
import re
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse

from app import cache
from app.routes.query import QueryRequest, query as query_route

router = APIRouter(prefix="/api/export", tags=["export"])


_CSV_COLUMNS = [
    "year",
    "frequency",
    "scene",
    "dominant_theme",
    "asset_id",
    "timestamp_start",
    "timestamp_end",
    "title",
    "reason",
    "thumbnail_url",
    "manifest_url",
]


def _slugify(text: str) -> str:
    """File-system safe slug. Limit length so filenames stay sane."""
    s = re.sub(r"[^A-Za-z0-9._-]+", "-", text.strip().lower())
    return s.strip("-")[:60] or "export"


@router.get("/csv")
async def export_csv(
    query: str = Query(..., description="Same query string that was run via /api/query"),
    scenario: str | None = Query(None),
) -> StreamingResponse:
    """Return the cached query result as CSV. Runs the query if not cached."""
    payload = cache.get(query, scenario)
    if payload is None:
        # Fall through to /api/query so the export endpoint is usable
        # without requiring a prior client-side call. Reuses caching + jockey
        # + mock fallback path unchanged.
        try:
            resp = await query_route(QueryRequest(query=query, scenario=scenario))
        except HTTPException:
            raise
        payload = resp.model_dump()

    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=_CSV_COLUMNS, quoting=csv.QUOTE_MINIMAL)
    writer.writeheader()
    for point in payload.get("timeline", []) or []:
        # One row per scene. Fall back to the single representative_clip for
        # older payloads that predate the `scenes` list.
        scenes = point.get("scenes") or []
        if not scenes:
            rep = point.get("representative_clip")
            scenes = [rep] if rep else []
        for idx, clip in enumerate(scenes, start=1):
            clip = clip or {}
            writer.writerow({
                "year": point.get("year", ""),
                "frequency": point.get("frequency", ""),
                "scene": idx,
                "dominant_theme": point.get("dominant_theme", ""),
                "asset_id": clip.get("asset_id", ""),
                "timestamp_start": clip.get("timestamp_start", ""),
                "timestamp_end": clip.get("timestamp_end", ""),
                "title": clip.get("title", ""),
                "reason": clip.get("reason", "") or "",
                "thumbnail_url": clip.get("thumbnail_url", "") or "",
                "manifest_url": clip.get("manifest_url", "") or "",
            })

    csv_text = buf.getvalue()
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    entity_slug = _slugify(payload.get("entity") or "export")
    filename = f"{entity_slug}-clips-{timestamp}.csv"

    return StreamingResponse(
        iter([csv_text]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
