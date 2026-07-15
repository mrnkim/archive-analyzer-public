import type { TimelinePoint } from "../../types/api";
import { pointKey, pointLabel } from "../../lib/period";

// Sentiment overlay (PRD Scenario B differentiator #2): a lane of the prevailing
// coverage tone over time, colored hostile (red) → neutral → favorable (green).
// Works at year granularity (Trump) or month granularity (COVID). Clicking a
// cell selects that point's evidence. `selectedKey` is a period key (year, or
// year*100+month) — see lib/period.ts.

type Props = {
  timeline: TimelinePoint[];
  selectedKey: number | null;
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

export function SentimentStrip({ timeline, selectedKey, onSelect }: Props) {
  const points = timeline.filter((p) => p.sentiment);
  if (points.length === 0) return null;

  return (
    <div className="bg-surface-white border border-border-secondary rounded-tlds-3 p-4">
      <div className="flex items-center justify-between gap-4 mb-3">
        <h3 className="text-sm font-medium text-foreground-muted">Coverage sentiment over time</h3>
        <div className="flex items-center gap-2 text-[10px] text-foreground-subtle">
          <span className="font-tl-mono tabular-nums text-foreground-status-error">−1</span>
          <span className="inline-flex flex-col items-center gap-0.5">
            <span
              className="h-2 w-24 rounded-xs"
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
          <span className="font-tl-mono tabular-nums text-tl-embed-green">+1</span>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {points.map((p, i) => {
          const score = p.sentiment?.score ?? 0;
          const active = pointKey(p) === selectedKey;
          const label = pointLabel(p);
          return (
            <button
              key={`${pointKey(p)}-${i}`}
              onClick={() => onSelect(p)}
              title={`${label} · ${toneLabel(p)} (${score >= 0 ? "+" : ""}${score.toFixed(2)}) · ${p.dominant_theme}`}
              className={
                "group flex min-w-[44px] flex-1 flex-col items-center gap-1 rounded-nav-item border px-1 py-1.5 transition-colors " +
                (active
                  ? "border-tl-embed-green bg-[color-mix(in_srgb,var(--tl-color-embed-green)_10%,transparent)]"
                  : "border-border-secondary hover:border-foreground-subtle")
              }
            >
              <span
                className="h-6 w-full rounded-xs"
                style={{ background: toneColor(score) }}
              />
              <span className="text-[10px] font-tl-mono text-foreground-subtle whitespace-nowrap">{label}</span>
              <span
                className={
                  "text-[10px] font-tl-mono tabular-nums " +
                  (score > 0.1
                    ? "text-tl-embed-green"
                    : score < -0.1
                    ? "text-foreground-status-error"
                    : "text-foreground-subtle")
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
