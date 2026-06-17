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
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-500">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
          Powered by TwelveLabs Jockey
        </span>
        <h2 className="text-2xl sm:text-3xl font-semibold text-neutral-50 tracking-tight">
          Trace how a media narrative evolved across decades
        </h2>
        <p className="text-sm text-neutral-400 leading-relaxed">
          Jockey reasons across a multi-decade broadcast archive to surface the
          dominant framing of each era, how the tone of coverage shifted, and the
          pivotal moments where the story turned — with clip-level evidence.
        </p>
      </div>

      <div>
        <p className="mb-3 text-center text-xs uppercase tracking-wider text-neutral-500">
          Try the demo
        </p>
        <div className="mx-auto max-w-md">
          <button
            onClick={() => onRun(NARRATIVE_DEMO.query, NARRATIVE_DEMO.scenario)}
            className="group flex w-full flex-col rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-left transition-colors hover:border-brand-500/50 hover:bg-neutral-900/70"
          >
            <span className="mb-2.5 inline-flex h-7 w-7 items-center justify-center rounded-md bg-brand-500/15 text-sm font-semibold text-brand-500">
              N
            </span>
            <h3 className="text-sm font-medium text-neutral-100">
              Donald Trump — 1980s to 2026
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-neutral-500">
              From real-estate mogul to reality-TV celebrity to president —
              thematic eras, sentiment shifts, and inflection points.
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-500">
              <Icon name="search" className="h-3 w-3" />
              Run narrative analysis
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
