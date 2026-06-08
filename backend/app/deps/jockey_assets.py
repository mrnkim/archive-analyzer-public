"""Asset / KS-item resolution for the Jockey v1.3 API.

Extracted from the (private) Jockey skill — only the slice the backend
needs at runtime: error types + asset/KS-item lookups used to enrich the
citations returned by ``POST /v1.3/responses``. Internal-only references
(QA hostnames, ticket IDs, platform-team coaching) were dropped during
extraction; behavior is otherwise identical to the skill's client.
"""

from __future__ import annotations

import asyncio
import os
import re
from typing import Any

import httpx

DEFAULT_BASE_URL = "https://api.twelvelabs.io/v1.3"
CONCURRENCY_LIMIT = 10
_HEX_ID_RE = re.compile(r"^[a-f0-9]{24}$", re.IGNORECASE)


def get_base_url() -> str:
    """Active API base URL, honoring the TWELVELABS_API_BASE override."""
    return os.environ.get("TWELVELABS_API_BASE", DEFAULT_BASE_URL)


def is_hex_asset_id(s: str) -> bool:
    """True if ``s`` is the 24-char hex shape that ``/assets/{id}`` accepts."""
    return isinstance(s, str) and bool(_HEX_ID_RE.match(s))


# ──────────────────────────────────────────────────────────────────
# Errors
# ──────────────────────────────────────────────────────────────────


class JockeyError(Exception):
    """Base exception for any Jockey API failure."""


class AuthError(JockeyError):
    """Missing/invalid API key, or the API rejected the credential."""


class IngestError(JockeyError):
    """4xx client error during a write/ingest call."""


class KnowledgeStoreNotReady(JockeyError):
    """404 — knowledge store deleted or never existed."""


class AssetNotFound(JockeyError):
    """404 — asset deleted or never existed."""


class QueryError(JockeyError):
    """Generic non-2xx / malformed response on a read path."""


class EndpointNotAuthorizedError(JockeyError):
    """The URL was reached, but the API key isn't authorized for this
    endpoint family — surfaced via the misleading ``endpoint_not_exists``
    404 shape, NOT a base-URL bug."""


def _is_endpoint_not_exists_404(resp: httpx.Response) -> bool:
    """Detect the ``endpoint_not_exists`` 404 (a key-scope issue, not a 404)."""
    if resp.status_code != 404:
        return False
    try:
        body = resp.json()
    except ValueError:
        return False
    return isinstance(body, dict) and body.get("code") == "endpoint_not_exists"


def _not_authorized_msg(resp: httpx.Response, *, context: str) -> str:
    try:
        path = resp.request.url.path  # type: ignore[union-attr]
    except (AttributeError, TypeError):
        path = "(unknown path)"
    return (
        f"API returned `endpoint_not_exists` for `{path}` (during {context}). "
        "The URL was reached — your API key is not authorized for this "
        "endpoint family. Use a key from a workspace that has it enabled."
    )


def _normalize_asset_payload(
    payload: dict[str, Any], *, fallback_id: str
) -> dict[str, Any]:
    """Map a raw ``GET /assets/{id}`` payload into the artifact-friendly shape.

    Fields nest under ``metadata`` on some shapes and live top-level on
    others; tolerate both. Missing fields surface as ``None``.
    """
    metadata = payload.get("metadata") or {}
    asset_id = (
        payload.get("_id")
        or payload.get("asset_id")
        or payload.get("id")
        or fallback_id
    )
    filename = (
        payload.get("filename") or metadata.get("filename") or payload.get("name") or ""
    )
    duration = (
        payload.get("duration")
        or payload.get("duration_seconds")
        or metadata.get("duration")
        or metadata.get("duration_seconds")
    )
    file_type = (
        payload.get("file_type")
        or payload.get("type")
        or metadata.get("file_type")
        or "video"
    )
    hls_obj = payload.get("hls") or {}
    thumb_obj = payload.get("thumbnail") or {}
    manifest_url = (
        hls_obj.get("manifest_url")
        or payload.get("manifest_url")
        or payload.get("hls_url")
        or metadata.get("manifest_url")
        or metadata.get("hls_url")
        or hls_obj.get("url")
    )
    thumbnail_url = (
        thumb_obj.get("representative_url")
        or thumb_obj.get("url")
        or payload.get("thumbnail_url")
        or payload.get("thumbnailUrl")
        or metadata.get("thumbnail_url")
    )
    return {
        "asset_id": asset_id,
        "filename": filename,
        "duration": float(duration) if isinstance(duration, int | float) else duration,
        "file_type": file_type,
        "manifest_url": manifest_url,
        "hls_status": hls_obj.get("status") if isinstance(hls_obj, dict) else None,
        "thumbnail_url": thumbnail_url,
        "thumbnail_status": (
            thumb_obj.get("status") if isinstance(thumb_obj, dict) else None
        ),
        "status": payload.get("status") or "unknown",
        "created_at": payload.get("created_at") or payload.get("createdAt"),
        "raw": payload,
    }


