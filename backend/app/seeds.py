"""Mock seed loader — Phase 1.

Replaced by real Jockey calls in Phase 2. Until then we cache seed JSON in
memory for fast responses.
"""

import json
from functools import lru_cache
from pathlib import Path

# data/seeds lives at the repo root (backend/app/seeds.py → up 3 levels)
_SEEDS_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "seeds"


@lru_cache
def load_seed(name: str) -> dict:
    """Load a seed JSON file. `name` is the basename without extension (e.g. 'adidas_trend')."""
    path = _SEEDS_DIR / f"{name}.json"
    if not path.exists():
        raise FileNotFoundError(f"Seed not found: {path}")
    return json.loads(path.read_text(encoding="utf-8"))
