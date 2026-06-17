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
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
      <h3 className="text-sm font-medium text-neutral-300 mb-3">Inflection points</h3>
      <ol className="relative space-y-3 border-l border-neutral-800 pl-4">
        {points
          .slice()
          .sort((a, b) => a.year - b.year)
          .map((ip, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-neutral-950 bg-brand-500" />
              <button
                onClick={() => onSelectYear(ip.year)}
                className="group text-left"
                title={`Jump to ${ip.year}`}
              >
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-xs text-brand-500 group-hover:underline">
                    {ip.year}
                  </span>
                  <span className="text-sm font-medium text-neutral-100">{ip.label}</span>
                </div>
                {ip.why && (
                  <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">{ip.why}</p>
                )}
              </button>
            </li>
          ))}
      </ol>
    </div>
  );
}
