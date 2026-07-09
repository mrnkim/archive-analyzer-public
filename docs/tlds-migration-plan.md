# TLDS / `@twelvelabs-io/react` Migration Plan — Archive Analyzer frontend

**Status:** Audit + plan only. No code changed. Produced with the
`twelvelabs-ui`, `twelvelabs-ui-migrate`, and `twelvelabs-ui-new-component`
Claude skills from `github.com/twelvelabs-io/twelvelabs-ui`.

**Scope:** `frontend/` only (Vite + React 18 + Tailwind v3). Backend, data, and
product behavior are out of scope and must be preserved.

---

## 1. TL;DR / recommendation

The app is already _visually_ tracking the TwelveLabs "Strand" light theme, but
it does so through a **fragile mechanism**: it overwrites Tailwind's `neutral`
and `brand` numeric ramps with hand-copied Strand hex values, inverting the
scale (`neutral-900` = white surface, `neutral-50` = near-black text). This
works but is illegible and drifts from the real design system by hand.

**Full adoption of the actual component library (`@twelvelabs-io/react`) is a
hard fork of the stack**, because the package requires:

- **React ≥ 19.2.7** as a peer dependency (app is on 18.3), and
- **Tailwind v4** to register its token utilities (`bg-surface-body`,
  `rounded-dialog`) via `theme.css`'s `@theme inline` block (app is on v3.4), and
- a **private GitHub Packages install** (classic PAT + `read:packages` + SSO,
  `REGISTRY_TOKEN` in CI), for a library that self-describes as
  **"🚧 Not production ready … breaking changes can land between releases."**

Because the constraint is "don't upgrade React/Tailwind unless the blast radius
is justified," the plan splits the work into two independent tracks:

| Track | What it delivers | Stack change | Blast radius | Recommendation |
| ----- | ---------------- | ------------ | ------------ | -------------- |
| **Track 1 — Tokens-first** | Adopt Strand's real design tokens as **semantic** Tailwind v3 utilities (`surface-*`, `foreground-*`, `border-*`, radius, fonts). Replaces the inverted-ramp hack. ~80% of the visual/consistency win. | **None** (stays v3 + React 18) | **Low, reversible** | **Do now.** |
| **Track 2 — Component library** | Import real `Button`, `Select`, `Tooltip`, `Menu`, `Banner`, `Chip`, etc. from `@twelvelabs-io/react`; live parity + upstream updates. | React 18→19 **and** Tailwind v3→v4 **and** private registry | **Medium–high** | **Defer to an explicitly-approved milestone.** Pilot first. |

Rationale for the split: **`tokens.css` is framework-agnostic plain CSS custom
properties** and can be consumed on Tailwind v3 today; **`theme.css` is Tailwind
v4-only**, and the library's compiled components depend on the v4-registered
utilities. So you can adopt the _design language_ without the upgrades, but you
**cannot** consume the library's _components_ without Tailwind v4 + React 19.

Do Track 1 now. Green-light Track 2 only if the team wants live component parity
and is willing to own a private-registry dependency on a pre-1.0 library.

---

## 2. Current-state audit

### 2.1 Stack

| | Current app (`frontend/`) | TLDS (`@twelvelabs-io/react` v0.30.0) |
| --- | --- | --- |
| Framework | React **18.3.1** (`createRoot`, StrictMode) | React **≥19.2.7** peer |
| Build | Vite 5 | tsdown (lib), Vite/Next consumers |
| CSS | Tailwind **3.4** + PostCSS + autoprefixer | Tailwind **4** (`@theme inline`, `@source`) |
| Tokens | Hand-copied Strand hex in `tailwind.config.js` | `tokens.css` (CSS vars) + `theme.css` (v4 theme) |
| Primitives | Hand-rolled `<button>`/`<input>` + custom 10-icon set | Radix UI + `cva`+`cn`+`data-slot`, 180+ icons |
| Fonts | Milling + IBM Plex Mono + Noto/Geist fallbacks | Milling (`--tl-font-family-primary`) + IBM Plex Mono |
| Install | public npm | GitHub Packages (PAT + SSO, `REGISTRY_TOKEN`) |
| Distribution | public sample app | "not production ready", pin exact version |

**Good news already true:** the app's primary UI font (Milling) and mono font
(IBM Plex Mono) already match TLDS. The brand green `#60E21C` is essentially
Strand's `embed-green` (`#60e21b`). The page background `#F4F3F3` is _exactly_
TLDS `surface-body` (`gray-50`). So the app is copying the right source of
truth — just through the wrong abstraction.

