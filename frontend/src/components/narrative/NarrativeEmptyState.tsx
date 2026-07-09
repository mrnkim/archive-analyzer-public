import { Icon } from "../Icon";

// Empty state for the Narrative Evolution tab — one demo that traces a public
// figure's media portrayal across decades (PRD Scenario B).

export const NARRATIVE_DEMO = {
  query: "How has Donald Trump's media portrayal evolved from the 1980s to 2026?",
  scenario: "N",
};

type Props = {
  onRun: (query: string, scenario?: string) => void;
};

export function NarrativeEmptyState({ onRun }: Props) {
  return (
    <div className="space-y-10 py-4">
      <div className="mx-auto max-w-2xl text-center space-y-4">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border-secondary bg-surface-white px-3 py-1 text-xs font-medium text-foreground-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-tl-gray-600" />
          Powered by TwelveLabs Jockey
        </span>
        <h2 className="text-2xl sm:text-3xl font-semibold text-foreground-body tracking-tight">
          Trace how a media narrative evolved across decades
        </h2>
        <p className="text-sm text-foreground-subtle leading-relaxed">
          Jockey reasons across a multi-decade broadcast archive to surface the
          dominant framing of each era, how the tone of coverage shifted, and the
          pivotal moments where the story turned — with clip-level evidence.
        </p>
      </div>

      <div>
        <p className="mb-3 text-center text-xs uppercase tracking-wider text-foreground-subtle">
          Try the demo
        </p>
        <div className="mx-auto max-w-md">
          <button
            onClick={() => onRun(NARRATIVE_DEMO.query, NARRATIVE_DEMO.scenario)}
            className="group flex w-full flex-col rounded-tlds-4 border border-border-secondary bg-surface-white p-4 text-left transition-colors hover:border-border-secondary hover:bg-surface-secondary"
          >
            <span className="mb-2.5 inline-flex h-7 w-7 items-center justify-center rounded-nav-item bg-surface-secondary text-sm font-semibold text-foreground-body">
              N
            </span>
            <h3 className="text-sm font-medium text-foreground-body">
              Donald Trump — 1980s to 2026
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-foreground-subtle">
              From real-estate mogul to reality-TV celebrity to president —
              thematic eras, sentiment shifts, and inflection points.
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-foreground-body">
              <Icon name="search" className="h-3 w-3" />
              Run narrative analysis
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
