import { useEffect, useRef, useState } from "react";
import { useEventSource } from "../hooks/useEventSource";
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

export function NarrativePanel({ query, narrative, columns }: Props) {
  const useFake = !!narrative;
  const fake = useFakeStream(useFake ? narrative ?? null : null);
  const sse = useEventSource(useFake ? null : query);

  const text = useFake ? fake.text : sse.text;
  const done = useFake ? fake.done : sse.done;
  const error = useFake ? null : sse.error;
  const active = !!query || !!narrative;

  return (
    <div
      className={
        "bg-neutral-900 border border-neutral-800 rounded-lg p-4 flex flex-col " +
        (columns ? "" : "h-full")
      }
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-neutral-300">AI narrative summary</h3>
        {active && !done && !error && (
          <span className="text-xs text-brand-500 flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
            Streaming
          </span>
        )}
        {done && !error && <span className="text-xs text-neutral-500">Done</span>}
      </div>

      {!active && (
        <div className="flex-1 flex items-center justify-center text-sm text-neutral-500">
          Run a search and the AI will write the story of the trend here.
        </div>
      )}

      {error && <div className="text-sm text-error">Error: {error}</div>}

      {active && (
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
            <span className="inline-block w-2 h-4 bg-brand-500 ml-0.5 animate-pulse align-middle" />
          )}
        </div>
      )}
    </div>
  );
}
