#!/usr/bin/env python3
"""Resolve YouTube video titles for clips in the primed JSON snapshots.

Walks `data/primed/*.json`, extracts every `<youtube_id>.mp4` filename used
as a clip title, fetches the real video title from YouTube's oEmbed
endpoint (no API key needed), and patches the JSON in-place. Caches the
results in `data/video_titles.json` so subsequent runs are no-ops.

The backend also reads `data/video_titles.json` at query time so live-mode
responses get the same prettified titles.

Usage:
    python scripts/refresh_video_titles.py
    python scripts/refresh_video_titles.py --force   # re-fetch even cached
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

import httpx

REPO_ROOT = Path(__file__).resolve().parent.parent
PRIMED_DIR = REPO_ROOT / "data" / "primed"
TITLES_FILE = REPO_ROOT / "data" / "video_titles.json"

# `<11-char-id>.<ext>` — the format the ingest pipeline produces from yt-dlp.
YT_FILENAME_RE = re.compile(r"^([A-Za-z0-9_-]{11})\.(mp4|webm|mkv|mov)$")

OEMBED_URL = "https://www.youtube.com/oembed"


def _load_titles() -> dict[str, str]:
    if not TITLES_FILE.exists():
        return {}
    return json.loads(TITLES_FILE.read_text())


def _save_titles(titles: dict[str, str]) -> None:
    TITLES_FILE.write_text(json.dumps(titles, indent=2, sort_keys=True) + "\n")


def _collect_youtube_ids() -> set[str]:
    ids: set[str] = set()
    for path in sorted(PRIMED_DIR.glob("*.json")):
        data = json.loads(path.read_text())
        for point in data.get("payload", {}).get("timeline", []):
            scenes = point.get("scenes") or [point.get("representative_clip")]
            for scene in scenes:
                if not scene:
                    continue
                m = YT_FILENAME_RE.match(scene.get("title") or "")
                if m:
                    ids.add(m.group(1))
    return ids


def _fetch_title(client: httpx.Client, youtube_id: str) -> str | None:
    try:
        r = client.get(
            OEMBED_URL,
            params={
                "url": f"https://www.youtube.com/watch?v={youtube_id}",
                "format": "json",
            },
            timeout=10.0,
        )
        if r.status_code != 200:
            print(f"  ! {youtube_id}: HTTP {r.status_code}", file=sys.stderr)
            return None
        return r.json().get("title")
    except httpx.HTTPError as e:
        print(f"  ! {youtube_id}: {e}", file=sys.stderr)
        return None


def _patch_primed(titles: dict[str, str]) -> int:
    """Rewrite each scene's `title` if its filename maps to a known YouTube ID."""
    patched = 0
    for path in sorted(PRIMED_DIR.glob("*.json")):
        data = json.loads(path.read_text())
        changed = False
        for point in data.get("payload", {}).get("timeline", []):
            scenes = [point.get("representative_clip")] + list(point.get("scenes") or [])
            for scene in scenes:
                if not scene:
                    continue
                m = YT_FILENAME_RE.match(scene.get("title") or "")
                if not m:
                    continue
                real = titles.get(m.group(1))
                if real and scene["title"] != real:
                    scene["title"] = real
                    changed = True
        if changed:
            path.write_text(json.dumps(data, indent=2) + "\n")
            patched += 1
            print(f"  patched {path.relative_to(REPO_ROOT)}")
    return patched


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--force",
        action="store_true",
        help="Re-fetch titles even if already cached in video_titles.json",
    )
    args = parser.parse_args()

    ids = _collect_youtube_ids()
    print(f"found {len(ids)} unique YouTube IDs across {PRIMED_DIR}")

    titles = {} if args.force else _load_titles()
    missing = sorted(ids - set(titles))
    print(f"resolving {len(missing)} (cached: {len(set(titles) & ids)})")

    if missing:
        with httpx.Client() as client:
            for yid in missing:
                title = _fetch_title(client, yid)
                if title:
                    titles[yid] = title
                    print(f"  ✓ {yid}: {title}")
        _save_titles(titles)
        print(f"wrote {TITLES_FILE.relative_to(REPO_ROOT)}")

    patched = _patch_primed(titles)
    print(f"patched {patched} primed file(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