### 2.2 Component inventory (`frontend/src`, ~2,500 LOC)

22 component files. No component library is used; everything is hand-rolled
Tailwind. Charts use `recharts`; video uses `hls.js`.

| Area | Files |
| --- | --- |
| Shell | `App.tsx` (header, sidebar tabs, footer, layout) |
| Search / chat | `SearchBar.tsx`, `ChatPanel.tsx`, `ExportButton.tsx` |
| Data display | `RevenueWidget.tsx`, `TimelineChart.tsx`, `ClipGrid.tsx`, `ClipStrip.tsx`, `HlsClipPlayer.tsx` |
| Narrative | `NarrativePanel.tsx`, `narrative/EraClusters.tsx`, `narrative/SentimentStrip.tsx`, `narrative/InflectionPoints.tsx`, `narrative/NarrativeEmptyState.tsx` |
| States / content | `EmptyState.tsx`, `LoadingState.tsx`, `TutorialPanel.tsx`, `Markdown.tsx` |
| Primitives | `Icon.tsx` (10 custom SVG icons), `TwelveLabsLogo.tsx` |

### 2.3 Styling patterns found (the migration surface)

- **Color:** ~266 uses of the remapped `neutral` ramp (`text-neutral-*` 146,
  `bg-neutral-*` 64, `border-neutral-*` 56), ~30 `brand`, plus
  `warning`/`error`/`success`/`info`. **The neutral scale is inverted** — a
  reader cannot tell `bg-neutral-900` means "white card" without the config.
- **Hardcoded hex:** 23 occurrences (`text-[#60E21C]`, `border-[#60E21C]`,
  `bg-[#BFF3A4]/30`, and hex in `index.css` scrollbars/selection/keyframes).
- **Raw controls:** ~14 hand-rolled `<button>`, 2 `<input>` (search + chat),
  0 `<select>`. All buttons/inputs re-implement styling per-file.
- **Radius:** bare `rounded-md` (20), `rounded-lg` (17), `rounded-full` (14),
  `rounded-xl` (5), `rounded-sm` (3), `rounded-2xl` (1) — none semantic.
- **Type:** bare `font-medium` (33), `font-semibold` (24), `font-mono` (16),
  plus arbitrary `text-[10px]/[11px]/[9px]` (35). No `<Text>` component.
- **Focus rings:** `focus:ring-2 focus:ring-neutral-50/10` — will need review
  under Tailwind v4 (default ring width changed 3px→1px).

### 2.4 Key findings

1. The inverted-ramp remap is the root cause of illegibility → **semantic
   tokens are the highest-leverage fix** and need no upgrade.
2. TLDS `surface-card` is `#ececec` (light gray), but the app's "card" today is
   pure white (`neutral-900` → `#FFFFFF`). To **preserve the exact look**, map
   current cards to **`surface-white`**, not `surface-card`. (Switching to
   `surface-card` is a deliberate visual choice, not a 1:1 port.)
3. The app has **no automated frontend tests** and no Storybook — verification
   is typecheck + build + manual visual review of both tabs. Plan for that.
4. Several of the components the app would most benefit from
   (`Tabs`, `Table`, `Dialog`) are **not exported** from the library yet — so
   even under Track 2 they stay hand-rolled (see §5).

---

## 3. Blast-radius analysis for the Track 2 upgrades

Only relevant if/when Track 2 is approved. Documented here so the decision is
informed rather than blind.

### 3.1 Tailwind v3 → v4 — **medium**

- **Config model change:** JS `tailwind.config.js` → CSS-first (`@theme` /
  `@config`). Automated codemod exists: `npx @tailwindcss/upgrade`.
- **PostCSS change:** `tailwindcss` + `autoprefixer` → `@tailwindcss/postcss`
  (or the `@tailwindcss/vite` plugin). autoprefixer + import folded in.
- **Renamed/changed utilities that this app uses:** default **ring width 3→1**
  (`focus:ring-2` semantics), `rounded-sm`→`rounded-xs`, `shadow-sm`→`shadow-xs`,
  `outline-none`→`outline-hidden`, and **default border color is now
  `currentColor`** (any bare `border` changes — app mostly sets explicit
  `border-neutral-*`, so low exposure, but audit).
