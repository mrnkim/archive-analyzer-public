# Handoff — 2026-06-08

Snapshot of recent changes to the Archive Trend & Narrative Analyzer, plus how
to run, regenerate demo data, and deploy.

## Live deployment

- **URL:** https://archive-analyzer-public-production.up.railway.app
- **Platform:** Railway (Dockerfile build, healthcheck `/api/health`, config in `railway.json`)
- **Redeploy after a change:** run from the **repo root**
  ```bash
  railway up --ci
  ```
  `railway up` uploads the current directory, so run it from the repo root (the
  older `railway up <path> --service …` form fails — use the bare `--ci` form).
  Since 2026-07-13 the frontend depends on the private `@twelvelabs-io/react`
  package, so the service needs a `REGISTRY_TOKEN` variable (see the 2026-07-13
  section). Changing a service variable also auto-redeploys the existing image.
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

---

# Handoff — 2026-07-09

Started aligning the frontend with **TwelveLabs Design System (TLDS) /
`@twelvelabs-io/react`**. Full audit + phased plan in
[`docs/tlds-migration-plan.md`](docs/tlds-migration-plan.md).

## Key decision: two tracks

The real component library (`@twelvelabs-io/react`) requires **React ≥19.2.7 +
Tailwind v4 + a private GitHub Packages install** (and is self-labeled "not
production ready"). This app is Vite + **React 18 + Tailwind v3**. So the work is
split:

- **Track 1 (this session) — tokens-first, NO upgrade.** Adopt TLDS design
  *tokens* (colors/radius/fonts) on the existing hand-rolled components.
  `tokens.css` is framework-agnostic CSS custom properties, so it works on
  Tailwind v3.
- **Track 2 (not started, needs approval) — adopt the actual TLDS React
  *components* (`<Button>`, `<TextField>`, …).** Requires the React 19 +
  Tailwind v4 upgrade. **No `@twelvelabs-io/react` component is used yet.**

## Full PR roadmap (Track 1 + Track 2)

Detailed steps, per-PR risk, and verification live in
[`docs/tlds-migration-plan.md`](docs/tlds-migration-plan.md) §6. Checklist:

**Track 1 — tokens-first (Vite + React 18 + Tailwind v3, NO upgrade):**

- [x] **PR1** — Introduce TLDS tokens (`tokens.css` + semantic utilities in
      `tailwind.config.js`); additive, legacy ramps kept. _Risk: very low._
- [x] **PR2** — Migrate shell (`App.tsx` header/sidebar/footer/debug) + global
      `index.css` to tokens. _Risk: low–med (visible chrome)._
- [x] **PR3** — Migrate data/display components: `RevenueWidget`,
      `TimelineChart` (recharts palette centralized in a `CHART` const mirroring
      `--tl-color-*` hex — SVG attrs can't take `var()`), `ClipGrid`, `ClipStrip`,
      `NarrativePanel`, `narrative/*` (Era/Inflection/Sentiment/EmptyState).
      Sentiment diverging HSL scale left as-is (data-viz, not a token). _Risk: low._
- [x] **PR4** — Migrate interactive components: `SearchBar`, `ChatPanel`,
      `ExportButton`, `HlsClipPlayer`, `EmptyState`, `LoadingState` (+ `Markdown`,
      `TutorialPanel` pulled in to finish the sweep). Focus rings now
      `border-border-primary` + a 10%-alpha `misc-ring` (`color-mix`, preserves
      the subtle look); primary buttons `bg-surface-primary` /
      `hover:bg-surface-primary-hover` / `text-foreground-overlay`; warning/error
      alpha fills via `color-mix`. Video overlays (white/black scrims) kept
      literal by design. _Risk: med (focus/disabled/hover) — verified._
- [x] **PR5 — DONE (`a7395f2` + `5c462cb`).**
      - [x] Removed the now-dead legacy `neutral`/`brand`/`highlight`/`warning`/
        `error`/`destructive`/`success`/`info` color ramps from
        `tailwind.config.js`. **Build re-verified green** (`npm run build`) — the
        `src/` tree was already grep-clean, so nothing referenced them.
      - [x] Swapped the `::selection` highlight in `frontend/src/index.css` to the
        TLDS token: `rgba(0, 220, 130, 0.28)` →
        `color-mix(in srgb, var(--tl-color-embed-green) 28%, transparent)`.
        Build re-verified; confirmed emitted in `dist/assets/index-*.css`.
        Commit `5c462cb`.
      _Risk: very low (one decorative line)._

_✅ Track 1 is COMPLETE: fully on TLDS semantic tokens, still React 18 +
Tailwind v3, behavior unchanged._

**Track 2 — component library (SUBSTANTIVELY COMPLETE, merged to main `d38d560`):**

> **Registry access — RESOLVED.** The `@twelvelabs-io/react` package (private
> GitHub Packages, org `twelvelabs-io`) is readable with an **outside-collaborator**
> classic PAT (`read:packages`, SSO-authorized). Working setup on this machine:
> - `~/.tl-registry.env` → `export REGISTRY_TOKEN=<classic PAT>` (chmod 600, NOT in repo).
> - `frontend/.npmrc` (untracked) → `@twelvelabs-io:registry=https://npm.pkg.github.com`
>   + `//npm.pkg.github.com/:_authToken=${REGISTRY_TOKEN}` (no secret in file).
> - Run npm with the token: `source ~/.tl-registry.env && npm <cmd>`.
> - Package **`@twelvelabs-io/react@0.34.0`**; peers **react/react-dom `>=19.2.7`** + **Tailwind v4** (both satisfied).

- [x] **PR7** — React 18→19.2.7. **DONE, merged to main** (`f95c93a`). Only type
      delta: global `JSX` namespace removed → `Icon.tsx` uses `ReactElement`.
      Verified: build + full scenario run, zero console errors.
- [x] **PR6** — Tailwind v3→v4.3.2. **DONE, merged to main** (`efae466`). Ran
      `@tailwindcss/upgrade`: `tailwind.config.js` deleted → CSS-first `@theme`
      block in `index.css` (all TLDS token mappings), `@tailwindcss/postcss`,
      `rounded-sm`→`rounded-xs` renames. Verified: **visual regression
      pixel-identical** on home + scenario screens, zero console errors.
      _(Done before PR6 despite the label — order swapped intentionally.)_
- [x] **PR8 — DONE** (`82d82c1`). Installed `@twelvelabs-io/react@0.34.0`; committed
      `frontend/.npmrc`; `index.css` now imports the package `tokens.css` + `theme.css`
      after `@import "tailwindcss"` (vendored `tokens.css` + hand-rolled `@theme`
      deleted); `TooltipProvider` at the root; `npx twelvelabs-ui-skills` installed
      (`.claude/skills`, gitignored). Verified pixel-identical, zero console errors.
- [x] **PR9 — DONE** (`18e2d36`, `22421a1`, `8096b99`, `aca0428`, `3e10f4b`). Swapped
      all cleanly-mapping controls to the library: `<Button>` (Analyze/Send/Export/demo
      prompts), `<TextField>` (search + chat inputs), `<Spinner>`, the full package icon
      set (**`Icon.tsx` retired**), a real `<Tooltip>` on the timeline info hint,
      `CheckmarkIcon`. Verified end-to-end on **both** tabs + tutorial, zero console errors.
      - **Intentionally kept custom** (per skill: only swap when a component fits):
        data-viz (recharts timeline, SentimentStrip, EraClusters, InflectionPoints,
        ClipStrip), the Tutorial doc layout (Section/Card/Step), and the micro-badges
        (year "2018", A/B/C letters) — `Chip` is a larger tag and doesn't fit them.
      - **Not done (optional, low value):** a full `<Text>` typography sweep.

> **✅ Railway deploy — RESOLVED (2026-07-13, see the dated section at the bottom).**
> The `Dockerfile` frontend stage now copies `frontend/.npmrc` and takes an
> `ARG REGISTRY_TOKEN`, so the Docker build installs the private
> `@twelvelabs-io/react`. Set `REGISTRY_TOKEN` as a Railway **service** variable
> (a *Shared* Variable must be shared into the service). Redeployed + verified live.
> This is the public-repo × private-registry tradeoff — Track 1 avoided it; Track 2
> requires the token at build time.

## Shipped this session (Track 1, PR1–PR2)

1. **PR1 — TLDS tokens available (additive, zero visual change)**
   - Vendored `frontend/src/tokens.css` — a **pinned verbatim copy** of
     `@twelvelabs-io/react@0.30.0` `tokens.css` (commit `c4c5be6`). Vendored
     (not installed) because the package is on a private SSO registry and this
     is a public repo. Imported first in `frontend/src/index.css`.
   - `frontend/tailwind.config.js`: exposed the `--tl-*` vars as semantic
     utilities — `surface-*`, `foreground-*`, `border-*`, `misc-*`, `tl-*`
     colors; `rounded-tlds-*` + semantic radii; `font-tl-sans` / `font-tl-mono`.
     **Legacy `neutral`/`brand` ramps kept** so migration is incremental.
   - Caveat: token values are hex-valued CSS vars, so Tailwind opacity
     modifiers (`bg-surface-body/80`) do NOT inject alpha — translucent spots
     use explicit `color-mix(...)` arbitrary values.

2. **PR2 — migrated the app shell to semantic tokens**
   - `frontend/src/App.tsx`: header, sidebar nav, footer, and `?debug=1` panel
     now use `surface-*` / `foreground-*` / `border-*` / `misc-*` / `tl-*`
     instead of `neutral-*` / hex (className-only changes).
   - `frontend/src/index.css`: `body` base styles, scrollbar, and the pulse
     keyframe now read from `--tl-*` vars.
   - **Gotcha fixed:** `@apply bg-surface-body …` in `body {}` throws a fatal
     "class does not exist" in the Vite/HMR dev pipeline (build tolerated it).
     Set the body properties from the CSS vars directly instead — equivalent,
     and robust in dev + build.

Intended minor visual convergences (all toward TLDS): borders slightly more
visible (single `border-secondary`), "mock mode" warning text is now the
readable dark orange (`foreground-status-warning`), muted/subtle text tiering
tidied. Page bg (`#F4F3F3`) and primary text (`#1D1C1B`) are unchanged.

## Component migration status — COMPLETE (PR2–PR4)

Every component now uses TLDS semantic tokens. Verified post-PR4: the whole
`src/` tree is grep-clean of `neutral-*` / `brand-*` / `warning` / `error`
classes and of `#hex` literals in `className` (the only remaining hex live in
`tokens.css` and the documented `CHART` recharts palette). `Icon` /
`TwelveLabsLogo` never carried hardcoded colors (they use `currentColor`).

**PR5 status:** DONE. The legacy ramps were **deleted** from
`tailwind.config.js` (`a7395f2`) and the `::selection` highlight now uses the
TLDS `color-mix(... --tl-color-embed-green 28% ...)` token (`5c462cb`), both
build-verified green. **Track 1 is complete.** Next is optionally **Track 2**
(component library — needs React 19 + Tailwind v4 + private registry, requires
explicit approval).

## Verification

- `cd frontend && npm run build` — passes (`tsc` + Vite + Tailwind), including
  after the PR5 legacy-ramp deletion.
- `--tl-*` vars inline into the bundle; `bg-surface-white` etc. generate. After
  PR5 the legacy ramps are gone, so `neutral-*` / `brand-*` classes no longer
  resolve — intended, since the tree is grep-clean of them.
- Whole `src/` tree is free of `neutral-*` / `brand-*` / `warning` / `error`
  classes and of `#hex` in `className`. The `::selection` highlight now resolves
  to the TLDS token via `color-mix` (confirmed in `dist/assets/index-*.css`);
  no off-brand legacy color values remain in the app.

## Operational note (hit this session — NOT a code bug)

Clicking a demo scenario returned a spinner then nothing; `/api/query` was
`502 "Jockey error … instructions parameter … value too large"`. Root cause:
the runtime cache (`data/runtime/query_cache.sqlite`) was **empty (0 primed
rows)**, so every scenario missed cache and fell through to a live Jockey call,
which rejects the oversized `instructions` prompt. **Fix: restart the backend** —
the startup hook (`main.py` → `cache.load_primed_from_disk()`) re-hydrates the
4 pinned primed scenarios from `data/primed/*.json`. Unrelated to the UI work
(git shows `backend/` + `data/` untouched this session). Verify:
`curl -s localhost:8000/api/query -X POST -H 'Content-Type: application/json'
-d '{"query":"How has Adidas brand exposure changed from 1990 to 2025?","scenario":"A"}'
-o /dev/null -w '%{http_code}\n'` → expect `200`.

---

# Handoff — 2026-07-13

Long session: **finished Track 1, then executed all of Track 2** (adopting the
real `@twelvelabs-io/react` component library), plus a Narrative-Evolution UX
pass, a Dockerfile fix, and a live Railway redeploy. Everything is merged to
**main (`7f6fb44`)** and deployed.

## 1. Track 1 finalized
- `::selection` highlight → TLDS `color-mix(... --tl-color-embed-green 28% ...)`
  (`5c462cb`). Track 1 merged to main (`208b044`). (Full detail: 2026-07-09 section.)

## 2. Narrative Evolution UX pass (commit `6681996`, in the Track 1 merge)
Driven by feedback while running the app locally:
- **Selected insight highlights in place** (chronological order) instead of being
  pulled to the top of the AI-summary panel — the reordering read as confusing.
  `NarrativePanel` dropped the pinned "Selected insight" card + the `visibleBullets`
  filter; the in-place list item keeps the existing highlight.
- **No load-time scroll jump.** Root cause was `ChatPanel`'s mount-time
  `scrollIntoView` (the panel sits at the page bottom): guarded it to fire only
  once the chat has messages. Also removed `NarrativePanel`'s now-redundant
  scroll-to-selected effect.
- **Narrative tab reordered** story-first: overview (timeline + sentiment +
  inflection) → AI narrative → era clusters → clips → chat (was: narrative last).
- **Tab labels shortened:** "Narrative Evolution" and "Brand Intelligence
  (Adidas Examples)".

## 3. Track 2 — real component library (merged to main `d38d560`)
Per-PR detail is in the updated Track-2 checklist in the 2026-07-09 section above.
Summary:
- **Registry unblocked.** `@twelvelabs-io/react` is private (GitHub Packages, org
  `twelvelabs-io`); an **outside-collaborator** `read:packages` PAT (SSO-authorized)
  can read it. Local setup: token in `~/.tl-registry.env` (`export REGISTRY_TOKEN=…`),
  `frontend/.npmrc` maps the scope + reads `${REGISTRY_TOKEN}`. Run npm as
  `source ~/.tl-registry.env && npm …`.
- **Stack upgrades** (each verified pixel-identical, merged to main): React
  18→19.2.7 (`f95c93a`), Tailwind v3→v4.3.2 (`efae466`).
- **PR8 (`82d82c1`):** installed `@twelvelabs-io/react@0.34.0`, imported the package
  `tokens.css` + `theme.css` (dropped the vendored `tokens.css` + hand-rolled
  `@theme`), added root `TooltipProvider`, installed the `twelvelabs-ui` Claude
  skills (`.claude/skills`, gitignored).
- **PR9 (`18e2d36`…`3e10f4b`):** swapped every cleanly-mapping control to the
  library — `<Button>` (Analyze/Send/Export/demo prompts), `<TextField>` (search +
  chat inputs), `<Spinner>`, the whole icon set (**`Icon.tsx` deleted**), a real
  `<Tooltip>` on the timeline info hint, `CheckmarkIcon`. Kept custom (no fitting
  component): recharts/data-viz, the tutorial doc layout, micro-badges. Skipped
  the optional full `<Text>` sweep.
- Verified end-to-end on **both tabs + tutorial**, zero console errors.

## 4. Deployability + Railway
- **Dockerfile fixed** (`352d9fc`, merged `7f6fb44`): the frontend build stage now
  copies `frontend/.npmrc` and takes `ARG REGISTRY_TOKEN`, so the Docker build can
  install the private package. Token stays in the build stage (multi-stage; the
  runtime image copies only `dist/`), so it never ships.
- **Railway:** set `REGISTRY_TOKEN` as a **service** variable. (A Railway *Shared*
  Variable must be **shared into the service**, or added directly, to reach the
  build `ARG`.)
- **Redeployed the latest** via `railway up --ci` from the repo root — the service
  had been serving a **stale old build**. Build succeeded (private package
  installed), healthcheck passed, live bundle now the new version.

## Handy: check which version is live
```bash
URL=https://archive-analyzer-public-production.up.railway.app
JS=$(curl -s "$URL/" | grep -oE '/assets/index-[^"]+\.js' | head -1)
curl -s "$URL$JS" | grep -oE "Adidas Examples|Trump Example"   # new vs old marker
```

## Notes for next session
- The Docker build **requires** `REGISTRY_TOKEN` — CI / other machines / Railway all need it.
- Optional remaining polish (low value): full `<Text>` typography sweep; `Chip`/`Banner` where they fit.
- Local dev with the private package: always `source ~/.tl-registry.env` before `npm install`.