async def get_asset(api_key: str, asset_id: str) -> dict[str, Any]:
    """``GET /assets/{id}`` — resolve one asset's metadata (HLS, thumbnail)."""
    url = f"{get_base_url().rstrip('/')}/assets/{asset_id}"
    headers = {"x-api-key": api_key}
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(url, headers=headers)
    except httpx.HTTPError as e:
        raise QueryError(f"GET /assets/{asset_id} HTTP error: {e}") from e
    if resp.status_code in (401, 403):
        raise AuthError(
            f"GET /assets/{asset_id} auth failed: {resp.status_code} {resp.text[:200]}"
        )
    if resp.status_code == 404:
        if _is_endpoint_not_exists_404(resp):
            raise EndpointNotAuthorizedError(
                _not_authorized_msg(resp, context=f"GET /assets/{asset_id}")
            )
        raise AssetNotFound(
            f"GET /assets/{asset_id}: 404 — asset not found. "
            "It may have been deleted or never existed."
        )
    if resp.status_code >= 400:
        raise QueryError(f"GET /assets/{asset_id}: {resp.status_code} {resp.text[:500]}")
    try:
        payload = resp.json()
    except ValueError as e:
        raise QueryError(
            f"GET /assets/{asset_id} returned non-JSON: {resp.text[:200]}"
        ) from e
    return _normalize_asset_payload(payload, fallback_id=asset_id)


async def resolve_assets(
    api_key: str, asset_ids: list[str]
) -> dict[str, dict[str, Any] | None]:
    """Batch-resolve N assets in parallel under the worker semaphore.

    Individual failures surface as ``None`` in the result map — never block
    the caller on a single miss. Result is keyed by ``asset_id``.
    """
    if not asset_ids:
        return {}
    semaphore = asyncio.Semaphore(CONCURRENCY_LIMIT)
    out: dict[str, dict[str, Any] | None] = {}

    async def _one(aid: str) -> None:
        async with semaphore:
            try:
                out[aid] = await get_asset(api_key, aid)
            except Exception:
                out[aid] = None

    await asyncio.gather(*(_one(a) for a in asset_ids))
    return out


async def list_ks_items(
    api_key: str, ks_id: str, *, timeout_seconds: float = 30.0
) -> list[dict[str, Any]]:
    """``GET /knowledge-stores/{ks_id}/items`` — list every KS item.

    The canonical bridge between citation IDs (UUID-shaped, what
    ``<vref id="...">`` carries) and asset primary keys (24-char hex, what
    ``GET /assets/{id}`` accepts): each item returns BOTH identifiers.
    """
    url = f"{get_base_url().rstrip('/')}/knowledge-stores/{ks_id}/items"
    headers = {"x-api-key": api_key}
    try:
        async with httpx.AsyncClient(timeout=timeout_seconds) as client:
            resp = await client.get(url, headers=headers)
    except httpx.HTTPError as e:
        raise QueryError(f"GET /knowledge-stores/{ks_id}/items HTTP error: {e}") from e
    if resp.status_code in (401, 403):
        raise AuthError(
            f"GET /knowledge-stores/{ks_id}/items auth failed: "
            f"{resp.status_code} {resp.text[:200]}"
        )
    if resp.status_code == 404:
        if _is_endpoint_not_exists_404(resp):
            raise EndpointNotAuthorizedError(
                _not_authorized_msg(
                    resp, context=f"GET /knowledge-stores/{ks_id}/items"
                )
            )
        raise KnowledgeStoreNotReady(
            f"GET /knowledge-stores/{ks_id}/items: 404 — KS not found."
        )
    if resp.status_code >= 400:
        raise QueryError(
            f"GET /knowledge-stores/{ks_id}/items: {resp.status_code} {resp.text[:500]}"
        )
    try:
        payload = resp.json()
    except ValueError as e:
        raise QueryError(
            f"GET /knowledge-stores/{ks_id}/items returned non-JSON: {resp.text[:200]}"
        ) from e
    if isinstance(payload, dict):
        items = (
            payload.get("data")
            or payload.get("items")
            or payload.get("knowledge_store_items")
            or []
        )
    elif isinstance(payload, list):
        items = payload
    else:
        items = []
    out: list[dict[str, Any]] = []
    for raw in items:
        if not isinstance(raw, dict):
            continue
        ksi_id = raw.get("_id") or raw.get("id") or ""
        ksi_uuid = ksi_id[len("ksi_") :] if ksi_id.startswith("ksi_") else ksi_id
        out.append(
            {
                "ksi_id": ksi_id,
                "ksi_uuid": ksi_uuid,
                "asset_id": raw.get("asset_id") or "",
                "status": raw.get("status") or "unknown",
                "created_at": raw.get("created_at"),
                "updated_at": raw.get("updated_at"),
                "raw": raw,
            }
        )
    return out