- **`@import` ordering:** v4 wants `@import "tailwindcss";` first; the current
  `@import url(fonts…)` + `@tailwind base/components/utilities` block in
  `index.css` must be reordered. `@apply` in `body {}` still works.
- **Content detection** is automatic in v4 (drop the `content` array).
- **Effort:** ~1–2 days incl. a full visual-regression pass. Mostly mechanical
  via codemod; the risk is silent visual drift, not build breakage.

### 3.2 React 18 → 19 — **low–medium**

- **Entry point already modern:** `main.tsx` uses `createRoot` + `StrictMode`.
  No `ReactDOM.render` to migrate.
- **Dependency compatibility (all support React 19):** `@tanstack/react-query`
  v5 ✓, `zustand` v5 ✓, `react-markdown` v9 ✓, `recharts` v2.13 ✓ (verify peer
  warnings), `hls.js`/`remark-gfm` have no React dependency.
- **Breaking changes with low exposure here:** removed function-component
  `propTypes`/`defaultProps` (app uses TS default params ✓), `useRef` requires
  an argument (app already passes args ✓), no string refs, no legacy context.
  Main real work is bumping `@types/react` 18→19 and fixing type deltas.
- **Codemod:** `npx codemod@latest react/19/migration-recipe`.
- **Effort:** ~0.5 day + regression test. The app is small and idiomatic.

### 3.3 Private-registry / supply-chain — **operational risk, not code**

- Requires a classic PAT (`read:packages`) authorized for `twelvelabs-io` via
  SSO, surfaced as `REGISTRY_TOKEN`, plus a scoped `.npmrc`. This app is a
  **public sample** — pulling a private, pre-1.0, SSO-gated dependency into its
  build is a real friction / reproducibility cost for external readers. Pin an
  exact version; budget for periodic `twelvelabs-ui-migrate` passes on upgrade.

---

## 4. Token mapping (Track 1 — the core of the plan)

Adopt `tokens.css` (plain CSS vars, v3-safe) and expose the **semantic** tokens
as Tailwind v3 utilities by referencing the vars in `tailwind.config.js`, e.g.
`colors: { surface: { body: 'var(--tl-surface-body)', card: 'var(--tl-surface-card)' } }`.
Then replace call sites. This retires the inverted `neutral`/`brand` ramps.

### 4.1 Color — current remapped ramp → TLDS semantic token

| Current (meaning) | Hex | → TLDS semantic utility | Notes |
| --- | --- | --- | --- |
| `neutral-950` (page bg) | `#F4F3F3` | `bg-surface-body` | exact match |
| `neutral-900` (surface/card) | `#FFFFFF` | `bg-surface-white` | **preserve** white; `surface-card` is `#ececec` |
| `neutral-800` (subtle border/fill) | `#E8E7E5` | `border-border-secondary` / `bg-surface-secondary` | secondary=`#e2e2e2`, close |
| `neutral-700` (default border) | `#D3D1CF` | `border-border-secondary` (`gray-300`) | exact match |
| `neutral-600` (tertiary text) | `#9B9895` | `text-foreground-subtle` | subtle=`#8f8984`, near |
| `neutral-500` (secondary/muted text) | `#6B6966` | `text-foreground-muted` | muted=`#45423f` (darker) — visual pass |
| `neutral-300/200` (strong body) | `#45423F` | `text-foreground-muted` / `text-tl-gray-600` | exact `gray-600` |
| `neutral-100/50` (primary text/headings) | `#1D1C1B` | `text-foreground-body` | exact `gray-700` |
| primary button `bg-neutral-50`+`text-neutral-900` | dark on white | `bg-surface-primary` + `text-foreground-primary` (or `<Button variant="primary">`) | TLDS primary = dark surface |
| `brand-*` / `#60E21C` accent | `#60E21C` | `text-tl-embed-green` / `bg-tl-embed-light-green` | Strand `embed-green` `#60e21b` |
| `warning` | `#FABA17` | `*-foreground-status-warning` / `bg-surface-status-warning` | analyze-orange |
| `error` / `destructive` | `#E22622` | `*-foreground-status-error` / `bg-surface-destructive` | system red `#e22e22` |
| `info` | `#6CD5FD` | `text-tl-embed-blue` | embed-blue |

> **Behavior-preservation flags:** (a) map cards to `surface-white` to keep pure
> white; (b) `foreground-muted` is darker than today's `neutral-500` — expect
> muted labels to gain contrast (arguably an a11y improvement — confirm with
> design); (c) the green accent has no single semantic token — use the
> `tl-embed-*` primitives.

