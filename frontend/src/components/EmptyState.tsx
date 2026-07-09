import { Icon } from "./Icon";
import { SEED_QUERIES } from "./SearchBar";

type Props = {
  onSelect: (query: string, scenario?: string) => void;
  onOpenTutorial?: () => void;
};

export function EmptyState({ onSelect, onOpenTutorial }: Props) {
  return (
    <div className="space-y-10 py-4">
      {/* Hero */}
      <div className="mx-auto max-w-2xl text-center space-y-4">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border-secondary bg-surface-white px-3 py-1 text-xs font-medium text-foreground-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-tl-gray-600" />
          Powered by TwelveLabs Jockey
        </span>
        <h2 className="text-2xl sm:text-3xl font-semibold text-foreground-body tracking-tight">
          Turn raw video archives into brand intelligence
        </h2>
        <p className="text-sm text-foreground-subtle leading-relaxed">
          Ask a question and Jockey searches the footage visually — surfacing
          every scene where the brand appears, a year-by-year timeline, an
          estimated archive value, and an AI-written narrative.
        </p>
      </div>

      {/* Demo scenario cards */}
      <div>
        <p className="mb-3 text-center text-xs uppercase tracking-wider text-foreground-subtle">
          Try a demo scenario
        </p>
        <div className="mx-auto grid max-w-4xl gap-3 sm:grid-cols-3">
          {SEED_QUERIES.map((s) => (
            <button
              key={s.scenario}
              onClick={() => onSelect(s.query, s.scenario)}
              className="group flex flex-col rounded-tlds-4 border border-border-secondary bg-surface-white p-4 text-left transition-colors hover:border-border-secondary hover:bg-surface-secondary"
            >
              <span className="mb-2.5 inline-flex h-7 w-7 items-center justify-center rounded-nav-item bg-surface-secondary text-sm font-semibold text-foreground-body">
                {s.scenario}
              </span>
              <h3 className="text-sm font-medium text-foreground-body">{s.title}</h3>
              <p className="mt-1 flex-1 text-xs leading-relaxed text-foreground-subtle">
                {s.blurb}
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-foreground-body">
                <Icon name="search" className="h-3 w-3" />
                Run scenario
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Pointer to the Tutorial tab (no duplicated how-it-works content) */}
      {onOpenTutorial && (
        <p className="text-center text-xs text-foreground-subtle">
          New here? See how it works in the{" "}
          <button
            onClick={onOpenTutorial}
            className="font-medium text-foreground-body hover:underline"
          >
            Tutorial
          </button>
          .
        </p>
      )}
    </div>
  );
}
