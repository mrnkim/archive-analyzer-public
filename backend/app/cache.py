"""Simple SQLite-backed query cache with TTL.

Cuts Jockey API cost + perceived latency when the same demo query repeats
(common during sales walkthroughs). Stores the JSON response under the
hash of (query, scenario).
"""

from __future__ import annotations

import hashlib
import json
import sqlite3
import time
from pathlib import Path
from threading import Lock
from typing import Any

DEFAULT_TTL_SECONDS = 24 * 60 * 60  # 24h
_CACHE_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "runtime"
_CACHE_PATH = _CACHE_DIR / "query_cache.sqlite"
_lock = Lock()


def _ensure_db() -> sqlite3.Connection:
    _CACHE_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(_CACHE_PATH)
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS query_cache (
            key TEXT PRIMARY KEY,
            payload TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            pinned INTEGER NOT NULL DEFAULT 0
        )
        """
    )
    # Migrate older DBs (pre-`pinned`) that may persist in local dev.
    cols = {row[1] for row in conn.execute("PRAGMA table_info(query_cache)")}
    if "pinned" not in cols:
        conn.execute("ALTER TABLE query_cache ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0")
    return conn


def _key(query: str, scenario: str | None) -> str:
    raw = f"{(scenario or '').upper()}|{query.strip().lower()}"
    return hashlib.sha256(raw.encode()).hexdigest()


def get(query: str, scenario: str | None, ttl: int = DEFAULT_TTL_SECONDS) -> dict[str, Any] | None:
    """Return cached payload if present and fresh; else None.

    Pinned entries (the primed demo scenarios) never expire — the TTL only
    applies to ad-hoc user queries.
    """
    with _lock:
        conn = _ensure_db()
        try:
            row = conn.execute(
                "SELECT payload, created_at, pinned FROM query_cache WHERE key = ?",
                (_key(query, scenario),),
            ).fetchone()
        finally:
            conn.close()
    if not row:
        return None
    payload, created_at, pinned = row
    if not pinned and time.time() - created_at > ttl:
        return None
    try:
        return json.loads(payload)
    except json.JSONDecodeError:
        return None


def put(query: str, scenario: str | None, payload: dict[str, Any], pinned: bool = False) -> None:
    with _lock:
        conn = _ensure_db()
        try:
            conn.execute(
                "INSERT OR REPLACE INTO query_cache (key, payload, created_at, pinned) VALUES (?, ?, ?, ?)",
                (_key(query, scenario), json.dumps(payload), int(time.time()), 1 if pinned else 0),
            )
            conn.commit()
        finally:
            conn.close()


def clear() -> None:
    """Drop the entire cache. Useful for tests."""
    with _lock:
        conn = _ensure_db()
        try:
            conn.execute("DELETE FROM query_cache")
            conn.commit()
        finally:
            conn.close()


_PRIMED_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "primed"


def load_primed_from_disk(force: bool = False) -> int:
    """Hydrate the cache from `data/primed/*.json` so a fresh checkout / fresh
    Railway container has the demo queries ready without paying the 60–180s
    Jockey cold-call.

    Each file shape: ``{"query": str, "scenario": str | None, "payload": dict}``.
    Entries are pinned so they never expire under the TTL. Skips entries where
    the key is already cached unless ``force=True``.
    Returns the number of entries hydrated.
    """
    if not _PRIMED_DIR.exists():
        return 0
    n = 0
    for path in sorted(_PRIMED_DIR.glob("*.json")):
        try:
            doc = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        query = doc.get("query")
        scenario = doc.get("scenario")
        payload = doc.get("payload")
        if not (query and isinstance(payload, dict)):
            continue
        if not force and get(query, scenario) is not None:
            continue
        put(query, scenario, payload, pinned=True)
        n += 1
    return n
