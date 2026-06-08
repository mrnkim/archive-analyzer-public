"""Rate limiting via slowapi.

Public sample app — without throttling, anyone hammering /api/query would
burn through TwelveLabs quota in minutes. Default limit is per-IP, per-minute,
configurable via RATE_LIMIT_PER_MINUTE.
"""

from fastapi import FastAPI, Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

from app.config import get_settings


def _limit_string() -> str:
    return f"{get_settings().rate_limit_per_minute}/minute"


limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[_limit_string()],
    headers_enabled=True,
)


def install(app: FastAPI) -> None:
    """Wire the limiter into the FastAPI app."""
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)


__all__ = ["install", "limiter"]


# Convenience: re-export the request type so route signatures stay tidy.
__all__ += ["Request"]
