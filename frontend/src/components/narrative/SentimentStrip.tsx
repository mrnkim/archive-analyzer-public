import type { TimelinePoint } from "../../types/api";

// Sentiment overlay (PRD Scenario B differentiator #2): a year-by-year lane
// of the prevailing coverage tone, colored hostile (red) → neutral → favorable
// (green). Clicking a cell selects that year's evidence.

type Props = {
  timeline: TimelinePoint[];
  selectedYear: number | null;
  onSelect: (point: TimelinePoint) => void;
};

// Map a -1..1 score to a tone color. Red (hostile) → slate (neutral) →
// green (favorable), saturation tracking magnitude.
function toneColor(score: number): string {
  const s = Math.max(-1, Math.min(1, score));
  const hue = s >= 0 ? 145 : 0; // green vs red
  const mag = Math.abs(s);
  const sat = 18 + mag * 52; // 18%..70%
  const light = 30 - mag * 8; // darker as it gets stronger
  return `hsl(${hue} ${sat}% ${light}%)`;
}

function toneLabel(p: TimelinePoint): string {
  const lbl = p.sentiment?.label || "—";
  return lbl.charAt(0).toUpperCase() + lbl.slice(1);
}

export function SentimentStrip({ timeline, selectedYear, onSelect }: Props) {
  const points = timeline.filter((p) => p.sentiment);
  if (points.length === 0) return null;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
      <div className="flex items-center justify-between gap-4 mb-3">
        <h3 className="text-sm font-medium text-neutral-300">Coverage sentiment over time</h3>
        <div className="flex items-center gap-2 text-[10px] text-neutral-500">
          <span className="font-mono tabular-nums text-red-400">−1</span>
          <span className="inline-flex flex-col items-center gap-0.5">
            <span
              className="h-2 w-24 rounded-sm"
              style={{
                background: `linear-gradient(to right, ${toneColor(-1)}, ${toneColor(
                  0
                )}, ${toneColor(1)})`,
              }}
            />
            <span className="flex w-24 justify-between leading-none">
              <span>hostile</span>
              <span>neutral</span>
              <span>favorable</span>
            </span>
          </span>
          <span className="font-mono tabular-nums text-emerald-400">+1</span>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {points.map((p, i) => {
          const score = p.sentiment?.score ?? 0;
          const active = p.year === selectedYear;
          return (
            <button
              key={`${p.year}-${i}`}
              onClick={() => onSelect(p)}
              title={`${p.year} · ${toneLabel(p)} (${score >= 0 ? "+" : ""}${score.toFixed(2)}) · ${p.dominant_theme}`}
              className={
                "group flex min-w-[44px] flex-1 flex-col items-center gap-1 rounded-md border px-1 py-1.5 transition-colors " +
                (active
                  ? "border-brand-500 bg-brand-500/10"
                  : "border-neutral-800 hover:border-neutral-600")
              }
            >
              <span
                className="h-6 w-full rounded-sm"
                style={{ background: toneColor(score) }}
              />
              <span className="text-[10px] font-mono text-neutral-400">{p.year}</span>
              <span
                className={
                  "text-[10px] font-mono tabular-nums " +
                  (score > 0.1
                    ? "text-emerald-400"
                    : score < -0.1
                    ? "text-red-400"
                    : "text-neutral-500")
                }
              >
                {score >= 0 ? "+" : ""}
                {score.toFixed(2)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