### 4.2 Radius — bare → semantic (TLDS: `tlds-1=4px, 2=8px, 3=12px, 4=16px`)

| Current | px | → TLDS | Semantic alt (by element) |
| --- | --- | --- | --- |
| `rounded-md` | 8 | `rounded-tlds-2` | `rounded-nav-item` (sidebar), `rounded-button-small` |
| `rounded-lg` | 12 | `rounded-tlds-3` | `rounded-input-md`/`rounded-menu` (inputs/cards) |
| `rounded-xl` | 16 | `rounded-tlds-4` | scenario cards |
| `rounded-sm` | ~3 | `rounded-tlds-1` (4) | small chips |
| `rounded-2xl` | 16+ | `rounded-tlds-4/5` | — |
| `rounded-full` | ∞ | `rounded-tlds-full` | status dots, pills |

### 4.3 Fonts

| Current | → TLDS |
| --- | --- |
| `font-sans` / `Milling` stack (via config) | `font-tl-sans` |
| `font-mono` / IBM Plex Mono | `font-tl-mono` |
| bare `font-medium`/`font-semibold` + `text-[10px]` | prefer `<Text variant="…">` under Track 2; keep utilities under Track 1 |

---

## 5. Component mapping — each existing component → TLDS

"Track 1" = restyle in place with tokens (no library). "Track 2" = swap for the
real library component (needs the upgrades). "Keep" = no TLDS equivalent /
domain-specific.

| Existing component | Pattern today | TLDS component (Track 2) | Tokens (Track 1) | Notes |
| --- | --- | --- | --- | --- |
| `SearchBar` input | raw `<input>` | **`TextField`** | `surface-white`, `border-border-secondary`, `rounded-input-md`, `ring-misc-ring` | focus ring → `misc-ring` |
| `SearchBar` submit + `ChatPanel` Send + `EmptyState` "Tutorial" | raw `<button>` dark-on-white | **`Button variant="primary"`** (`leftIcon`, `loading`) | `surface-primary`/`foreground-primary`, `rounded-button-*` | `loading` replaces manual spinner |
| `SearchBar` demo chips | pill `<button>` | **`Chip`** or **`ToggleButtons`** | `rounded-chip-*`, `surface-secondary` | grouped selection → `ToggleButtons` |
| `App` sidebar tabs | `<button>` list | **`Tabs`** _(not exported yet)_ → keep hand-rolled | `rounded-nav-item`, `surface-secondary` (active), `foreground-muted` | ask maintainers to promote `Tabs` |
| `App` header env/KS status dot | inline flex + colored dot | **`Banner`** (page-level) or **`Chip`** | `surface-status-*`, `foreground-status-*` | |
| `ChatPanel` "Asking about" chip | hardcoded `#BFF3A4`/`#60E21C` | **`Chip`** / **`Banner variant="info"`** | `tl-embed-*` or `surface-status-*` | removes 3 hardcoded hex |
| `ChatPanel` messages | manual bubbles | keep bubbles (`Feedback` parts optional) | `surface-secondary`, `surface-white`, `border-border-secondary` | keep behavior |
| `ChatPanel` close "×" | raw `<button>` `×` | **`IconButton`** + `CloseIcon` | `foreground-muted` | |
| `ExportButton` | `<button>` + custom icon | **`Button variant="secondary"`** + `DownloadIcon` | `rounded-button-*` | |
| `RevenueWidget` | `<div>` card + stat grid | **card via tokens** (no `Card` exported) + `Separator` between factors | `surface-white`, `border-border-secondary`, `rounded-tlds-3` | keep layout |
| `ClipGrid` / `ClipStrip` | grid of thumbnails | **card + `AspectRatio`** _(AspectRatio not exported)_ → tokens | `rounded-video-thumbnail`, `surface-card` | thumbnails use video-thumbnail radius |
| `HlsClipPlayer` play/pause | raw `<button>` + custom icons | **`IconButton`** + `PlayIcon`/`PauseIcon` | tokens | keep `hls.js` logic |
| `TimelineChart` | `recharts` + `<Tooltip>` | **Keep recharts**; theme its colors via CSS vars | feed `var(--tl-*)` into chart palette | recharts Tooltip ≠ DOM Tooltip |
| `SentimentStrip`/`EraClusters`/`InflectionPoints` | custom viz + `<button>` | **Keep**; restyle chrome | `surface-*`, `foreground-*`, status tokens | domain-specific |
| `NarrativePanel` | card + markdown | **card via tokens**; **`Accordion`** if collapsible | `surface-white`, `rounded-tlds-3` | |
| `EmptyState` scenario cards | `<button>` cards | **card via tokens** (no `Card`); badge → **`Chip`** | `rounded-tlds-4`, `surface-white`, hover `surface-secondary` | |
| `LoadingState` | `animate-pulse`/`animate-spin` | **`Spinner`** _(Skeleton not exported)_ | `rounded-spinner` | Button `loading` where applicable |
| `TutorialPanel` | long-form content | **`Text`** variants; **`Accordion`** for steps | typography tokens | |
| `Markdown` | `react-markdown` | **`Text`**-based renderer components | typography + `foreground-*` | map md elements → `<Text variant>` |
| `Icon` (10 custom SVGs) | hand-inlined paths | **TLDS icon set (180+)**: `PlayIcon`, `PauseIcon`, `CloseIcon`, `InfoIcon`, `SearchIcon`, `DownloadIcon`, `CopyIcon`, `CheckmarkIcon`/`CheckIcon`, `WarningIcon`, `SpinnerIcon` | color via `text-*`, size via `size-*` | **Track 2 only** (icons ship from the package); 1:1 name map exists |
| `TwelveLabsLogo` | custom SVG | **`TwelveLabsLogo`/`TwelveLabsLogoMark`** | — | **Track 2 only** |

