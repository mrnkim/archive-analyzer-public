"""CSV export tests — mock-mode (no KS_ID) variant uses seed data."""

import csv
import io

import pytest
from fastapi.testclient import TestClient

from app import cache
from app.main import app
from app.routes import export as export_route
from app.routes import query as query_route
from app.routes import sessions as sessions_route
from app.routes import stream as stream_route

client = TestClient(app)


@pytest.fixture(autouse=True)
def _force_mock_mode(monkeypatch):
    monkeypatch.setattr(query_route.JockeyClient, "configured", False)
    monkeypatch.setattr(sessions_route.JockeyClient, "configured", False)
    monkeypatch.setattr(stream_route.JockeyClient, "configured", False)
    cache.clear()
    yield
    cache.clear()


def test_export_csv_returns_well_formed_csv():
    r = client.get("/api/export/csv", params={"query": "Adidas timeline"})
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("text/csv")
    assert "attachment" in r.headers["content-disposition"]
    assert ".csv" in r.headers["content-disposition"]

    rows = list(csv.DictReader(io.StringIO(r.text)))
    assert len(rows) >= 20  # seed has 22
    headers = set(rows[0].keys())
    assert {"year", "frequency", "dominant_theme", "asset_id", "title"}.issubset(headers)

    # Spot-check the 2012 spike row.
    row_2012 = next(r for r in rows if r["year"] == "2012")
    assert int(row_2012["frequency"]) == 87


def test_export_csv_missing_query_param_returns_422():
    r = client.get("/api/export/csv")
    assert r.status_code == 422


def test_slugify_helper():
    assert export_route._slugify("Adidas 1990-2025") == "adidas-1990-2025"
    assert export_route._slugify("") == "export"
    assert export_route._slugify("a" * 200).count("a") <= 60
