import { useEffect, useState } from "react";
import { Spinner } from "@twelvelabs-io/react";

// Live queries hit Jockey synchronously and can take 2–3 minutes on a fresh
// question. A static spinner reads as "frozen", so show an elapsed timer and
// a stage hint that advances over time to make clear it's still working.
const STAGES = [
  { at: 0, label: "Searching the video index…" },
  { at: 20, label: "Matching scenes across the archive…" },
  { at: 60, label: "Scoring per-clip evidence…" },
  { at: 110, label: "Writing themes + narrative…" },
  { at: 160, label: "Almost there — finalizing results…" },
];

export function LoadingState() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  const stage = [...STAGES].reverse().find((s) => elapsed >= s.at) ?? STAGES[0];

  return (
    <div className="bg-surface-white border border-border-secondary rounded-tlds-3 p-12 flex flex-col items-center justify-center gap-3">
      <Spinner className="size-7 text-tl-embed-green" />

      <div className="flex items-center gap-2">
        <p className="text-sm text-foreground-muted font-medium">Analyzing the archive…</p>
        <span className="text-xs font-tl-mono text-tl-embed-green tabular-nums">{mm}:{ss}</span>
      </div>

      <p className="text-xs text-foreground-subtle">{stage.label}</p>

      <p className="text-xs text-foreground-subtle max-w-md text-center leading-relaxed">
        First run on a new query searches the footage live and can take
        <span className="text-foreground-muted"> 2–3 minutes</span> — keep this tab
        open. Once cached, the same query (and its CSV) returns instantly.
      </p>
    </div>
  );
}
