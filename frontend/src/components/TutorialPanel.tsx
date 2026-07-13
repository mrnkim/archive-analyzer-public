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

function Check({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <svg
        viewBox="0 0 20 20"
        className="mt-0.5 h-4 w-4 flex-none text-tl-embed-green"
        fill="currentColor"
        aria-hidden
      >
        <path
          fillRule="evenodd"
          d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.3 3.3 6.8-6.8a1 1 0 0 1 1.4 0Z"
          clipRule="evenodd"
        />
      </svg>
      <span className="text-sm leading-relaxed text-foreground-subtle">{children}</span>
    </li>
  );
}

const FLOW = [
  ["User", "types a natural-language question"],
  ["FastAPI /api/query", "POST /v1.3/responses — instructions + JSON Schema + KS_ID"],
  ["Jockey", "returns structured JSON: timeline + narrative"],
  ["Enrichment", "resolves clip thumbnails + HLS manifests"],
  ["React UI", "timeline chart · clip strip · video playback · chat"],
];

export function TutorialPanel() {
  return (
    <div className="mx-auto max-w-3xl pb-16">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-tlds-4 border border-border-secondary bg-gradient-to-b from-surface-white to-surface-body px-6 py-10 md:px-10 md:py-12">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[color-mix(in_srgb,var(--tl-color-embed-green)_10%,transparent)] blur-3xl" />
        <Pill>
          <span className="h-1.5 w-1.5 rounded-full bg-tl-embed-green" />
          Tutorial
        </Pill>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground-body md:text-4xl">
          How this app works on TwelveLabs Jockey
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground-subtle md:text-base">
          Jockey indexes your videos into a <strong className="text-foreground-muted">Knowledge
          Store</strong>. Your app calls <code className="rounded bg-surface-secondary px-1.5 py-0.5 text-xs text-tl-embed-green">POST /v1.3/responses</code> with
          a question + a JSON Schema, and gets back a structured answer the UI can
          render. Everything else is plumbing.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat value="23" label="videos indexed" />
          <Stat value="1990–2025" label="time range" />
          <Stat value="3" label="demo scenarios" />
          <Stat value="~10ms" label="cached vs 60–180s cold" />
        </div>
      </div>

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
            Use a <strong className="text-foreground-muted">300s timeout</strong> — reasoning over
            a multi-video KS regularly runs 60–180s.
          </Card>
        </div>
      </Section>

      {/* Three keys */}
      <Section eyebrow="What we learned" title="Three keys to a usable answer">
        <div className="space-y-6">
          <Step n={1} title="Visual-cue prompts">
            A bare "look for the Adidas brand" makes Jockey search for the{" "}
            <em>spoken or written</em> word — which broadcasts rarely say, so you get{" "}
            <strong className="text-foreground-muted">zero results</strong>. Instead, tell it what{" "}
            <em>visual</em> signals to look for by name (three-stripes kits, the trefoil
            logo, specific match balls). This one change turned "0 timeline points" into
            "10 with thumbnails."
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
            A cold query takes 60–180s; a SQLite cache hit takes microseconds. This app
            also ships <em>primed</em> answers in the repo so the demo buttons respond
            instantly on a fresh deploy.
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

      {/* Gotcha checklist */}
      <Section eyebrow="Before you ship" title="Gotcha checklist">
        <Card>
          <ul className="space-y-2.5">
            <Check>Sub-360p videos are silently rejected at ingest — curate HD only.</Check>
            <Check>
              <code className="text-foreground-muted">representative_clip.asset_id</code> is a KSI
              UUID, not the hex key — always convert.
            </Check>
            <Check>Generic brand prompts find zero clips — name the visual signals.</Check>
            <Check>Jockey is stochastic — cache, pre-prime, validate with a schema.</Check>
            <Check>Timeout 300s, not 120s.</Check>
            <Check>
              <code className="text-foreground-muted">&lt;vref&gt;</code> citation tags are not
              HTML — pre-process them before rendering markdown.
            </Check>
            <Check>
              API key lives in <code className="text-foreground-muted">.env</code> (gitignored) —
              never commit it to source.
            </Check>
          </ul>
        </Card>
      </Section>

      <p className="mt-12 text-center text-xs text-foreground-subtle">
        Built on the TwelveLabs Jockey API. See the{" "}
        <code className="text-foreground-subtle">README</code> for setup and configuration.
      </p>
    </div>
  );
}
