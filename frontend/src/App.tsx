import { useEffect, useRef, useState } from "react";
import { postQuery } from "./api/client";
import type { TimelinePoint } from "./types/api";
import { ChatPanel } from "./components/ChatPanel";
import { ClipGrid } from "./components/ClipGrid";
import { ClipStrip } from "./components/ClipStrip";
import { EmptyState } from "./components/EmptyState";
import { LoadingState } from "./components/LoadingState";
import { NarrativePanel } from "./components/NarrativePanel";
import { RevenueWidget } from "./components/RevenueWidget";
import { SearchBar } from "./components/SearchBar";
import { TimelineChart } from "./components/TimelineChart";
import { TutorialPanel } from "./components/TutorialPanel";
import { TwelveLabsLogo } from "./components/TwelveLabsLogo";
import { EraClusters } from "./components/narrative/EraClusters";
import { SentimentStrip } from "./components/narrative/SentimentStrip";
import { InflectionPoints } from "./components/narrative/InflectionPoints";
import { NarrativeEmptyState } from "./components/narrative/NarrativeEmptyState";
import { useStore } from "./store";

type Tab = "analyzer" | "narrative" | "tutorial";

type HealthResponse = {
  status: string;
  env: string;
  ks_configured: string;
  api_key_configured: string;
};

// Debug panel is opt-in via `?debug=1` so end users never see it.
// Devs can keep it on by hitting `http://localhost:5173/?debug=1`.
const showDebug =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).get("debug") === "1";

