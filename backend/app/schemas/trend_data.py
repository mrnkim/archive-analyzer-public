"""Pydantic models + JSON Schema for the Jockey `text.format` field.

The same shape is enforced two ways:
1. The JSON Schema dict is passed to Jockey so the model is constrained to
   produce conformant output (PRD success metric: 95%+ conformance).
2. The pydantic model validates the response on our side — anything that
   slips through schema enforcement still gets caught.
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class RepresentativeClip(BaseModel):
    asset_id: str
    timestamp_start: float
    timestamp_end: float
    title: str = ""
    # Enriched server-side after Jockey returns the timeline.
    thumbnail_url: str | None = None
    manifest_url: str | None = None
    duration: float | None = None


class TimelinePoint(BaseModel):
    year: int = Field(ge=1900, le=2100)
    frequency: int = Field(ge=0)
    dominant_theme: str
    representative_clip: RepresentativeClip


class EstimatedValue(BaseModel):
    total_mentions: int = Field(ge=0)
    estimated_brand_intelligence_value_usd: int = Field(ge=0)
    calculation_basis: str


class TrendResponse(BaseModel):
    entity: str
    timeline: list[TimelinePoint]
    narrative_summary: str
    estimated_value: EstimatedValue


# ─────────────────────────────────────────────────────────
# JSON Schema for Jockey's `text.format` — kept in sync with
# the pydantic model above. Hand-authored (rather than dumped
# from pydantic) because Jockey accepts only a subset of
# JSON Schema and we want explicit control over which keys
# it sees.
# ─────────────────────────────────────────────────────────

TREND_DATA_JSON_SCHEMA: dict[str, Any] = {
    "type": "json_schema",
    "name": "trend_data",
    "schema": {
        "type": "object",
        "additionalProperties": False,
        "required": ["entity", "timeline", "narrative_summary", "estimated_value"],
        "properties": {
            "entity": {
                "type": "string",
                "description": "Subject entity being analyzed (e.g. brand, person, theme).",
            },
            "timeline": {
                "type": "array",
                "description": "Yearly breakdown of entity exposure.",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": [
                        "year",
                        "frequency",
                        "dominant_theme",
                        "representative_clip",
                    ],
                    "properties": {
                        "year": {"type": "integer"},
                        "frequency": {
                            "type": "integer",
                            "description": "Number of mentions / clips in this year.",
                        },
                        "dominant_theme": {
                            "type": "string",
                            "description": "Short label for the year's dominant context.",
                        },
                        "representative_clip": {
                            "type": "object",
                            "additionalProperties": False,
                            "required": [
                                "asset_id",
                                "timestamp_start",
                                "timestamp_end",
                                "title",
                            ],
                            "properties": {
                                "asset_id": {"type": "string"},
                                "timestamp_start": {"type": "number"},
                                "timestamp_end": {"type": "number"},
                                "title": {"type": "string"},
                            },
                        },
                    },
                },
            },
            "narrative_summary": {
                "type": "string",
                "description": "Two-to-four paragraph prose summary of the trend.",
            },
            "estimated_value": {
                "type": "object",
                "additionalProperties": False,
                "required": [
                    "total_mentions",
                    "estimated_brand_intelligence_value_usd",
                    "calculation_basis",
                ],
                "properties": {
                    "total_mentions": {"type": "integer"},
                    "estimated_brand_intelligence_value_usd": {"type": "integer"},
                    "calculation_basis": {"type": "string"},
                },
            },
        },
    },
}
