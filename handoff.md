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

---

# Handoff — 2026-06-12

Two small fixes shipped, plus a larger feature (Scenario B — Narrative
Evolution) now in progress.

## Shipped + deployed this session

1. **Pinned primed cache (never-expiring demo scenarios)** — `backend/app/cache.py`
   - Bug: the three demo scenarios are hydrated into the SQLite cache at startup
     with `created_at = now`, but were subject to the same 24h TTL as ad-hoc
     queries. Once a Railway container stayed up >24h, the primed entries went
     stale and the next click paid the 60–180s Jockey cold-call.
   - Fix: added a `pinned` column. `load_primed_from_disk()` writes entries with
     `pinned=1`; `get()` skips the TTL check for pinned rows. Ad-hoc user queries
     keep the 24h TTL. Regression tests in `backend/tests/test_cache.py`.
   - Commit `85876f1`, deployed; verified all three scenarios return <0.4s in prod.

2. **Loading state with elapsed timer + staged hints** —
   `frontend/src/components/LoadingState.tsx` (extracted from inline JSX in
   `App.tsx`). Shows an `mm:ss` timer and a stage label that advances over time so
   a fresh 2–3 min live query doesn't read as "frozen". Commit `3c58f41`.

## In progress: Scenario B — Narrative Evolution (PRD §Demo Scenarios B)

Goal: add a **new tab** (alongside "Brand Intelligence (Adidas Example)") that
traces how an entity's media portrayal evolved over decades — per the PRD's
Scenario B (Donald Trump example). Differentiators to build (all three per PRD):
decade **thematic clusters** (core), **sentiment overlay** on the timeline, and
**inflection points**.

### Done — new Knowledge Store ingested
- A separate Trump archive was ingested into its **own vanilla KS** (no
  `ingestion_config`, same style as the Adidas KS). Years are inferred by Jockey
  at query time from content, not from metadata.
- **KS_ID:** `ks_019ebae7-82f6-73c2-baff-b982a3443485`  (name: `Trump Archive 1986-2026`)
- **39/43 videos ready** (all indexed). 4 failed and are NOT in the KS:
  - `GZpMJeynBeg` Oprah 1988 — resolution 426x240 (<360p min)
  - `PSkvbQfpl5E` Real-estate interview — 320x240 (<360p)
  - `SwbokALrcxs` Celebrity Apprentice "YOU'RE FIRED" — 320x240 (<360p)
  - `jkghtyxZ6rc` WWE McMahon takedown 2007 — age-restricted (needs cookies)
  - These are mostly redundant (era/theme covered by sibling clips), so we
    proceeded with 39. Distribution: Era1 10 · Era2 8 · Era3 10 · Era4 11,
    spanning 1986→2026.

### How the ingest was done (reproducible)
- Curation + ingest used the **private Jockey skill at `/Users/Miranda/twelveLabs/jockey`**
  (NOT committed here — only the resulting KS_ID + future primed JSON land in this
  repo, so no private content leaks). Its CLI:
  `python scripts/youtube_ingest.py "<url>" --ks-name "<name>"` (append more with
  `--ks-id`). Auth: API key at `~/.twelvelabs/credentials` (same key as `.env`).
- Trick: passed one `watch_videos?video_ids=ID1,ID2,...` URL with all 43 ids;
  yt-dlp expands it to a 43-entry playlist, the script ingests with 10-worker
  concurrency into one new KS. (~13 min wall-clock.)
- Curation artifacts (outside the repo, in `/Users/Miranda/twelveLabs/`):
  `trump_archive_playlist.txt` (43 ids + durations + KS_ID record) and
  `trump_archive_playlist.html` (local IFrame-API player; serve via
  `python3 -m http.server` and open over http://localhost — `file://` triggers
  YouTube embed Error 153). The `watch_videos` anonymous-playlist URL no longer
  plays in-browser (redirects to the first video); yt-dlp still expands it.

