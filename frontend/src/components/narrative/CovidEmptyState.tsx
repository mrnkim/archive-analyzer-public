import { SearchIcon } from "@twelvelabs-io/react";

// Empty state for the Retroactive Discovery (COVID-19) tab — PRD Scenario C.
// The "wow" is surfacing broadcast references to an unexplained respiratory
// illness in Wuhan *before* it was named COVID-19.

export const COVID_DEMO = {
  // Deliberately keyword-free (no "COVID-19") — the whole point is that Jockey
  // finds the illness references by MEANING, before the term existed. Must stay
  // byte-identical to data/primed/scenario_v.json's `query` (the cache key).
  query:
    "Show me references to respiratory illness, unusual pneumonia, and Wuhan across 2019–2020 archive content — surface the earliest mentions and how the coverage evolved.",
  scenario: "V",
};

type Props = {
  onRun: (query: string, scenario?: string) => void;
};

export function CovidEmptyState({ onRun }: Props) {
  return (
    <div className="space-y-10 py-4">
      <div className="mx-auto max-w-2xl text-center space-y-4">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border-secondary bg-surface-white px-3 py-1 text-xs font-medium text-foreground-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-tl-gray-600" />
          Powered by TwelveLabs Jockey
        </span>
        <h2 className="text-2xl sm:text-3xl font-semibold text-foreground-body tracking-tight">
          Find the story before it had a name
        </h2>
        <p className="text-sm text-foreground-subtle leading-relaxed">
          Jockey searches a 2019–2020 broadcast archive semantically — without the
          query ever using the term "COVID-19" — surfacing references to an
          unexplained respiratory illness in Wuhan from the earliest December 2019
          disclosure, then tracing the month-by-month arc through the WHO naming,
          the pandemic declaration, and the first vaccines.
        </p>
      </div>

      <div>
        <p className="mb-3 text-center text-xs uppercase tracking-wider text-foreground-subtle">
          Try the demo
        </p>
        <div className="mx-auto max-w-md">
          <button
            onClick={() => onRun(COVID_DEMO.query, COVID_DEMO.scenario)}
            className="group flex w-full flex-col rounded-tlds-4 border border-border-secondary bg-surface-white p-4 text-left transition-colors hover:border-border-secondary hover:bg-surface-secondary"
          >
            <span className="mb-2.5 inline-flex h-7 w-7 items-center justify-center rounded-nav-item bg-surface-secondary text-sm font-semibold text-foreground-body">
              V
            </span>
            <h3 className="text-sm font-medium text-foreground-body">
              COVID-19 — retroactive discovery, 2019 → 2020
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-foreground-subtle">
              From the Dec 2019 "pneumonia of unknown cause" disclosure to a named
              pandemic to the vaccine rollout — month-by-month signals and the
              moments the story turned.
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-foreground-body">
              <SearchIcon className="h-3 w-3" />
              Run retroactive analysis
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
