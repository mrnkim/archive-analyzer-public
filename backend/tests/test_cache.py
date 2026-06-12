"""Cache TTL + pinning behaviour.

Pinned entries (the primed demo scenarios) must stay instant forever, even
when a Railway container stays up past the 24h TTL. Ad-hoc user queries still
expire normally.
"""

from app import cache


def test_adhoc_entry_expires_but_pinned_does_not():
    cache.clear()
    try:
        cache.put("adhoc query", "X", {"v": 1})
        cache.put("primed query", "A", {"v": 2}, pinned=True)

        # Fresh: both readable.
        assert cache.get("adhoc query", "X") == {"v": 1}
        assert cache.get("primed query", "A") == {"v": 2}

        # ttl=0 simulates the entry having aged past the TTL.
        assert cache.get("adhoc query", "X", ttl=0) is None
        assert cache.get("primed query", "A", ttl=0) == {"v": 2}
    finally:
        cache.clear()


def test_primed_scenarios_survive_ttl_expiry():
    cache.clear()
    try:
        n = cache.load_primed_from_disk(force=True)
        assert n >= 1
        # The demo scenarios are pinned, so they remain a cache HIT even when
        # the container has been up long past the TTL.
        got = cache.get(
            "How has Adidas brand exposure changed from 1990 to 2025?", "A", ttl=0
        )
        assert got is not None
    finally:
        cache.clear()
