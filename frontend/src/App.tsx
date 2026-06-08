import { useEffect, useState } from "react";
import { postQuery } from "./api/client";
import { ChatPanel } from "./components/ChatPanel";
import { ClipGrid } from "./components/ClipGrid";
import { ClipStrip } from "./components/ClipStrip";
import { NarrativePanel } from "./components/NarrativePanel";
import { RevenueWidget } from "./components/RevenueWidget";
import { SearchBar } from "./components/SearchBar";
import { TimelineChart } from "./components/TimelineChart";
import { TutorialPanel } from "./components/TutorialPanel";
import { useStore } from "./store";

type Tab = "analyzer" | "tutorial";

type HealthResponse = {
  status: string;
  env: string;
  ks_configured: string;
  api_key_configured: string;
};

export default function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [tab, setTab] = useState<Tab>("analyzer");
  const result = useStore((s) => s.result);
  const setResult = useStore((s) => s.setResult);
  const setSelectedPoint = useStore((s) => s.setSelectedPoint);
  const selectedPoint = useStore((s) => s.selectedPoint);
  const resetChat = useStore((s) => s.resetChat);
  const streamingQuery = useStore((s) => s.streamingQuery);
  const setStreamingQuery = useStore((s) => s.setStreamingQuery);
  const loading = useStore((s) => s.loading);
  const setLoading = useStore((s) => s.setLoading);

  useEffect(() => {
    fetch("/api/health").then((r) => r.json()).then(setHealth).catch(() => {});
  }, []);

  async function handleSearch(query: string, scenario?: string) {
    setLoading(true);
    setSelectedPoint(null);
    resetChat();
    setStreamingQuery(null);

    try {
      const r = await postQuery(query, scenario);
      setResult(r);
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
      <header className="px-6 py-4 border-b border-neutral-800">
        <div className="flex items-baseline justify-between">
          <div>
            <h1 className="text-xl font-semibold">
              Archive Trend & Narrative Analyzer
            </h1>
            <p className="text-xs text-neutral-400 mt-0.5">
              Powered by TwelveLabs Jockey · Sample app
            </p>
          </div>
          {health && (
            <div className="text-xs text-neutral-500">
              env: <span className="text-neutral-300">{health.env}</span>
              {" · "}
              KS: <span className={health.ks_configured === "yes" ? "text-brand-500" : "text-amber-500"}>
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
              ["analyzer", "Analyzer"],
              ["tutorial", "Tutorial"],
            ] as [Tab, string][]).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
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
        ) : (
        <main className="flex-1 px-6 py-6 max-w-7xl mx-auto w-full space-y-6">
        <SearchBar onSubmit={handleSearch} loading={loading} />

        {result && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-4">
                <TimelineChart
                  data={result.timeline}
                  onPointClick={setSelectedPoint}
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
              onSelect={setSelectedPoint}
              exportQuery={result.query}
            />

            <ClipGrid point={selectedPoint} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="lg:col-span-1">
                <ChatPanel />
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 text-xs text-neutral-400">
                <h3 className="text-sm font-medium text-neutral-300 mb-2">Debug info</h3>
                <div>session_id: <code>{result.session_id}</code></div>
                <div>entity: <code>{result.entity}</code></div>
                <div>timeline points: {result.timeline.length}</div>
                <div className="mt-2 text-neutral-600">
                  Phase 1 mock mode. Responses are wired to real Jockey calls in Phase 2.
                </div>
              </div>
            </div>
          </>
        )}

        {!result && !loading && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-12 text-center">
            <p className="text-neutral-400 text-sm">
              Type a question above, or pick one of the demo scenarios.
            </p>
          </div>
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
