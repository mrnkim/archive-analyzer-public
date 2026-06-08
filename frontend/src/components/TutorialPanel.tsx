import type { ReactNode } from "react";

/**
 * In-app tutorial — a plain-language walkthrough of how this app talks to the
 * TwelveLabs Jockey API (search → structured answer → enriched clips).
 */

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-500">
      {children}
    </span>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 px-4 py-3 text-center">
      <div className="text-2xl font-semibold text-neutral-50">{value}</div>
      <div className="mt-0.5 text-xs text-neutral-500">{label}</div>
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
      <p className="text-xs font-semibold uppercase tracking-widest text-brand-500">
        {eyebrow}
      </p>
      <h2 className="mt-1.5 text-xl font-semibold text-neutral-50">{title}</h2>
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
        "rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 " + className
      }
    >
      {title && (
        <h3 className="mb-2 text-sm font-semibold text-neutral-100">{title}</h3>
      )}
      <div className="text-sm leading-relaxed text-neutral-400">{children}</div>
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
      <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-brand-500/40 bg-brand-500/10 text-sm font-semibold text-brand-500">
        {n}
      </div>
      <div className="pb-2">
        <h3 className="text-sm font-semibold text-neutral-100">{title}</h3>
        <div className="mt-1 text-sm leading-relaxed text-neutral-400">
          {children}
        </div>
      </div>
    </div>
  );
}

function Code({ lang, children }: { lang?: string; children: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950">
      {lang && (
        <div className="border-b border-neutral-800 px-3 py-1.5 text-[11px] font-medium text-neutral-500">
          {lang}
        </div>
      )}
      <pre className="overflow-x-auto px-3 py-2.5 text-xs leading-relaxed text-neutral-300">
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
        className="mt-0.5 h-4 w-4 flex-none text-brand-500"
        fill="currentColor"
        aria-hidden
      >
        <path
          fillRule="evenodd"
          d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.3 3.3 6.8-6.8a1 1 0 0 1 1.4 0Z"
          clipRule="evenodd"
        />
      </svg>
      <span className="text-sm leading-relaxed text-neutral-400">{children}</span>
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
      <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-gradient-to-b from-neutral-900 to-neutral-950 px-6 py-10 md:px-10 md:py-12">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl" />
        <Pill>
          <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
          Tutorial
        </Pill>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-neutral-50 md:text-4xl">
          How this app works on TwelveLabs Jockey
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-400 md:text-base">
          Jockey indexes your videos into a <strong className="text-neutral-200">Knowledge
          Store</strong>. Your app calls <code className="rounded bg-neutral-800 px-1.5 py-0.5 text-xs text-brand-500">POST /v1.3/responses</code> with
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
              <div className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900/60 px-4 py-3">
                <span className="text-xs font-semibold text-brand-500">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <div className="text-sm font-medium text-neutral-100">{label}</div>
                  <div className="text-xs text-neutral-500">{desc}</div>
                </div>
              </div>
              {i < FLOW.length - 1 && (
                <div className="ml-6 h-3 w-px bg-neutral-800" />
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
            <code className="text-brand-500">KS_ID</code>. Ingest happens once,
            out-of-band — upload your sources, let indexing finish, then save the
            returned <code className="text-brand-500">KS_ID</code> into your{" "}
            <code className="text-brand-500">.env</code>. Curate{" "}
            <strong className="text-neutral-200">HD clips only</strong> — sub-360p
            footage is silently rejected at ingest.
          </Card>
          <Card title="② Query — every request">
            Your backend calls <code className="text-brand-500">POST /v1.3/responses</code> directly
            over HTTPS at runtime. Three fields matter:{" "}
            <code className="text-brand-500">instructions</code> (persona),{" "}
            <code className="text-brand-500">text.format</code> (JSON Schema), and{" "}
            <code className="text-brand-500">session_id</code> (multi-turn).
            Use a <strong className="text-neutral-200">300s timeout</strong> — reasoning over
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
            <strong className="text-neutral-200">zero results</strong>. Instead, tell it what{" "}
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
            Jockey returns a <code className="text-brand-500">session_id</code> on every
            response. Thread it into the next call and the model keeps full context for
            follow-ups — no re-querying, no re-summarizing.
          </Step>
        </div>
      </Section>

      {/* Biggest gotcha */}
      <Section eyebrow="Watch out" title="The biggest gotcha: UUID ↔ hex">
        <Card className="border-amber-500/30 bg-amber-500/5">
          <p>
            When Jockey emits <code className="text-amber-400">representative_clip.asset_id</code>,
            it gives you a <strong className="text-neutral-200">KSI UUID</strong> — but{" "}
            <code className="text-amber-400">GET /v1.3/assets/{"{id}"}</code> only accepts the{" "}
            <strong className="text-neutral-200">24-char hex</strong> key. Convert via{" "}
            <code className="text-amber-400">GET /knowledge-stores/{"{ks_id}"}/items</code> (it
            returns both IDs), build the map once, and reuse it — see{" "}
            <code className="text-amber-400">backend/app/deps/jockey_assets.py</code>.
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
            With no <code className="text-brand-500">KS_ID</code>/API key set, every route
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
              <code className="text-neutral-300">representative_clip.asset_id</code> is a KSI
              UUID, not the hex key — always convert.
            </Check>
            <Check>Generic brand prompts find zero clips — name the visual signals.</Check>
            <Check>Jockey is stochastic — cache, pre-prime, validate with a schema.</Check>
            <Check>Timeout 300s, not 120s.</Check>
            <Check>
              <code className="text-neutral-300">&lt;vref&gt;</code> citation tags are not
              HTML — pre-process them before rendering markdown.
            </Check>
            <Check>
              API key lives in <code className="text-neutral-300">.env</code> (gitignored) —
              never commit it to source.
            </Check>
          </ul>
        </Card>
      </Section>

      <p className="mt-12 text-center text-xs text-neutral-600">
        Built on the TwelveLabs Jockey API. See the{" "}
        <code className="text-neutral-500">README</code> for setup and configuration.
      </p>
    </div>
  );
}
