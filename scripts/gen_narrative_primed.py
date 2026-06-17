#!/usr/bin/env python3
"""One-off: run the Narrative Evolution (scenario "N") demo query against the
LIVE Trump KS and snapshot the response into data/primed/scenario_n.json.

Mirrors regen_primed.py: clears the cache entry so the call actually hits
Jockey, runs the real /api/query handler in-process, prints a summary, and
writes {query, scenario, payload} for startup hydration (pinned, never-expiring).

Run from repo root with the backend venv:
    backend/.venv/bin/python scripts/gen_narrative_primed.py
"""

from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
PRIMED_DIR = REPO_ROOT / "data" / "primed"
sys.path.insert(0, str(REPO_ROOT / "backend"))

QUERY = "How has Donald Trump's media portrayal evolved from the 1980s to 2026?"
SCENARIO = "N"


async def _main() -> int:
    from app import cache
    from app.routes.query import QueryRequest, query
    from app.deps.jockey_client import JockeyClient
    from app.config import get_settings

    s = get_settings()
    if not (s.twelvelabs_api_key and (s.ks_id_narrative or s.ks_id)):
        print("NOT configured: set TWELVELABS_API_KEY + KS_ID_NARRATIVE in .env")
        return 1
    print(f"narrative KS: {s.ks_for_scenario('N')}")

    # Make sure we hit the live API, not a cached entry.
    cache.clear()

    print(f"Running live query (scenario N): {QUERY!r}\nThis can take 60-240s...")
    resp = await query(QueryRequest(query=QUERY, scenario=SCENARIO))
    payload = resp.model_dump()

    tl = payload["timeline"]
    years = [p["year"] for p in tl]
    with_sent = sum(1 for p in tl if p.get("sentiment"))
    n_scenes = sum(len(p.get("scenes") or []) for p in tl)
    print("\n=== RESULT ===")
    print("source:", payload["source"])
    print("entity:", payload["entity"])
    print(f"timeline points: {len(tl)}  years: {years}")
    print(f"points with sentiment: {with_sent}/{len(tl)}  total scenes: {n_scenes}")
    print("inflection_points:", json.dumps(payload.get("inflection_points"), indent=1)[:800])
    if tl:
        p0 = tl[0]
        print("sample point:", p0["year"], "|", p0["dominant_theme"],
              "| sentiment:", p0.get("sentiment"))
        sc = (p0.get("scenes") or [{}])[0]
        print("  sample scene reason:", sc.get("reason"))
        print("  sample thumbnail:", sc.get("thumbnail_url"))

    if not tl:
        print("\nEMPTY timeline — not writing snapshot (live results are stochastic; re-run).")
        return 2

    PRIMED_DIR.mkdir(parents=True, exist_ok=True)
    out = PRIMED_DIR / "scenario_n.json"
    out.write_text(
        json.dumps({"query": QUERY, "scenario": SCENARIO, "payload": payload}, indent=2),
        encoding="utf-8",
    )
    print(f"\nWrote {out} ({out.stat().st_size} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(_main()))
