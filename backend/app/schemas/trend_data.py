"""Pydantic models + JSON Schema for the Jockey `text.format` field.

The same shape is enforced two ways:
1. The JSON Schema dict is passed to Jockey so the model is constrained to
   produce conformant output (PRD success metric: 95%+ conformance).
2. The pydantic model validates the response on our side — anything that
   slips through schema enforcement still gets caught.
"""

from __future__ import annotations

import copy
from typing import Any

from pydantic import BaseModel, Field


class RepresentativeClip(BaseModel):
    asset_id: str
    timestamp_start: float
    timestamp_end: float
    title: str = ""
    # One-line explanation, from Jockey, of why this scene was selected
    # (what visual evidence of the entity it contains). Optional default
    # keeps older primed/seed payloads that predate the field valid.
    reason: str = ""
    # Enriched server-side after Jockey returns the timeline.
    thumbnail_url: str | None = None
    manifest_url: str | None = None
    duration: float | None = None


class Sentiment(BaseModel):
    # Prevailing tone of the year's coverage. Used by the Narrative Evolution
    # tab's sentiment overlay; absent for the brand-intelligence scenarios.
    label: str = ""  # "positive" | "neutral" | "negative"
    score: float = 0.0  # -1 (hostile) .. 1 (favorable)


class TimelinePoint(BaseModel):
    year: int = Field(ge=1900, le=2100)
    frequency: int = Field(ge=0)
    dominant_theme: str
    representative_clip: RepresentativeClip
    # Every distinct clip for this year, sorted by relevance descending.
    # `representative_clip` === `scenes[0]`. Defaults to empty for
    # backwards-compat with older primed payloads that predate this field.
    scenes: list[RepresentativeClip] = Field(default_factory=list)
    # Optional — only the Narrative Evolution scenario ("N") populates this.
    sentiment: Sentiment | None = None


class InflectionPoint(BaseModel):
    # A pivotal year where the narrative shifted (Narrative Evolution tab).
    year: int = Field(ge=1900, le=2100)
    label: str
    why: str = ""


class EstimatedValue(BaseModel):
    total_mentions: int = Field(ge=0)
    estimated_brand_intelligence_value_usd: int = Field(ge=0)
    calculation_basis: str


class TrendResponse(BaseModel):
    entity: str
    timeline: list[TimelinePoint]
    narrative_summary: str
    estimated_value: EstimatedValue
    # Optional — only the Narrative Evolution scenario ("N") populates this.
    inflection_points: list[InflectionPoint] = Field(default_factory=list)


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
                        "scenes",
                    ],
                    "properties": {
                        "year": {"type": "integer"},
                        "frequency": {
                            "type": "integer",
                            "description": (
                                "Number of distinct clips for this year. Must "
                                "equal the number of entries in `scenes`."
                            ),
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
                                "reason",
                            ],
                            "properties": {
                                "asset_id": {"type": "string"},
                                "timestamp_start": {"type": "number"},
                                "timestamp_end": {"type": "number"},
                                "title": {"type": "string"},
                                "reason": {
                                    "type": "string",
                                    "description": (
                                        "One short sentence on why this clip "
                                        "was selected — the specific visual "
                                        "evidence of the entity in it (e.g. "
                                        "'three-stripes visible on the Germany "
                                        "home kit')."
                                    ),
                                },
                            },
                        },
                        "scenes": {
                            "type": "array",
                            "description": (
                                "Every distinct clip where the entity is "
                                "visually present this year, sorted by "
                                "prominence. The first entry MUST equal "
                                "representative_clip."
                            ),
                            "items": {
                                "type": "object",
                                "additionalProperties": False,
                                "required": [
                                    "asset_id",
                                    "timestamp_start",
                                    "timestamp_end",
                                    "title",
                                    "reason",
                                ],
                                "properties": {
                                    "asset_id": {"type": "string"},
                                    "timestamp_start": {"type": "number"},
                                    "timestamp_end": {"type": "number"},
                                    "title": {"type": "string"},
                                    "reason": {
                                        "type": "string",
                                        "description": (
                                            "One short sentence on why this "
                                            "clip was selected — the specific "
                                            "visual evidence of the entity in "
                                            "it (e.g. 'three-stripes visible "
                                            "on the Germany home kit')."
                                        ),
                                    },
                                },
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


# ─────────────────────────────────────────────────────────
# Narrative Evolution schema (scenario "N"). Derived from the
# brand schema so the two stay in sync, then adds a required
# per-year `sentiment` (for the tone overlay) and a required
# top-level `inflection_points` list. Kept separate so the
# brand scenarios' output shape is untouched. Every property
# is listed in `required` because Jockey's structured-output
# decoder (OpenAI-style) rejects optional keys under
# additionalProperties:false.
# ─────────────────────────────────────────────────────────

_SENTIMENT_SCHEMA: dict[str, Any] = {
    "type": "object",
    "additionalProperties": False,
    "required": ["label", "score"],
    "properties": {
        "label": {
            "type": "string",
            "description": "Prevailing tone: positive | neutral | negative.",
        },
        "score": {
            "type": "number",
            "description": "Tone score from -1 (hostile coverage) to 1 (favorable).",
        },
    },
}

_INFLECTION_POINTS_SCHEMA: dict[str, Any] = {
    "type": "array",
    "description": (
        "2–4 pivotal years where the subject's media narrative shifted."
    ),
    "items": {
        "type": "object",
        "additionalProperties": False,
        "required": ["year", "label", "why"],
        "properties": {
            "year": {"type": "integer"},
            "label": {"type": "string", "description": "Short phrase for the shift."},
            "why": {"type": "string", "description": "One sentence on what changed."},
        },
    },
}


def _build_narrative_schema() -> dict[str, Any]:
    s = copy.deepcopy(TREND_DATA_JSON_SCHEMA)
    s["name"] = "narrative_trend_data"
    schema = s["schema"]
    # Required per-year sentiment for the tone overlay.
    item = schema["properties"]["timeline"]["items"]
    item["properties"]["sentiment"] = _SENTIMENT_SCHEMA
    item["required"].append("sentiment")
    # Required top-level inflection points.
    schema["properties"]["inflection_points"] = _INFLECTION_POINTS_SCHEMA
    schema["required"].append("inflection_points")
    return s


NARRATIVE_DATA_JSON_SCHEMA: dict[str, Any] = _build_narrative_schema()
