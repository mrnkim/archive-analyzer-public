import type { ReactNode } from "react";

/**
 * In-app tutorial — a plain-language walkthrough of how this app talks to the
 * TwelveLabs Jockey API (search → structured answer → enriched clips).
 */

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--tl-color-embed-green)_30%,transparent)] bg-[color-mix(in_srgb,var(--tl-color-embed-green)_10%,transparent)] px-3 py-1 text-xs font-medium text-tl-embed-green">
      {children}
    </span>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-tlds-4 border border-border-secondary bg-[color-mix(in_srgb,var(--tl-surface-white)_60%,transparent)] px-4 py-3 text-center">
      <div className="text-2xl font-semibold text-foreground-body">{value}</div>
      <div className="mt-0.5 text-xs text-foreground-subtle">{label}</div>
    </div>
  );
}

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-14">
      <p className="text-xs font-semibold uppercase tracking-widest text-tl-embed-green">
        {eyebrow}
      </p>
      <h2 className="mt-1.5 text-xl font-semibold text-foreground-body">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Card({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={
        "rounded-tlds-4 border border-border-secondary bg-[color-mix(in_srgb,var(--tl-surface-white)_60%,transparent)] p-5 " + className
      }
    >
      {title && (
        <h3 className="mb-2 text-sm font-semibold text-foreground-body">{title}</h3>
      )}
      <div className="text-sm leading-relaxed text-foreground-subtle">{children}</div>
    </div>
  );
}

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--tl-color-embed-green)_40%,transparent)] bg-[color-mix(in_srgb,var(--tl-color-embed-green)_10%,transparent)] text-sm font-semibold text-tl-embed-green">
        {n}
      </div>
      <div className="pb-2">
        <h3 className="text-sm font-semibold text-foreground-body">{title}</h3>
        <div className="mt-1 text-sm leading-relaxed text-foreground-subtle">
          {children}
        </div>
      </div>
    </div>
  );
}

function Code({ lang, children }: { lang?: string; children: string }) {
  return (
    <div className="overflow-hidden rounded-tlds-3 border border-border-secondary bg-surface-body">
      {lang && (
        <div className="border-b border-border-secondary px-3 py-1.5 text-[11px] font-medium text-foreground-subtle">
          {lang}
        </div>
      )}
      <pre className="overflow-x-auto px-3 py-2.5 text-xs leading-relaxed text-foreground-muted">
        <code>{children}</code>
      </pre>
    </div>
  );
}

const FLOW = [
  ["Guided scenario", "selects a curated question and the right analysis lens"],
  ["FastAPI /api/query", "chooses the scenario's prompt, JSON Schema, and Knowledge Store"],
  ["Jockey", "returns structured JSON: timeline, evidence, and narrative"],
  ["Enrichment", "resolves clip thumbnails + HLS manifests"],
  ["React UI", "interactive timeline · source clips · export · follow-up chat"],
];

