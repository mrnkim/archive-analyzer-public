import { SearchIcon } from "@twelvelabs-io/react";
import type { TimelinePoint } from "../../types/api";
import { pointKey, pointLabel } from "../../lib/period";

// Retroactive Discovery panel — the COVID tab's signature differentiator
// (PRD Scenario C). Unlike the borrowed Inflection Points list, this leads
// with the "wow": Jockey surfaced references to the outbreak *by meaning*,
// months before "COVID-19" existed as a term. It contrasts the earliest
// pre-terminology reference against the official WHO naming date, then lists
// the pre-naming clips with the exact language Jockey matched on.

// The WHO assigned the name "COVID-19" on 11 Feb 2020; everything the archive
// surfaced before that is a retroactive, keyword-free discovery.
const OFFICIAL_NAMING = "Feb 11, 2020";

type Props = {
  timeline: TimelinePoint[];
  onSelectKey: (key: number) => void;
  selectedKey: number | null;
};

export function RetroactiveDiscovery({ timeline, onSelectKey, selectedKey }: Props) {
  const preTerm = timeline
    .filter((p) => p.pre_terminology)
    .slice()
    .sort((a, b) => pointKey(a) - pointKey(b));

  // No pre-terminology evidence → nothing retroactive to show.
  if (preTerm.length === 0) return null;

  const clips = preTerm.flatMap((p) =>
    (p.scenes ?? []).map((s) => ({
      key: pointKey(p),
      label: pointLabel(p),
      reason: s.reason || p.dominant_theme,
    }))
  );
  const count = clips.length || preTerm.reduce((n, p) => n + p.frequency, 0);
  const earliest = pointLabel(preTerm[0]);

  return (
    <div className="bg-surface-white border border-border-secondary rounded-tlds-3 p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="text-sm font-medium text-foreground-muted">Retroactive discovery</h3>
        <span className="inline-flex items-center gap-1 rounded-nav-item border border-border-secondary bg-surface-secondary px-2 py-0.5">
          <SearchIcon className="w-3 h-3 text-tl-embed-green" />
          <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-foreground-muted">
            Matched by meaning · not keywords
          </span>
        </span>
      </div>

      {/* Hero: the pre-naming discovery count is the headline. */}
      <div className="rounded-nav-item border border-border-secondary bg-[color-mix(in_srgb,var(--tl-surface-body)_50%,transparent)] px-3 py-3">
        <p className="text-lg font-semibold leading-snug text-foreground-body">
          <span className="text-tl-embed-green tabular-nums">{count}</span>{" "}
          {count === 1 ? "clip" : "clips"} referenced the outbreak before it had a name
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span className="text-foreground-muted">
            Earliest reference:{" "}
            <span className="font-tl-mono text-tl-embed-green">{earliest}</span>
          </span>
          <span className="text-foreground-subtle">·</span>
          <span className="text-foreground-subtle">
            Official name “COVID-19”:{" "}
            <span className="font-tl-mono text-foreground-muted">{OFFICIAL_NAMING}</span>
          </span>
        </div>
      </div>

      {/* The pre-naming clips, with the language Jockey matched semantically. */}
      <ul className="mt-3 space-y-1.5">
        {clips.map((c, i) => {
          const active = selectedKey === c.key;
          return (
            <li key={i}>
              <button
                onClick={() => onSelectKey(c.key)}
                title={`Load ${c.label} evidence`}
                className={`group flex w-full items-start gap-2 rounded-nav-item border px-2.5 py-1.5 text-left transition-colors ${
                  active
                    ? "border-border-secondary bg-surface-secondary"
                    : "border-transparent hover:bg-surface-secondary"
                }`}
              >
                <span className="mt-px font-tl-mono text-xs text-tl-embed-green whitespace-nowrap">
                  {c.label}
                </span>
                <span className="text-xs leading-relaxed text-foreground-subtle group-hover:text-foreground-body">
                  {c.reason}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
