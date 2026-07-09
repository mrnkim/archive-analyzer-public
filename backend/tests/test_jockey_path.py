"""Tests for the Jockey-configured path with the HTTP client mocked.

Verifies: cache lookup, structured-output parsing + validation, scenario
prompt selection, and SSE proxy delta extraction.
"""

import json
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app import cache
from app.main import app
from app.routes import query as query_route
from app.routes import sessions as sessions_route
from app.routes import stream as stream_route
from app.deps.jockey_client import QueryError

client = TestClient(app)


def _make_jockey_payload(text_json: str, session_id: str = "sess_123") -> dict:
    """Build a /responses payload that contains text_json under output[].content[]."""
    return {
        "id": "resp_abc",
        "session_id": session_id,
        "output": [
            {
                "type": "message",
                "content": [{"type": "output_text", "text": text_json}],
            }
        ],
    }


VALID_STRUCTURED_PAYLOAD = json.dumps(
    {
        "entity": "Adidas",
        "timeline": [
            {
                "year": 2012,
                "frequency": 87,
                "dominant_theme": "London Olympics lead sponsor",
                "representative_clip": {
                    "asset_id": "fake_asset_001",
                    "timestamp_start": 0.0,
                    "timestamp_end": 30.0,
                    "title": "Take the Stage",
                },
            }
        ],
        "narrative_summary": "Test narrative.",
        "estimated_value": {
            "total_mentions": 87,
            "estimated_brand_intelligence_value_usd": 3915,
            "calculation_basis": "87 mentions × $45",
        },
    }
)


@pytest.fixture(autouse=True)
def _clear_cache():
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def configured_client(monkeypatch):
    """Make JockeyClient.configured == True without touching .env."""
    monkeypatch.setattr(query_route.JockeyClient, "configured", True)
    monkeypatch.setattr(sessions_route.JockeyClient, "configured", True)
    monkeypatch.setattr(stream_route.JockeyClient, "configured", True)


def test_query_calls_jockey_when_configured(configured_client):
    fake = _make_jockey_payload(VALID_STRUCTURED_PAYLOAD)

    async def fake_create_response(self, **kwargs):
        # Verify scenario A's instructions reached the call.
        assert "brand intelligence analyst" in kwargs["instructions"]
        # And the JSON Schema was passed.
        assert kwargs["text_format"]["name"] == "trend_data"
        return fake

    with patch.object(
        query_route.JockeyClient,
        "create_response",
        new=fake_create_response,
    ):
        r = client.post(
            "/api/query",
            json={"query": "Adidas 1990-2025", "scenario": "A"},
        )

    assert r.status_code == 200
    body = r.json()
    assert body["source"] == "jockey"
    assert body["session_id"] == "sess_123"
    assert body["timeline"][0]["year"] == 2012


def test_query_uses_cache_on_second_call(configured_client):
    fake = _make_jockey_payload(VALID_STRUCTURED_PAYLOAD)
    calls = {"n": 0}

    async def fake_create_response(self, **kwargs):
        calls["n"] += 1
        return fake

    with patch.object(
        query_route.JockeyClient,
        "create_response",
        new=fake_create_response,
    ):
        r1 = client.post("/api/query", json={"query": "Adidas", "scenario": "A"})
        r2 = client.post("/api/query", json={"query": "Adidas", "scenario": "A"})

    assert r1.status_code == 200
    assert r2.status_code == 200
    assert calls["n"] == 1  # second call served from cache
    assert r2.json()["source"] == "cache"


def test_query_502_on_malformed_jockey_payload(configured_client):
    bad = _make_jockey_payload(json.dumps({"entity": "Adidas"}))  # missing fields

    async def fake_create_response(self, **kwargs):
        return bad

    with patch.object(
        query_route.JockeyClient,
        "create_response",
        new=fake_create_response,
    ):
        r = client.post("/api/query", json={"query": "Adidas", "scenario": "A"})

    assert r.status_code == 502


def test_followup_extracts_text_and_session_id(configured_client):
    fake = {
        "id": "resp_xyz",
        "session_id": "sess_continuing_456",
        "output": [
            {
                "content": [
                    {"type": "output_text", "text": "Because of the London Olympics."}
                ]
            }
        ],
    }

    async def fake_create_response(self, **kwargs):
        # session_id should be passed through.
        assert kwargs["session_id"] == "sess_existing_123"
        assert len(kwargs["instructions"]) < 500
        assert "summary_bullets" not in kwargs["instructions"]
        return fake

    with patch.object(
        sessions_route.JockeyClient,
        "create_response",
        new=fake_create_response,
    ):
        r = client.post(
            "/api/sessions/sess_existing_123/messages",
            json={"message": "Why?", "scenario": "A"},
        )

    assert r.status_code == 200
    body = r.json()
    assert body["source"] == "jockey"
    assert body["session_id"] == "sess_continuing_456"
    assert "London Olympics" in body["answer"]


def test_followup_returns_context_answer_when_jockey_fails(configured_client):
    async def fake_create_response(self, **kwargs):
        raise QueryError("boom")

    with patch.object(
        sessions_route.JockeyClient,
        "create_response",
        new=fake_create_response,
    ):
        r = client.post(
            "/api/sessions/sess_existing_123/messages",
            json={
                "message": "why peak in 2018?",
                "scenario": "A",
                "context": {
                    "year": 2018,
                    "theme": "Football + sustainability + tournament hardware",
                    "frequency": 3,
                    "clip_title": "Parley for the Oceans",
                    "clip_reason": "Parley branding makes the brand explicit.",
                },
            },
        )

    assert r.status_code == 200
    body = r.json()
    assert body["source"] == "context"
    assert "2018" in body["answer"]
    assert "Football + sustainability" in body["answer"]


def test_followup_can_use_result_context_without_session(configured_client):
    async def fake_create_response(self, **kwargs):
        raise AssertionError("Jockey should not be called for use_session=false")

    with patch.object(
        sessions_route.JockeyClient,
        "create_response",
        new=fake_create_response,
    ):
        r = client.post(
            "/api/sessions/stale_cached_session/messages",
            json={
                "message": "what is the biggest insight overall?",
                "scenario": "A",
                "use_session": False,
                "context": {
                    "type": "result",
                    "timeline": [
                        {"year": 2018, "frequency": 3, "theme": "Peak Adidas visibility"},
                        {"year": 2024, "frequency": 2, "theme": "Euro kit visibility"},
                    ],
                    "summary_bullets": [
                        {"year": 2018, "headline": "Peak Adidas visibility", "text": "The strongest cluster."}
                    ],
                },
            },
        )

    assert r.status_code == 200
    body = r.json()
    assert body["source"] == "context"
    assert "Peak Adidas visibility" in body["answer"]


def test_extract_delta_handles_common_shapes():
    """Sanity-check the SSE event parser."""
    assert stream_route._extract_delta({"delta": "hello"}) == "hello"
    assert stream_route._extract_delta(
        {"type": "response.output_text.delta", "delta": "world"}
    ) == "world"
    assert stream_route._extract_delta({"type": "response.completed"}) is None
