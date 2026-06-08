from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

import logging

from app import cache, ratelimit
from app.config import get_settings

logger = logging.getLogger(__name__)
from app.routes import export as export_route
from app.routes import query as query_route
from app.routes import sessions as sessions_route
from app.routes import stream as stream_route

settings = get_settings()

app = FastAPI(
    title="Archive Trend & Narrative Analyzer",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Install rate limiting only in production. In dev we want unlimited calls
# from the Vite proxy and the test client.
if settings.is_production:
    ratelimit.install(app)

app.include_router(query_route.router)
app.include_router(stream_route.router)
app.include_router(sessions_route.router)
app.include_router(export_route.router)


@app.on_event("startup")
async def _hydrate_cache_from_primed() -> None:
    """Load committed scenario_*.json files into the SQLite cache so demo
    queries are instant on every fresh container (e.g. Railway deploy)."""
    try:
        n = cache.load_primed_from_disk()
        if n:
            logger.info("Hydrated %d primed cache entries from data/primed/", n)
    except Exception as e:  # pragma: no cover - best effort
        logger.warning("Failed to hydrate primed cache: %s", e)


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {
        "status": "ok",
        "env": settings.app_env,
        "ks_configured": "yes" if settings.ks_id else "no",
        "api_key_configured": "yes" if settings.twelvelabs_api_key else "no",
    }


# Static-file serving (for the production build).
# If frontend/dist exists we serve it as a SPA; otherwise dev-server mode is assumed.
_FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"

if _FRONTEND_DIST.exists():
    app.mount(
        "/assets",
        StaticFiles(directory=_FRONTEND_DIST / "assets"),
        name="assets",
    )

    @app.get("/{full_path:path}")
    async def spa_fallback(full_path: str) -> FileResponse:
        # /api/* paths are handled by the routers above and never reach this fallback.
        return FileResponse(_FRONTEND_DIST / "index.html")
