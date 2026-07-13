import type { TimelinePoint } from "../../types/api";

// Decade thematic clusters (PRD Scenario B differentiator #1, the core view):
// group the timeline into decades and surface each era's dominant framing,
// tone, and span.

type Props = {
  timeline: TimelinePoint[];
};

type Cluster = {
  decade: number; // e.g. 1980
  points: TimelinePoint[];
  themes: string[];
  scenes: number;
  avgScore: number;
  hasSentiment: boolean;
};

function buildClusters(timeline: TimelinePoint[]): Cluster[] {
  const byDecade = new Map<number, TimelinePoint[]>();
  for (const p of timeline) {
    const d = Math.floor(p.year / 10) * 10;
    (byDecade.get(d) ?? byDecade.set(d, []).get(d)!).push(p);
  }
  return [...byDecade.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([decade, points]) => {
      const themes = [...new Set(points.map((p) => p.dominant_theme).filter(Boolean))];
      const scenes = points.reduce((n, p) => n + (p.scenes?.length ?? p.frequency ?? 0), 0);
      const scored = points.filter((p) => p.sentiment);
      const avgScore =
        scored.length > 0
          ? scored.reduce((s, p) => s + (p.sentiment?.score ?? 0), 0) / scored.length
          : 0;
      return {
        decade,
        points,
        themes,
        scenes,
        avgScore,
        hasSentiment: scored.length > 0,
      };
    });
}

function toneColor(score: number): string {
  const s = Math.max(-1, Math.min(1, score));
  const hue = s >= 0 ? 145 : 0;
  const mag = Math.abs(s);
  return `hsl(${hue} ${18 + mag * 52}% ${34 - mag * 8}%)`;
}

function toneWord(score: number): string {
  if (score > 0.15) return "favorable";
  if (score < -0.15) return "hostile";
  return "neutral";
}

export function EraClusters({ timeline }: Props) {
  const clusters = buildClusters(timeline);
  if (clusters.length === 0) return null;

  return (
    <div className="bg-surface-white border border-border-secondary rounded-tlds-3 p-4">
      <h3 className="text-sm font-medium text-foreground-muted mb-3">Narrative by era</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {clusters.map((c) => {
          const years = c.points.map((p) => p.year);
          const span =
            Math.min(...years) === Math.max(...years)
              ? `${Math.min(...years)}`
              : `${Math.min(...years)}–${Math.max(...years)}`;
          return (
            <div
              key={c.decade}
              className="flex flex-col rounded-tlds-3 border border-border-secondary bg-[color-mix(in_srgb,var(--tl-surface-body)_40%,transparent)] p-3"
            >
              <div className="flex items-baseline justify-between">
                <span className="text-base font-semibold text-foreground-body">{c.decade}s</span>
                <span className="text-[10px] font-tl-mono text-foreground-subtle">{span}</span>
              </div>

              {c.hasSentiment && (
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className="h-2 w-2 flex-none rounded-xs"
                    style={{ background: toneColor(c.avgScore) }}
                  />
                  <span className="text-[11px] text-foreground-subtle">
                    {toneWord(c.avgScore)}{" "}
                    <span className="font-tl-mono text-foreground-subtle">
                      ({c.avgScore >= 0 ? "+" : ""}
                      {c.avgScore.toFixed(2)})
                    </span>
                  </span>
                </div>
              )}

              <ul className="mt-2 space-y-1">
                {c.themes.slice(0, 3).map((t, i) => (
                  <li key={i} className="text-xs leading-snug text-foreground-muted">
                    <span className="text-tl-embed-green">·</span> {t}
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-2 text-[10px] text-foreground-subtle">
                {c.points.length} yr{c.points.length === 1 ? "" : "s"} · {c.scenes} clip
                {c.scenes === 1 ? "" : "s"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