export function TutorialPanel() {
  return (
    <div className="mx-auto max-w-3xl pb-16">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-tlds-4 border border-border-secondary bg-linear-to-b from-surface-white to-surface-body px-6 py-10 md:px-10 md:py-12">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[color-mix(in_srgb,var(--tl-color-embed-green)_10%,transparent)] blur-3xl" />
        <Pill>
          <span className="h-1.5 w-1.5 rounded-full bg-tl-embed-green" />
          Tutorial
        </Pill>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground-body md:text-4xl">
          From archive to evidence-backed story
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground-subtle md:text-base">
          This sample turns curated video archives into three kinds of analysis:
          brand intelligence, narrative evolution, and retroactive discovery.
          Jockey searches each <strong className="text-foreground-muted">Knowledge Store</strong> and
          returns structured evidence that the interface can connect to playable clips.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat value="3" label="analysis lenses" />
          <Stat value="3" label="curated archives" />
          <Stat value="1990–2026" label="coverage span" />
          <Stat value="Pinned" label="instant demo results" />
        </div>
      </div>

      <Section eyebrow="Start here" title="Choose an analysis lens">
        <div className="grid gap-4 md:grid-cols-3">
          <Card title="Brand Intelligence · Adidas">
            Compare three guided brand questions across a sports archive. The
            year-by-year chart connects logo, kit, product, and campaign evidence
            to an estimated archive value.
            <p className="mt-3 text-xs font-medium text-foreground-muted">
              23 curated videos · 1994–2025
            </p>
          </Card>
          <Card title="Narrative Evolution · Trump">
            Follow a public figure&apos;s portrayal over decades. The timeline adds
            sentiment, thematic eras, and inflection points so the shifts in
            coverage are legible at a glance.
            <p className="mt-3 text-xs font-medium text-foreground-muted">
              39 broadcast videos · 1986–2026
            </p>
          </Card>
          <Card title="Retroactive Discovery · COVID-19">
            Find the story before it had a name. A keyword-free question surfaces
            early respiratory-illness coverage, then maps the Dec 2019–Dec 2020
            emergence month by month.
            <p className="mt-3 text-xs font-medium text-foreground-muted">
              21 news clips · Dec 2019–Dec 2020
            </p>
          </Card>
        </div>
      </Section>

      {/* Architecture flow */}
      <Section eyebrow="Architecture" title="The request flow">
        <div className="space-y-2">
          {FLOW.map(([label, desc], i) => (
            <div key={label}>
              <div className="flex items-center gap-3 rounded-tlds-3 border border-border-secondary bg-[color-mix(in_srgb,var(--tl-surface-white)_60%,transparent)] px-4 py-3">
                <span className="text-xs font-semibold text-tl-embed-green">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <div className="text-sm font-medium text-foreground-body">{label}</div>
                  <div className="text-xs text-foreground-subtle">{desc}</div>
                </div>
              </div>
              {i < FLOW.length - 1 && (
                <div className="ml-6 h-3 w-px bg-surface-secondary" />
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* Two halves */}
      <Section eyebrow="The big picture" title="Two halves you build separately">
        <div className="grid gap-4 md:grid-cols-2">
          <Card title="① Ingest — one-time">
            Push your videos into a TwelveLabs Knowledge Store and get back a{" "}
            <code className="text-tl-embed-green">KS_ID</code>. Ingest happens once,
            out-of-band — upload your sources, let indexing finish, then save the
            returned <code className="text-tl-embed-green">KS_ID</code> into your{" "}
            <code className="text-tl-embed-green">.env</code>. Curate{" "}
            <strong className="text-foreground-muted">HD clips only</strong> — sub-360p
            footage is silently rejected at ingest.
          </Card>
          <Card title="② Query — every request">
            Your backend calls <code className="text-tl-embed-green">POST /v1.3/responses</code> directly
            over HTTPS at runtime. Three fields matter:{" "}
            <code className="text-tl-embed-green">instructions</code> (persona),{" "}
            <code className="text-tl-embed-green">text.format</code> (JSON Schema), and{" "}
            <code className="text-tl-embed-green">session_id</code> (multi-turn).
            This app also selects a Knowledge Store per scenario: brand, narrative,
            or COVID discovery. Use a <strong className="text-foreground-muted">300s timeout</strong> — reasoning over
            a multi-video archive can take 60–180s.
          </Card>
        </div>
      </Section>

      <Section eyebrow="Reading a result" title="Move from a claim to its source">
        <div className="space-y-6">
          <Step n={1} title="Start with the timeline">
            Choose any bar, point, or monthly signal. The selected period becomes
            the active piece of evidence throughout the page. COVID uses a filled
            monthly emergence curve and marks the point where the WHO named COVID-19.
          </Step>
          <Step n={2} title="Read the linked story">
            Timeline selection highlights the matching summary bullet. Narrative
            Evolution also exposes sentiment and pivotal moments; Retroactive
            Discovery calls out evidence found before the disease had a name.
          </Step>
          <Step n={3} title="Verify with clips, then continue the conversation">
            The selected period&apos;s scenes appear directly below the chart. Play a
            clip, scan every representative clip in the strip, export the evidence,
            or ask a follow-up scoped to the selected media context.
          </Step>
        </div>
      </Section>

      {/* Three keys */}
      <Section eyebrow="What we learned" title="Three keys to a usable answer">
        <div className="space-y-6">
          <Step n={1} title="Visual-cue and meaning-based prompts">
            A bare "look for the Adidas brand" makes Jockey search for the{" "}
            <em>spoken or written</em> word — which broadcasts rarely say, so you get{" "}
            <strong className="text-foreground-muted">zero results</strong>. Instead, tell it what{" "}
            <em>visual</em> signals to look for by name (three-stripes kits, the trefoil
            logo, specific match balls). The COVID scenario takes the same idea in a
            different direction: it asks about respiratory illness, unusual pneumonia,
            and Wuhan — never the later term "COVID-19" — to surface pre-naming coverage.
            <div className="mt-3">
              <Code lang="backend/app/prompts/scenarios.py">{"# Brand: search what the camera shows, not only speech/OCR.\nLook for:\n- The three-stripes motif on team kits, footwear, shorts, and tracksuits\n- Official match balls: Jabulani (2010), Brazuca (2014), Telstar (2018)\n- Stadium boards, sideline LED ads, and product hero shots\n\n# COVID: use the vocabulary available before the final name existed.\nShow how references to respiratory illness, unusual pneumonia, and Wuhan\nevolved — surface the earliest mentions."}</Code>
            </div>
          </Step>
          <Step n={2} title="JSON Schema for output">
            Don't ask for prose and regex-parse it. Hand Jockey a schema and it returns
            conformant data, validated server-side with Pydantic — a malformed reply
            becomes a clean 502 instead of a UI crash.
            <div className="mt-3">
              <Code lang="python">{`body = {
  "model": "jockey1.0",
  "knowledge_store_id": ks_id,
  "input": [{"type": "message", "role": "user", "content": question}],
  "instructions": SCENARIO_PROMPT,
  "text": {"format": {"type": "json_schema", "name": "trend_data", "schema": {...}}},
}`}</Code>
            </div>
          </Step>
          <Step n={3} title="Session continuity">
            Jockey returns a <code className="text-tl-embed-green">session_id</code> on every
            response. Thread it into the next call and the model keeps full context for
            follow-ups — no re-querying, no re-summarizing.
          </Step>
        </div>
      </Section>

      <Section eyebrow="From this codebase" title="Why the scenarios stay reliable">
        <div className="grid gap-4 md:grid-cols-2">
          <Card title="The backend selects the right archive and schema">
            A scenario is more than a tab label. The query route picks its
            Knowledge Store, prompt, and output contract before it calls Jockey.
            COVID gets a stricter month-level contract; Narrative Evolution gets
            per-period sentiment and inflection points.
            <div className="mt-3">
              <Code lang="backend/app/routes/query.py">{"ks_id = settings.ks_for_scenario(req.scenario)\ninstructions = get_instructions(req.scenario)\n_sc = (req.scenario or \"\").upper()\n\nif _sc == \"V\":\n    text_format = COVID_DATA_JSON_SCHEMA\nelif _sc == \"N\":\n    text_format = NARRATIVE_DATA_JSON_SCHEMA\nelse:\n    text_format = TREND_DATA_JSON_SCHEMA"}</Code>
            </div>
          </Card>
          <Card title="The model output is checked before the UI sees it">
            The response is parsed as JSON and validated with Pydantic. The
            backend then resolves every scene&apos;s Knowledge Store item ID to an
            asset ID so thumbnails and HLS playback work for all evidence, not
            only the representative clip.
            <div className="mt-3">
              <Code lang="backend/app/routes/query.py">{"structured = _extract_structured_payload(raw)\nvalidated = TrendResponse(**structured)\n\nks_items = await _list_all_ks_items(api_key, ks_id, base_url)\nuuid_to_hex = {item[\"ksi_uuid\"]: item[\"asset_id\"] for item in ks_items}\nresolved = await jockey_api.resolve_assets(api_key, hex_ids)"}</Code>
            </div>
          </Card>
        </div>
      </Section>

      {/* Biggest gotcha */}
      <Section eyebrow="Watch out" title="The biggest gotcha: UUID ↔ hex">
        <Card className="border-[color-mix(in_srgb,var(--tl-misc-status-warning)_30%,transparent)] bg-[color-mix(in_srgb,var(--tl-misc-status-warning)_5%,transparent)]">
          <p>
            When Jockey emits <code className="text-foreground-status-warning">representative_clip.asset_id</code>,
            it gives you a <strong className="text-foreground-muted">KSI UUID</strong> — but{" "}
            <code className="text-foreground-status-warning">GET /v1.3/assets/{"{id}"}</code> only accepts the{" "}
            <strong className="text-foreground-muted">24-char hex</strong> key. Convert via{" "}
            <code className="text-foreground-status-warning">GET /knowledge-stores/{"{ks_id}"}/items</code> (it
            returns both IDs), build the map once, and reuse it — see{" "}
            <code className="text-foreground-status-warning">backend/app/deps/jockey_assets.py</code>.
          </p>
        </Card>
      </Section>

      {/* Operational patterns */}
      <Section eyebrow="In production" title="Operational patterns">
        <div className="grid gap-4 md:grid-cols-2">
          <Card title="Cache aggressively">
            A cold query takes 60–180s; a SQLite cache hit is effectively instant. This
            app ships <em>primed</em>, pinned answers for every guided demo and hydrates
            them into the cache on startup, so a fresh deploy stays explorable.
          </Card>
          <Card title="Jockey is stochastic">
            Same query → slightly different results, with no temperature knob. Mitigate by
            pre-priming the cache and validating every response against a strict schema.
          </Card>
          <Card title="Mock fallback">
            With no <code className="text-tl-embed-green">KS_ID</code>/API key set, every route
            falls back to seed JSON — so the UI runs without burning quota and CI stays
            deterministic.
          </Card>
          <Card title="Validate everything">
            Treat the model's output as untrusted: enforce a JSON Schema on every response
            so a malformed reply fails loud and early instead of corrupting the UI.
          </Card>
        </div>
      </Section>

      <p className="mt-12 text-center text-xs text-foreground-subtle">
        Built on the TwelveLabs Jockey API. See the{" "}
        <code className="text-foreground-subtle">README</code> for setup and configuration.
      </p>
    </div>
  );
}
