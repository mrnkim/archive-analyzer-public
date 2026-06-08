# Archive Trend & Narrative Analyzer

A sample app that turns a video archive into an interactive **trend timeline +
narrative**. Ask a natural-language question ("How has Adidas brand exposure
changed from 1990 to 2025?") and the app charts mentions over time, writes a
"story of the story" summary, and surfaces the exact clips behind every data
point — each playable inline.

Built on the [TwelveLabs](https://twelvelabs.io) Jockey video API.

---

## What it does

- **Semantic search across time** — a question is answered over the whole
  corpus, with results bucketed by year into a timeline.
- **Narrative panel** — an AI-written summary of key inflection points.
- **Grounded clips** — every timeline point links to the source moments, with
  HLS playback, thumbnails, and citations.
- **Conversational follow-ups** — multi-turn chat scoped to the focused clip.
- **Mock fallback** — runs with seeded demo data when no API key is set, so you
  can explore the UI before wiring up a real index.

## Architecture

```
React + Vite + Recharts + Tailwind (frontend/)
        │  /api/query, /api/sessions, /api/stream
        ▼
FastAPI (backend/)
        │  POST /v1.3/responses        — narrative + structured trend data
        │  GET  /assets/{id}           — resolve HLS manifest + thumbnail
        │  GET  /knowledge-stores/{id}/items — bridge citation IDs → assets
        ▼
TwelveLabs Jockey API
```

- `backend/app/routes/` — `query`, `sessions`, `stream`, `export`
- `backend/app/deps/jockey_client.py` — client for `POST /v1.3/responses`
- `backend/app/deps/jockey_assets.py` — asset / KS-item resolution for citations
- `backend/app/cache.py` — SQLite response cache + primed scenarios

## Quick start

```bash
# 1. Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -e .

# configure (or skip to run on mock data)
cp ../.env.example ../.env   # then fill in TWELVELABS_API_KEY + KS_ID
uvicorn app.main:app --reload --port 8000

# 2. Frontend (separate terminal)
cd frontend
npm install
npm run dev          # http://localhost:5173 (proxies /api → :8000)
```

Without `TWELVELABS_API_KEY` + `KS_ID`, the backend serves seeded demo
scenarios so the UI is fully explorable.

## Configuration

See [`.env.example`](.env.example):

| Var | Purpose |
|---|---|
| `TWELVELABS_API_KEY` | API key from the [playground](https://playground.twelvelabs.io) |
| `JOCKEY_BASE_URL` | API base URL (default `https://api.twelvelabs.io/v1.3`) |
| `KS_ID` | Knowledge Store ID to query (after ingesting your videos) |
| `ALLOWED_ORIGINS` | CORS origins |
| `RATE_LIMIT_PER_MINUTE` | Per-IP rate limit (production) |

## Tests

```bash
cd backend && ./.venv/bin/pytest -q
```

## Deploy

Single-container build (`Dockerfile`) serves the built frontend + API; see
[`railway.json`](railway.json) for the Railway config.
