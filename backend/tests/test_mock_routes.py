"""Mock-fallback tests — verify that with no KS_ID configured (the default in
CI / fresh checkouts), every route still works using seed data."""

import pytest
from fastapi.testclient import TestClient

from app import cache
from app.main import app
from app.routes import query as query_route
from app.routes import sessions as sessions_route
from app.routes import stream as stream_route

client = TestClient(app)


@pytest.fixture(autouse=True)
def _force_mock_mode(monkeypatch):
    """Even if the local .env has KS_ID + key set (after Phase 3 ingest),
    force every route to take the seed-fallback path so these tests stay
    deterministic and don't hit the real Jockey API."""
    monkeypatch.setattr(query_route.JockeyClient, "configured", False)
    monkeypatch.setattr(sessions_route.JockeyClient, "configured", False)
    monkeypatch.setattr(stream_route.JockeyClient, "configured", False)
    cache.clear()
    yield
    cache.clear()


def test_query_returns_seed_data_in_mock_mode():
    r = client.post("/api/query", json={"query": "Adidas 1990-2025"})
    assert r.status_code == 200
    body = r.json()
    assert body["entity"] == "Adidas"
    assert body["source"] == "mock"
    assert len(body["timeline"]) >= 20
    # Verify the 2012 spike.
    spike = next(p for p in body["timeline"] if p["year"] == 2012)
    assert spike["frequency"] == 87
    assert "session_id" in body


def test_session_followup_matches_2012_question_in_mock_mode():
    r = client.post(
        "/api/sessions/mock_session_001/messages",
        json={"message": "Why did 2012 spike?"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["matched_key"] == "2012"
    assert body["source"] == "mock"
    assert "London" in body["answer"]


def test_session_followup_matches_nike_comparison_in_mock_mode():
    r = client.post(
        "/api/sessions/mock_session_001/messages",
        json={"message": "Compare with Nike"},
    )
    body = r.json()
    assert body["matched_key"] == "nike"
    assert body["source"] == "mock"


def test_session_followup_default_when_no_match_in_mock_mode():
    r = client.post(
        "/api/sessions/mock_session_001/messages",
        json={"message": "totally unrelated question"},
    )
    body = r.json()
    assert body["matched_key"] is None
    assert body["source"] == "mock"


def test_stream_endpoint_responds_in_mock_mode():
    with client.stream("GET", "/api/stream?query=test") as response:
        assert response.status_code == 200
        assert response.headers["content-type"].startswith("text/event-stream")