### TODO — build the feature (this is option 1, proceeding now)
- **Backend**
  - Config: add a second KS id (e.g. `KS_ID_NARRATIVE`) and route the new tab's
    queries to the Trump KS; existing scenarios keep the Adidas `KS_ID`.
    `JockeyClient` currently binds one `ks_id` — needs per-request KS selection.
  - New scenario instructions (narrative evolution: era thematic clusters +
    sentiment). Mind the ~2000-char `instructions` cap.
  - Extend `schemas/trend_data.py`: add `sentiment` (per timeline point/scene),
    optionally `era`/`thematic_cluster` labels and an `inflection_points[]` block.
    Keep it backward compatible with the existing Adidas payloads.
- **Frontend**
  - New sidebar tab "Narrative Evolution (Trump Example)".
  - Decade thematic-cluster view (core), sentiment overlay on the timeline,
    inflection-point markers; reuse ClipGrid/ChatPanel/Export where possible.
- **Demo data**: once the live query shape is stable, capture a primed snapshot
  for the demo query so it's instant (and pinned, per the cache fix above).

---

# Handoff — 2026-07-08

UI/UX pass for the analyzer results view, plus structured summary bullets that
link the narrative panel to the chart and selected scenes.

## Shipped this session

1. **Results layout: scenes directly under the graph**
   - In `frontend/src/App.tsx`, the selected-year `Scenes — {year}` section
     (`ClipGrid`) now sits immediately below `TimelineChart`.
   - `All representative clips` (`ClipStrip`) moved below the selected scenes,
     so the main flow is now: graph → selected scenes → representative clip strip.
   - Applies to both the Adidas Brand Intelligence tab and the Narrative
     Evolution tab.

2. **Monetization estimate now shows the equation**
   - `frontend/src/components/RevenueWidget.tsx` was redesigned from a single
     large number into an equation-style card:
     `evidence scenes × assumed value per scene = modeled value`.
   - The original `calculation_basis` text is preserved in a separate basis
     block, so the assumptions are visible instead of hidden below the number.

3. **AI summary is now chart-linked bullets**
   - Backend schema now includes `summary_bullets[]` in
     `backend/app/schemas/trend_data.py`.
   - `backend/app/prompts/scenarios.py` asks Jockey to return one summary bullet
     for every timeline year. Each bullet has `year`, `headline`, and `text`.
   - `backend/app/routes/query.py` returns `summary_bullets` while preserving
     `narrative_summary` as a fallback for older payloads.
   - Frontend `NarrativePanel` renders clickable bullets instead of long prose.
     Clicking a bullet selects the matching year; clicking a chart dot highlights
     the matching bullet.
   - Older cached/primed responses still work: the frontend synthesizes fallback
     bullets from the timeline when `summary_bullets` is absent.

4. **Selected insight remains visible while reviewing scenes**
   - The right-side estimate + summary column is sticky on desktop.
   - The selected summary bullet is duplicated at the top of the summary panel as
     `Selected insight`, so late-year selections (e.g. 2024) are visible without
     scrolling the summary list.
   - `TimelineChart` accepts `selectedYear` and draws a white ring around the
     active dot.

## Verification

```bash
cd frontend && npm run build
cd backend && .venv/bin/pytest -q
```

Latest verification in this session:
- Frontend build passed.
- Backend tests passed: `20 passed`.
- Local backend restarted on `http://127.0.0.1:8000`; frontend dev server was
  already running on `http://127.0.0.1:5173`.

## Notes for next session

- Because `summary_bullets` is now required in the Jockey JSON Schema for live
  calls, new live responses should contain one bullet per timeline point.
- Existing `data/primed/*.json` files were not regenerated in this session; the
  frontend fallback handles them. Regenerate primed data later if the demo should
  ship with persisted `summary_bullets`.
- The local backend is running without `--reload` due to sandbox file-watch
  restrictions. Restart it after backend edits.
