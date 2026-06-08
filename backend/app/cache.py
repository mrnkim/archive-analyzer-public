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
            created_at INTEGER NOT NULL
        )
        """
    )
    return conn


def _key(query: str, scenario: str | None) -> str:
    raw = f"{(scenario or '').upper()}|{query.strip().lower()}"
    return hashlib.sha256(raw.encode()).hexdigest()


def get(query: str, scenario: str | None, ttl: int = DEFAULT_TTL_SECONDS) -> dict[str, Any] | None:
    """Return cached payload if present and fresh; else None."""
    with _lock:
        conn = _ensure_db()
        try:
            row = conn.execute(
                "SELECT payload, created_at FROM query_cache WHERE key = ?",
                (_key(query, scenario),),
            ).fetchone()
        finally:
            conn.close()
    if not row:
        return None
    payload, created_at = row
    if time.time() - created_at > ttl:
        return None
    try:
        return json.loads(payload)
    except json.JSONDecodeError:
        return None


def put(query: str, scenario: str | None, payload: dict[str, Any]) -> None:
    with _lock:
        conn = _ensure_db()
        try:
            conn.execute(
                "INSERT OR REPLACE INTO query_cache (key, payload, created_at) VALUES (?, ?, ?)",
                (_key(query, scenario), json.dumps(payload), int(time.time())),
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
    Skips entries where the key is already cached unless ``force=True``.
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
        put(query, scenario, payload)
        n += 1
    return n