export default function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [tab, setTab] = useState<Tab>("analyzer");
  // Scenario used for the on-screen result, so CSV export + followups hit the
  // same Knowledge Store / cache key instead of missing and triggering a slow
  // live re-run. Lives in the store so ChatPanel can read it too.
  const resultScenario = useStore((s) => s.resultScenario);
  const setResultScenario = useStore((s) => s.setResultScenario);
  const result = useStore((s) => s.result);
  const setResult = useStore((s) => s.setResult);
  const setSelectedPoint = useStore((s) => s.setSelectedPoint);
  const selectedPoint = useStore((s) => s.selectedPoint);
  const resetChat = useStore((s) => s.resetChat);
  const streamingQuery = useStore((s) => s.streamingQuery);
  const setStreamingQuery = useStore((s) => s.setStreamingQuery);
  const loading = useStore((s) => s.loading);
  const setLoading = useStore((s) => s.setLoading);
  const clipGridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/health").then((r) => r.json()).then(setHealth).catch(() => {});
  }, []);

  // Wrapping setSelectedPoint so user-initiated picks (timeline click,
  // clip-strip click) also scroll the player into view. The initial
  // auto-select-peak call after a query intentionally uses the bare
  // setter so the page doesn't jump past the chart on first load.
  function handleSelectPoint(point: TimelinePoint) {
    setSelectedPoint(point);
    requestAnimationFrame(() => {
      clipGridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  // Switching tabs clears the on-screen result so the two analysis modes
  // (Adidas brand vs Trump narrative) never bleed into each other.
  function switchTab(id: Tab) {
    if (id !== tab) {
      setResult(null);
      setSelectedPoint(null);
      resetChat();
      setStreamingQuery(null);
      setResultScenario(undefined);
    }
    setTab(id);
  }

  // Jump to a given year's evidence (used by inflection-point clicks).
  function selectYear(year: number) {
    const point = result?.timeline.find((p) => p.year === year);
    if (point) handleSelectPoint(point);
  }

  async function handleSearch(query: string, scenario?: string) {
    setLoading(true);
    // Clear the previous result so the page visibly empties out while the
    // new query runs — otherwise the user sees the old chart sitting under
    // "Analyzing…" and thinks the data is current.
    setResult(null);
    setSelectedPoint(null);
    resetChat();
    setStreamingQuery(null);

    try {
      const r = await postQuery(query, scenario);
      setResult(r);
      setResultScenario(scenario);
      // Auto-select the peak point.
      const peak = r.timeline.reduce(
        (max, p) => (p.frequency > max.frequency ? p : max),
        r.timeline[0]
      );
      setSelectedPoint(peak);
      // Kick off the narrative stream.
      setStreamingQuery(query);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-4 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/60 sticky top-0 z-20">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <TwelveLabsLogo className="h-[18px] w-auto flex-none text-neutral-50" />
            <span className="h-5 w-px flex-none bg-neutral-700" aria-hidden />
            <div className="min-w-0">
              <h1 className="text-sm font-medium text-neutral-100 truncate">
                Archive Trend &amp; Narrative Analyzer
              </h1>
              <p className="text-xs text-neutral-500 mt-0.5">
                Powered by Jockey · Sample app
              </p>
            </div>
          </div>
          {health && (
            <div className="text-xs text-neutral-500 flex-none">
              env: <span className="text-neutral-300 font-mono">{health.env}</span>
              {" · "}
              KS:{" "}
              <span
                className={
                  "inline-flex items-center gap-1.5 " +
                  (health.ks_configured === "yes" ? "text-brand-500" : "text-warning")
                }
              >
                <span
                  className={
                    "h-1.5 w-1.5 rounded-full " +
                    (health.ks_configured === "yes" ? "bg-brand-500" : "bg-warning")
                  }
                />
                {health.ks_configured === "yes" ? "connected" : "mock mode"}
              </span>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 flex">
        <aside className="w-48 flex-none border-r border-neutral-800 px-3 py-6">
          <nav className="space-y-1 sticky top-6">
            {([
              ["analyzer", "Brand Intelligence (Adidas Example)"],
              ["narrative", "Narrative Evolution (Trump Example)"],
              ["tutorial", "Tutorial"],
            ] as [Tab, string][]).map(([id, label]) => (
              <button
                key={id}
                onClick={() => switchTab(id)}
                className={
                  "w-full text-left px-3 py-2 text-sm rounded-md border-l-2 transition-colors " +
                  (tab === id
                    ? "border-brand-500 bg-brand-500/10 text-neutral-100 font-medium"
                    : "border-transparent text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900")
                }
              >
                {label}
              </button>
            ))}
          </nav>
        </aside>

        {tab === "tutorial" ? (
          <main className="flex-1 px-6 py-6 max-w-7xl mx-auto w-full">
            <TutorialPanel />
          </main>
        ) : tab === "narrative" ? (
        <main className="flex-1 px-6 py-6 max-w-7xl mx-auto w-full space-y-6">
          <SearchBar
            onSubmit={(q, sc) => handleSearch(q, sc ?? "N")}
            loading={loading}
            showDemoChips={false}
          />

          {result && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                <div className="lg:col-span-2 space-y-4">
                  <TimelineChart data={result.timeline} onPointClick={handleSelectPoint} />
                  <SentimentStrip
                    timeline={result.timeline}
                    selectedYear={selectedPoint?.year ?? null}
                    onSelect={handleSelectPoint}
                  />
                </div>
                <InflectionPoints
                  points={result.inflection_points ?? []}
                  onSelectYear={selectYear}
                />
              </div>

              <EraClusters timeline={result.timeline} />

              <NarrativePanel
                query={streamingQuery}
                narrative={result?.narrative_summary}
                columns
              />

              <ClipStrip
                timeline={result.timeline}
                selectedYear={selectedPoint?.year ?? null}
                onSelect={handleSelectPoint}
                exportQuery={result.query}
                exportScenario={resultScenario}
              />

              <div ref={clipGridRef} className="scroll-mt-4">
                <ClipGrid point={selectedPoint} />
              </div>

              <ChatPanel />
            </>
          )}

          {loading && <LoadingState />}

          {!result && !loading && <NarrativeEmptyState onRun={handleSearch} />}
        </main>
        ) : (
        <main className="flex-1 px-6 py-6 max-w-7xl mx-auto w-full space-y-6">
        <SearchBar onSubmit={handleSearch} loading={loading} showDemoChips={!!result} />

        {result && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-4">
                <TimelineChart
                  data={result.timeline}
                  onPointClick={handleSelectPoint}
                />
              </div>
              <div className="space-y-4 flex flex-col">
                <RevenueWidget
                  totalMentions={result.estimated_value.total_mentions}
                  estimatedValueUsd={result.estimated_value.estimated_brand_intelligence_value_usd}
                  basis={result.estimated_value.calculation_basis}
                />
                <div className="flex-1 min-h-[260px]">
                  <NarrativePanel
                    query={streamingQuery}
                    narrative={result?.narrative_summary}
                  />
                </div>
              </div>
            </div>

            <ClipStrip
              timeline={result.timeline}
              selectedYear={selectedPoint?.year ?? null}
              onSelect={handleSelectPoint}
              exportQuery={result.query}
              exportScenario={resultScenario}
            />

            <div ref={clipGridRef} className="scroll-mt-4">
              <ClipGrid point={selectedPoint} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className={showDebug ? "lg:col-span-1" : "lg:col-span-2"}>
                <ChatPanel />
              </div>
              {showDebug && (
                <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 text-xs text-neutral-400">
                  <h3 className="text-sm font-medium text-neutral-300 mb-2">Debug info</h3>
                  <div>session_id: <code>{result.session_id}</code></div>
                  <div>entity: <code>{result.entity}</code></div>
                  <div>timeline points: {result.timeline.length}</div>
                  <div className="mt-2 text-neutral-600">
                    Mock mode — set TWELVELABS_API_KEY + KS_ID to hit the real API.
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {loading && <LoadingState />}

        {!result && !loading && (
          <EmptyState onSelect={handleSearch} onOpenTutorial={() => setTab("tutorial")} />
        )}
      </main>
        )}
      </div>

      <footer className="px-6 py-3 border-t border-neutral-800 text-xs text-neutral-500 text-center">
        Demo only · Video sources: each official YouTube channel · Powered by{" "}
        <a href="https://twelvelabs.io" className="text-brand-500 hover:underline">
          TwelveLabs
        </a>
      </footer>
    </div>
  );
}