**Not available from the library** (stay hand-rolled even under Track 2, styled
with tokens): `Tabs`, `Table`, `Dialog`, `AspectRatio`, `Skeleton`, `Progress`,
`Carousel`. Flag `Tabs` + `AspectRatio` to the TLDS maintainers as promotion
candidates — the app has clear uses.

---

## 6. Phased PR plan

Each PR is independently shippable, reversible, and preserves behavior. Risk and
verification are per-PR. **Verification baseline for every PR** (no test suite
exists): `cd frontend && npm run lint` (`tsc -b --noEmit`) + `npm run build`,
then run `npm run dev` against the backend and **manually diff both tabs**
(Brand/Adidas + Narrative/Trump) and the Tutorial tab, including: search → chart
→ clip select → chat followup → CSV export → HLS playback. Capture
before/after screenshots.

### Track 1 — Tokens-first (no upgrade). Ship these now.

**PR 1 — Introduce TLDS tokens as CSS vars (additive, zero call-site change).**
- Vendor `tokens.css` (commit a pinned copy with a provenance comment so the
  public repo doesn't need the private registry). Import it first in `index.css`.
- Add semantic color/radius/font entries to `tailwind.config.js`
  `theme.extend` that reference the vars (`surface-*`, `foreground-*`,
  `border-*`, `rounded-tlds-*`, `font-tl-sans/mono`). **Do not remove** the
  existing `neutral`/`brand` ramps yet — both coexist.
- **Risk:** very low (purely additive). **Verify:** build + confirm new
  utilities resolve on a scratch element; no visual change expected.

**PR 2 — Migrate the shell (`App.tsx`) + global CSS to semantic tokens.**
- Replace `neutral-*`/hex in `App.tsx`, `index.css` (scrollbar, selection,
  keyframes) with `surface-*`/`foreground-*`/`border-*`. Cards → `surface-white`.
- **Risk:** low–medium (visible chrome). **Verify:** header/sidebar/footer
  visual diff; both tabs still switch and clear state correctly.

**PR 3 — Migrate data/display components** (`RevenueWidget`, `ClipGrid`,
`ClipStrip`, `NarrativePanel`, narrative/*): colors + radius → tokens.
- **Risk:** low. **Verify:** run a query, confirm chart/clip/narrative render
  identically; check the `#60E21C`/`#BFF3A4` accent replacements.

**PR 4 — Migrate interactive components** (`SearchBar`, `ChatPanel`,
`ExportButton`, `HlsClipPlayer`, `EmptyState`, `LoadingState`): raw
`<button>`/`<input>` restyled with tokens (still native elements). Fix focus
rings to `ring-misc-ring`.
- **Risk:** medium (focus/disabled/hover states). **Verify:** keyboard focus
  rings, disabled states, submit/enter, export, playback.

**PR 5 — Retire the inverted ramps + hex sweep.**
- Remove the `neutral`/`brand` remap and `highlight` from `tailwind.config.js`;
  grep-fail the build on any remaining `neutral-`, `brand-`, or `#hex` in
  `src/`. `Icon.tsx` viewBoxes/paths untouched (color already `currentColor`).
- **Risk:** low if PRs 2–4 were complete (build breaks loudly on leftovers).
  **Verify:** `grep -rE '(neutral|brand)-[0-9]|#[0-9A-Fa-f]{6}' src` returns
  only intentional cases; full visual pass.

_After Track 1: the app is fully on Strand semantic tokens, still React 18 +
Tailwind v3, behavior unchanged, and the styling is legible and drift-resistant._

### Track 2 — Component library (needs approval + upgrades). Later milestone.

**PR 6 — Stack upgrade: Tailwind v3→v4.** Run `@tailwindcss/upgrade`; swap
PostCSS→`@tailwindcss/vite`; reorder `@import`; fix ring/radius/border-color
deltas (§3.1). **Verify:** full visual regression on every screen (this is the
riskiest PR — budget a dedicated review).

**PR 7 — Stack upgrade: React 18→19.** Run the React 19 codemod; bump
`@types/react`; verify react-query/zustand/recharts/react-markdown peer ranges.
**Verify:** typecheck + full flow; watch StrictMode double-invoke and the
EventSource hook (`useEventSource`).

**PR 8 — Wire up the library + token stylesheets.** Configure `.npmrc` +
`REGISTRY_TOKEN`, install pinned `@twelvelabs-io/react@0.30.x`, import
`tokens.css` + `theme.css` after `@import "tailwindcss"`, add `TooltipProvider`
at the root. Delete the vendored `tokens.css` from PR 1. **Verify:** a single
`<Button>` renders with correct styling (proves the CSS import order).

**PR 9…N — Swap components incrementally**, one logical group per PR, in this
order (lowest risk first): icons (`Icon.tsx`→TLDS icons) → `Button`/`IconButton`
→ `TextField` → `Chip`/`ToggleButtons` → `Spinner` → `Banner` → `Text`/`Markdown`
→ `Accordion`/`Select`/`Popover` where applicable. Each PR: swap, delete dead
local code, re-verify the affected flow. Keep `Tabs`/`Table`/`AspectRatio`
hand-rolled (not exported).

---

## 7. Risks & open questions

1. **Library maturity.** Pre-1.0, "not production ready," breaking changes
   between releases. Pin exact version; run the `twelvelabs-ui-migrate` skill on
   every bump. Is the team OK owning this for a public sample app?
2. **Private registry in a public repo.** External contributors can't
   `npm install` without an SSO-authorized token. Track 1 avoids this entirely.
3. **`surface-card` vs `surface-white`.** Decide with design whether cards
   should shift from pure white to `#ececec`. Plan preserves white by default.
4. **Muted-text contrast shift** (`neutral-500 #6B6966` → `foreground-muted
   #45423f`). Likely an a11y win; confirm it's intended.
5. **recharts theming.** The chart palette must be fed token CSS vars manually;
   there's no TLDS chart component. Verify legibility of series colors on
   `surface-white`.
6. **No test/Storybook safety net.** Consider adding Playwright smoke tests or a
   lightweight visual-snapshot step before Track 2's stack upgrades.
7. **Cursor convention.** TLDS uses `cursor-default` on clickable controls
   (pointer only for links). Adopting library components will change cursor
   behavior on buttons — expected, note it for QA.

---

## 8. Appendix — how the tokens ship (why the split works)

- **`tokens.css`** = `:root { --tl-color-*, --tl-surface-*, --tl-radius-*, … }`
  — **plain CSS custom properties, framework-agnostic.** Safe on Tailwind v3;
  this is what Track 1 consumes.
- **`theme.css`** = `@theme inline { --color-surface-body: var(--tl-surface-body); … }`
  plus `@source` — **Tailwind v4 syntax only.** It's what turns the vars into
  `bg-surface-body`-style utilities in a v4 build. On v3 we replicate the subset
  we need via `tailwind.config.js` instead.
- The library's compiled components reference the v4-registered utilities
  (`rounded-dialog`, `bg-surface-body`), so **rendering the library's own
  components correctly requires the full v4 theme** — hence Track 2's Tailwind v4
  prerequisite.
- Setup order that must hold under Track 2 (from the `twelvelabs-ui` skill):
  ```css
  @import "tailwindcss";
  @import "@twelvelabs-io/react/tokens.css";
  @import "@twelvelabs-io/react/theme.css";
  ```
