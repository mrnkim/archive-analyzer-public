# Handoff — 2026-06-08

Snapshot of recent changes to the Archive Trend & Narrative Analyzer, plus how
to run, regenerate demo data, and deploy.

## Live deployment

- **URL:** https://archive-analyzer-public-production.up.railway.app
- **Platform:** Railway (Dockerfile build, healthcheck `/api/health`, config in `railway.json`)
- **Redeploy after a change:**
  ```bash
  railway up <path-to-repo> --service archive-analyzer-public --ci
  ```
  Pass the explicit path — `railway up` uploads a directory. Changing a
  service variable auto-redeploys the existing image.
- **Service env vars** (set in Railway, never committed — `.env` is dockerignored):
  `TWELVELABS_API_KEY`, `JOCKEY_BASE_URL`, `KS_ID`, `RATE_LIMIT_PER_MINUTE`,
  `APP_ENV=production`, `ALLOWED_ORIGINS=<the railway URL>`.

## What shipped this session

1. **All matching scenes per year** (was: one representative clip)
   - `scenes[]` added to the JSON Schema + Pydantic model (`schemas/trend_data.py`)
     and requested in the scenario prompts (`prompts/scenarios.py`).
   - `routes/query.py` enriches **every** scene (thumbnail / manifest / duration),
     not just the representative clip.
   - Frontend `ClipGrid` renders the full per-year scene strip; degrades
     gracefully to `[representative_clip]` when `scenes` is absent (older payloads).
   - Prompt size matters: the `instructions` field has a ~2000-char cap — keep
     the scenario prompts concise or the API rejects them ("value too large").

2. **Real YouTube titles** instead of raw `<id>.mp4` filenames
   - `data/video_titles.json` maps each YouTube id → real title.
   - `scripts/refresh_video_titles.py` fetches titles via YouTube oEmbed, caches
     them, and patches `data/primed/*.json` in place.
   - `routes/query.py` swaps the title in at enrichment time (`_prettify_title`),
     so live-mode responses get real titles too. Unresolvable ids
     (private/deleted videos) fall back to the filename.

3. **Interactive UI** — loading spinner, clear-previous-result on new search,
   timeline hover preview, click-to-scroll into the player, chat scoped to the
   focused clip, opt-in `?debug=1` panel, and a **Tutorial** sidebar tab.

## Run locally

```bash
# backend
cd backend && python -m venv .venv && source .venv/bin/activate && pip install -e .
cp ../.env.example ../.env   # fill in TWELVELABS_API_KEY + KS_ID (or run on mock data)
uvicorn app.main:app --reload --port 8000

# frontend (separate terminal)
cd frontend && npm install && npm run dev   # http://localhost:5173, proxies /api → :8000
```

Without `TWELVELABS_API_KEY` + `KS_ID`, the backend serves the seeded demo
scenarios so the UI is fully explorable.

## Regenerating the demo (primed) data

The three demo buttons are served from `data/primed/scenario_{a,b,c}.json`,
hydrated into the cache on startup. To refresh them against the live API:

1. Clear the cache + move the old primed files aside so the queries miss cache:
   ```bash
   rm -f data/runtime/query_cache.sqlite
   ```
   (On startup the backend re-hydrates from `data/primed/`, so a cached entry
   shadows a live call for the same query+scenario — clear it first.)
2. Run each demo query against the live backend and write the response back into
   the matching `scenario_*.json` as `{query, scenario, payload}`.
3. `python scripts/refresh_video_titles.py` to patch in real titles.

> Note: live results are stochastic — year coverage and scene counts vary run to
> run. Current demo data spans 7–8 years with 13–20 scenes per scenario.

## Known limitations

- Multiple scenes per year depend on the API returning them; coverage varies by run.
- One source video (`aKSHgMqCwbQ`) is private/removed on YouTube, so its oEmbed
  title can't be resolved — it shows the filename. Re-run the titles script if it
  comes back online.
