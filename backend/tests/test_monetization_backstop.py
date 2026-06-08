"""Unit tests for the monetization backstop — no Jockey, no HTTP."""

from app.routes.query import _backstop_monetization


def test_backstop_kicks_in_when_jockey_returns_zero_with_mentions():
    estimated = {
        "total_mentions": 5,
        "estimated_brand_intelligence_value_usd": 0,
        "calculation_basis": "not a financial valuation exercise",
    }
    timeline = [
        {"year": 2015, "frequency": 2},
        {"year": 2016, "frequency": 1},
        {"year": 2020, "frequency": 1},
        {"year": 2021, "frequency": 1},
    ]
    out = _backstop_monetization(estimated, timeline)
    assert out["estimated_brand_intelligence_value_usd"] == 5 * 12_500
    assert out["total_mentions"] == 5
    assert "Illustrative estimate" in out["calculation_basis"]


def test_backstop_preserves_existing_nonzero_value():
    estimated = {
        "total_mentions": 19,
        "estimated_brand_intelligence_value_usd": 237_500,
        "calculation_basis": "Jockey-provided",
    }
    timeline = [{"year": 2024, "frequency": 19}]
    out = _backstop_monetization(estimated, timeline)
    assert out["estimated_brand_intelligence_value_usd"] == 237_500
    assert out["calculation_basis"] == "Jockey-provided"


def test_backstop_stays_zero_when_no_mentions():
    estimated = {
        "total_mentions": 0,
        "estimated_brand_intelligence_value_usd": 0,
        "calculation_basis": "no evidence",
    }
    timeline: list[dict] = []
    out = _backstop_monetization(estimated, timeline)
    assert out["estimated_brand_intelligence_value_usd"] == 0


def test_backstop_recomputes_total_from_timeline_when_field_missing():
    estimated = {
        "total_mentions": 0,
        "estimated_brand_intelligence_value_usd": 0,
        "calculation_basis": "qualitative",
    }
    timeline = [{"year": 2020, "frequency": 3}, {"year": 2021, "frequency": 2}]
    out = _backstop_monetization(estimated, timeline)
    assert out["total_mentions"] == 5
    assert out["estimated_brand_intelligence_value_usd"] == 5 * 12_500
