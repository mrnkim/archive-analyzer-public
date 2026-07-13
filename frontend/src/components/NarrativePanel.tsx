import { useEffect, useRef, useState } from "react";
import { useEventSource } from "../hooks/useEventSource";
import type { SummaryBullet, TimelinePoint } from "../types/api";
import { Markdown } from "./Markdown";

type Props = {
  query: string | null;
  /**
   * Already-resolved narrative from /api/query. When provided we replay it
   * locally as a fake stream — same UX as SSE, perfectly consistent with the
   * chart/clips, and zero extra Pegasus cost. Falls back to true SSE when
   * absent (mock mode or before the query response lands).
   */
  narrative?: string | null;
  bullets?: SummaryBullet[];
  timeline?: TimelinePoint[];
  selectedYear?: number | null;
  onSelectYear?: (year: number) => void;
  /**
   * When true, flow the prose into magazine-style columns on wide screens.
   * Used when the panel sits as a full-width block instead of a narrow
   * side column, so line length stays readable instead of spanning the page.
   */
  columns?: boolean;
};

const CHUNK_SIZE = 4;
const TICK_MS = 35;

function useFakeStream(text: string | null): { text: string; done: boolean } {
  const [shown, setShown] = useState("");
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (!text) {
      setShown("");
      setDone(false);
      return;
    }
    setShown("");
    setDone(false);
    let i = 0;
    timerRef.current = setInterval(() => {
      i = Math.min(i + CHUNK_SIZE, text.length);
      setShown(text.slice(0, i));
      if (i >= text.length) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        setDone(true);
      }
    }, TICK_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [text]);

  return { text: shown, done };
}

function fallbackBullets(
  narrative: string | null | undefined,
  timeline: TimelinePoint[] | undefined
): SummaryBullet[] {
  if (!timeline?.length) return [];
  const knownYears = new Set(timeline.map((p) => p.year));
  const sentences = (narrative ?? "")
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const out: SummaryBullet[] = [];
  for (const sentence of sentences) {
    const year = Number(sentence.match(/\b(19\d{2}|20\d{2})\b/)?.[1]);
    if (!knownYears.has(year)) continue;
    const point = timeline.find((p) => p.year === year);
    out.push({
      year,
      headline: point?.dominant_theme || `${year} shift`,
      text: sentence,
    });
    if (out.length >= 6) break;
  }

  const byYear = new Map(out.map((bullet) => [bullet.year, bullet]));
  return timeline.map((point) => {
    const existing = byYear.get(point.year);
    if (existing) return existing;
    return {
      year: point.year,
      headline: point.dominant_theme,
      text:
        point.representative_clip.reason ||
        `${point.frequency} scene${point.frequency === 1 ? "" : "s"} support this point.`,
    };
  });
}

export function NarrativePanel({
  query,
  narrative,
  bullets,
  timeline,
  selectedYear,
  onSelectYear,
  columns,
}: Props) {
  const fallback = fallbackBullets(narrative, timeline);
  const providedByYear = new Map((bullets ?? []).map((bullet) => [bullet.year, bullet]));
  const linkedBullets = timeline?.length
    ? timeline.map((point) => providedByYear.get(point.year) ?? fallback.find((b) => b.year === point.year))
        .filter((bullet): bullet is SummaryBullet => Boolean(bullet))
    : bullets ?? fallback;
  const hasLinkedBullets = linkedBullets.length > 0;
  const useFake = !!narrative;
  const fake = useFakeStream(useFake ? narrative ?? null : null);
  const sse = useEventSource(useFake ? null : query);

  const text = useFake ? fake.text : sse.text;
  const done = hasLinkedBullets || (useFake ? fake.done : sse.done);
  const error = useFake ? null : sse.error;
  const active = !!query || !!narrative || hasLinkedBullets;

  return (
    <div
      className={
        "bg-surface-white border border-border-secondary rounded-tlds-3 p-4 flex min-h-0 flex-col " +
        (columns ? "" : "h-full")
      }
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-foreground-muted">AI narrative summary</h3>
        {active && !done && !error && (
          <span className="text-xs text-tl-embed-green flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-tl-embed-green rounded-full animate-pulse" />
            Streaming
          </span>
        )}
        {done && !error && <span className="text-xs text-foreground-subtle">Done</span>}
      </div>

      {!active && (
        <div className="flex-1 flex items-center justify-center text-sm text-foreground-subtle">
          Run a search and the AI will write the story of the trend here.
        </div>
      )}

      {error && <div className="text-sm text-foreground-status-error">Error: {error}</div>}

      {active && hasLinkedBullets && (
        <div
          className={
            "flex-1 min-h-0 overflow-y-auto pr-1 " +
            (columns ? "grid content-start gap-2 lg:grid-cols-2" : "space-y-2")
          }
        >
          {linkedBullets.map((bullet, i) => {
            const selected = bullet.year === selectedYear;
            return (
              <button
                key={`${bullet.year}-${bullet.headline}-${i}`}
                type="button"
                onClick={() => onSelectYear?.(bullet.year)}
                className={
                  "w-full text-left rounded-nav-item border px-3 py-2.5 transition-colors " +
                  (selected
                    ? "selected-panel-attention border-2 border-border-primary bg-surface-secondary text-foreground-body"
                    : "border-border-secondary bg-[color-mix(in_srgb,var(--tl-surface-body)_35%,transparent)] text-foreground-muted hover:border-border-secondary hover:bg-[color-mix(in_srgb,var(--tl-surface-body)_60%,transparent)]")
                }
              >
                <div className="flex items-start gap-2">
                  <span
                    className={
                      "mt-0.5 rounded px-1.5 py-0.5 font-tl-mono text-[10px] tabular-nums " +
                      (selected
                        ? "bg-surface-primary text-foreground-overlay"
                        : "bg-surface-secondary text-foreground-subtle")
                    }
                  >
                    {bullet.year}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium leading-snug">
                      {bullet.headline}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-foreground-subtle">
                      {bullet.text}
                    </span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {active && !hasLinkedBullets && (
        <div
          className={
            "flex-1 overflow-y-auto text-sm " +
            (columns
              ? "lg:[column-count:2] lg:[column-gap:2rem] [&>*:first-child]:mt-0"
              : "")
          }
        >
          <Markdown>{text}</Markdown>
          {!done && !error && (
            <span className="inline-block w-2 h-4 bg-tl-embed-green ml-0.5 animate-pulse align-middle" />
          )}
        </div>
      )}
    </div>
  );
}
