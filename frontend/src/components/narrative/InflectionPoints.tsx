import type { InflectionPoint } from "../../types/api";

// Inflection points (PRD Scenario B differentiator #3): the pivotal years
// where the narrative shifted. Clicking one jumps to that year's evidence.

type Props = {
  points: InflectionPoint[];
  onSelectYear: (year: number) => void;
};

export function InflectionPoints({ points, onSelectYear }: Props) {
  if (!points || points.length === 0) return null;

  return (
    <div className="bg-surface-white border border-border-secondary rounded-tlds-3 p-4">
      <h3 className="text-sm font-medium text-foreground-muted mb-3">Inflection points</h3>
      <ol className="relative space-y-3 border-l border-border-secondary pl-4">
        {points
          .slice()
          .sort((a, b) => a.year - b.year)
          .map((ip, i) => (
            <li key={i} className="relative">
              <span className="absolute left-[-21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-surface-body bg-tl-embed-green" />
              <button
                onClick={() => onSelectYear(ip.year)}
                className="group text-left"
                title={`Jump to ${ip.year}`}
              >
                <div className="flex items-baseline gap-2">
                  <span className="font-tl-mono text-xs text-tl-embed-green group-hover:underline">
                    {ip.year}
                  </span>
                  <span className="text-sm font-medium text-foreground-body">{ip.label}</span>
                </div>
                {ip.why && (
                  <p className="mt-0.5 text-xs leading-relaxed text-foreground-subtle">{ip.why}</p>
                )}
              </button>
            </li>
          ))}
      </ol>
    </div>
  );
}
