"""Direct HTTP client for the Jockey Responses API.

This module talks to `POST /v1.3/responses` directly (passing `instructions`,
`text.format`, and `stream`) and reuses the shared error classes from
`app.deps.jockey_assets` for consistency.
"""

from __future__ import annotations

import json
from collections.abc import AsyncIterator
from typing import Any

import httpx

from app.deps.jockey_assets import (
    AuthError,
    EndpointNotAuthorizedError,
    KnowledgeStoreNotReady,
    QueryError,
)

from app.config import get_settings

DEFAULT_MODEL = "jockey1.0"
# Jockey reasoning over a multi-video KS can run 60–240s. Match the skill's
# Claude Desktop install (timeout: 300000 ms) to avoid premature 502s.
DEFAULT_TIMEOUT = 300.0


class JockeyClient:
    """Thin async client around `POST /v1.3/responses` that supports the
    PRD's three differentiators: `instructions`, `text.format`, `stream`.
    """

    def __init__(
        self,
        *,
        api_key: str | None = None,
        base_url: str | None = None,
        ks_id: str | None = None,
        model: str = DEFAULT_MODEL,
    ) -> None:
        settings = get_settings()
        self.api_key = api_key or settings.twelvelabs_api_key
        self.base_url = (base_url or settings.jockey_base_url).rstrip("/")
        self.ks_id = ks_id or settings.ks_id
        self.model = model

    @property
    def configured(self) -> bool:
        """True only when both an API key and a KS_ID are present."""
        return bool(self.api_key and self.ks_id)

    def _headers(self) -> dict[str, str]:
        return {
            "x-api-key": self.api_key,
            "Content-Type": "application/json",
        }

    def _build_body(
        self,
        *,
        question: str,
        instructions: str | None,
        session_id: str | None,
        text_format: dict[str, Any] | None,
        stream: bool,
    ) -> dict[str, Any]:
        body: dict[str, Any] = {
            "model": self.model,
            "knowledge_store_id": self.ks_id,
            "input": [
                {"type": "message", "role": "user", "content": question}
            ],
            "stream": stream,
        }
        if instructions:
            body["instructions"] = instructions
        if session_id:
            body["session_id"] = session_id
        if text_format:
            body["text"] = {"format": text_format}
        return body

    def _raise_for_status(self, resp: httpx.Response) -> None:
        if resp.status_code in (401, 403):
            raise AuthError(f"/responses auth failed: {resp.status_code} {resp.text[:200]}")
        if resp.status_code == 404:
            raise KnowledgeStoreNotReady(
                f"/responses 404 — KS {self.ks_id} not found or not ready: {resp.text[:200]}"
            )
        if resp.status_code == 422:
            # Surface the schema validation message verbatim so we can iterate
            # on the JSON Schema during development.
            raise QueryError(f"/responses 422 schema rejection: {resp.text[:500]}")
        if resp.status_code >= 400:
            raise QueryError(f"/responses {resp.status_code}: {resp.text[:500]}")

    async def create_response(
        self,
        *,
        question: str,
        instructions: str | None = None,
        session_id: str | None = None,
        text_format: dict[str, Any] | None = None,
        timeout: float = DEFAULT_TIMEOUT,
    ) -> dict[str, Any]:
        """Non-streaming POST /responses. Returns the parsed JSON payload."""
        if not self.configured:
            raise QueryError(
                "JockeyClient is not configured (missing TWELVELABS_API_KEY or KS_ID)"
            )
        body = self._build_body(
            question=question,
            instructions=instructions,
            session_id=session_id,
            text_format=text_format,
            stream=False,
        )
        url = f"{self.base_url}/responses"
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = await client.post(url, json=body, headers=self._headers())
        except httpx.HTTPError as e:
            raise QueryError(f"/responses HTTP error: {e}") from e
        self._raise_for_status(resp)
        try:
            return resp.json()
        except ValueError as e:
            raise QueryError(f"/responses returned non-JSON: {resp.text[:200]}") from e

    async def stream_response(
        self,
        *,
        question: str,
        instructions: str | None = None,
        session_id: str | None = None,
        timeout: float = DEFAULT_TIMEOUT,
    ) -> AsyncIterator[dict[str, Any]]:
        """Streaming POST /responses. Yields decoded SSE events as dicts.

        The Jockey SSE wire format follows the `data: <json>\\n\\n` pattern with
        `data: [DONE]` to terminate. We yield each `{type, ...}` event so the
        route can forward `delta` chunks to the browser.
        """
        if not self.configured:
            raise QueryError(
                "JockeyClient is not configured (missing TWELVELABS_API_KEY or KS_ID)"
            )
        body = self._build_body(
            question=question,
            instructions=instructions,
            session_id=session_id,
            text_format=None,
            stream=True,
        )
        url = f"{self.base_url}/responses"
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                async with client.stream(
                    "POST", url, json=body, headers=self._headers()
                ) as resp:
                    self._raise_for_status(resp)
                    async for raw_line in resp.aiter_lines():
                        if not raw_line or not raw_line.startswith("data: "):
                            continue
                        payload = raw_line[len("data: ") :].strip()
                        if payload == "[DONE]":
                            return
                        try:
                            yield json.loads(payload)
                        except json.JSONDecodeError:
                            # Skip malformed events rather than killing the
                            # whole stream — Jockey occasionally emits keep-
                            # alive comments.
                            continue
        except httpx.HTTPError as e:
            raise QueryError(f"/responses stream HTTP error: {e}") from e


__all__ = [
    "JockeyClient",
    "AuthError",
    "EndpointNotAuthorizedError",
    "KnowledgeStoreNotReady",
    "QueryError",
]
