#!/usr/bin/env python3
"""Regenerate the demo (primed) JSON snapshots against the LIVE Jockey API.

Reads the {query, scenario} from each existing `data/primed/scenario_*.json`,
clears the SQLite cache so the calls actually hit Jockey, runs each query
in-process through the real `/api/query` handler, and writes the fresh
response back as `{query, scenario, payload}`.

Use this after changing the JSON Schema / scenario prompts (e.g. adding the
per-scene `reason` field) so the committed demo data reflects real Jockey
output. Old snapshots are backed up to `data/primed/_backup_<name>.json`.

Run from the repo root with the backend venv:
    backend/.venv/bin/python scripts/regen_primed.py

Note: live results are stochastic — year coverage and scene counts vary
run to run. Re-run `scripts/refresh_video_titles.py` afterwards.
"""

from __future__ import annotations

import asyncio
import json
import shutil
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
PRIMED_DIR = REPO_ROOT / "data" / "primed"
CACHE_PATH = REPO_ROOT / "data" / "runtime" / "query_cache.sqlite"

# Make `app` importable.
sys.path.insert(0, str(REPO_ROOT / "backend"))


async def _main() -> int:
    from app.routes.query import QueryRequest, query  # noqa: WPS433
    from app.deps.jockey_client import JockeyClient  # noqa: WPS433

    if not JockeyClient().configured:
        print(
            "ERROR: Jockey is not configured. Set TWELVELABS_API_KEY and KS_ID "
            "in .env before regenerating.",
            file=sys.stderr,
        )
        return 1

    # Clear the cache so query() misses and calls Jockey live.
    if CACHE_PATH.exists():
        CACHE_PATH.unlink()
        print(f"cleared cache {CACHE_PATH}")

    files = sorted(PRIMED_DIR.glob("scenario_*.json"))
    if not files:
        print("no primed files found", file=sys.stderr)
        return 1

    for path in files:
        spec = json.loads(path.read_text())
        q, scenario = spec.get("query"), spec.get("scenario")
        print(f"\n=== {path.name} | scenario={scenario} ===\n  {q}")

        resp = await query(QueryRequest(query=q, scenario=scenario))
        payload = resp.model_dump()

        n_pts = len(payload.get("timeline", []))
        n_reasons = sum(
            1
            for pt in payload.get("timeline", [])
            for s in pt.get("scenes", [])
            if (s.get("reason") or "").strip()
        )
        n_scenes = sum(len(pt.get("scenes", [])) for pt in payload.get("timeline", []))
        if n_pts == 0:
            print("  !! empty timeline — Jockey found nothing this run; NOT overwriting")
            continue

        # Back up the old snapshot once, then overwrite.
        backup = path.with_name(f"_backup_{path.name}")
        if not backup.exists():
            shutil.copy2(path, backup)
        path.write_text(
            json.dumps({"query": q, "scenario": scenario, "payload": payload},
                       ensure_ascii=False, indent=2)
        )
        print(f"  wrote {n_pts} years, {n_scenes} scenes, {n_reasons} with reason")

    print("\nDone. Next: backend/.venv/bin/python scripts/refresh_video_titles.py")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(_main()))
