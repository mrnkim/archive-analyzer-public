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
import { RetroactiveDiscovery } from "./components/covid/RetroactiveDiscovery";
import { NarrativeEmptyState } from "./components/narrative/NarrativeEmptyState";
import { CovidEmptyState } from "./components/narrative/CovidEmptyState";
import { pointKey } from "./lib/period";
import { useStore } from "./store";

type Tab = "analyzer" | "narrative" | "covid" | "tutorial";

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

  // Jump to a point's evidence by its period key (used by inflection-point and
  // summary-bullet clicks). The key is `pointKey` — the plain year for the
  // year-based tabs, or year*100+month for the month-based COVID tab.
  function selectByKey(key: number) {
    const point = result?.timeline.find((p) => pointKey(p) === key);
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
      <header className="px-6 py-4 border-b border-border-secondary bg-[color-mix(in_srgb,var(--tl-surface-body)_80%,transparent)] backdrop-blur-sm supports-backdrop-filter:bg-[color-mix(in_srgb,var(--tl-surface-body)_60%,transparent)] sticky top-0 z-20">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <TwelveLabsLogo className="h-[18px] w-auto flex-none text-foreground-body" />
            <span className="h-5 w-px flex-none bg-surface-secondary-hover" aria-hidden />
            <div className="min-w-0">
              <h1 className="text-sm font-medium text-foreground-body truncate">
                Archive Trend &amp; Narrative Analyzer
              </h1>
              <p className="text-xs text-foreground-subtle mt-0.5">
                Powered by Jockey · Sample app
              </p>
            </div>
          </div>
          {health && (
            <div className="text-xs text-foreground-subtle flex-none">
              env: <span className="text-foreground-muted font-tl-mono">{health.env}</span>
              {" · "}
              KS:{" "}
              <span
                className={
                  "inline-flex items-center gap-1.5 " +
                  (health.ks_configured === "yes" ? "text-foreground-muted" : "text-foreground-status-warning")
                }
              >
                <span
                  className={
                    "h-1.5 w-1.5 rounded-full " +
                    (health.ks_configured === "yes" ? "bg-tl-gray-600" : "bg-misc-status-warning")
                  }
                />
                {health.ks_configured === "yes" ? "connected" : "mock mode"}
              </span>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 flex">
        <aside className="w-48 flex-none border-r border-border-secondary px-3 py-6">
          <nav className="space-y-1 sticky top-6">
            {([
              ["analyzer", "Brand Intelligence (Adidas Examples)"],
              ["narrative", "Narrative Evolution"],
              ["covid", "Retroactive Discovery (COVID-19)"],
              ["tutorial", "Tutorial"],
            ] as [Tab, string][]).map(([id, label]) => (
              <button
                key={id}
                onClick={() => switchTab(id)}
                className={
                  "w-full text-left px-3 py-2 text-sm rounded-nav-item transition-colors " +
                  (tab === id
                    ? "bg-surface-secondary-hover text-foreground-body font-medium"
                    : "text-foreground-subtle hover:text-foreground-body hover:bg-surface-secondary")
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
              {/* Overview: evidence volume + tone over time, with the pivotal
                  moments called out alongside. */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                <div className="lg:col-span-2 space-y-4">
                  <TimelineChart
                    data={result.timeline}
                    onPointClick={handleSelectPoint}
                  />
                  <SentimentStrip
                    timeline={result.timeline}
                    selectedKey={selectedPoint ? pointKey(selectedPoint) : null}
                    onSelect={handleSelectPoint}
                  />
                </div>
                <InflectionPoints
                  points={result.inflection_points ?? []}
                  onSelectKey={selectByKey}
                />
              </div>

              {/* The story leads: the AI-written narrative sits right under the
                  overview, ahead of the supporting detail and raw clips. */}
              <NarrativePanel
                query={streamingQuery}
                narrative={result?.narrative_summary}
                bullets={result?.summary_bullets}
                timeline={result.timeline}
                selectedKey={selectedPoint ? pointKey(selectedPoint) : null}
                onSelectKey={selectByKey}
                columns
              />

              <EraClusters timeline={result.timeline} />

              {/* Grounded evidence for the selected year. */}
              <div ref={clipGridRef} className="scroll-mt-4">
                <ClipGrid point={selectedPoint} />
              </div>
              <ClipStrip
                timeline={result.timeline}
                selectedKey={selectedPoint ? pointKey(selectedPoint) : null}
                onSelect={handleSelectPoint}
                exportQuery={result.query}
                exportScenario={resultScenario}
              />

              <ChatPanel />
            </>
          )}

          {loading && <LoadingState />}

          {!result && !loading && <NarrativeEmptyState onRun={handleSearch} />}
        </main>
        ) : tab === "covid" ? (
        <main className="flex-1 px-6 py-6 max-w-7xl mx-auto w-full space-y-6">
          <SearchBar
            onSubmit={(q, sc) => handleSearch(q, sc ?? "V")}
            loading={loading}
            showDemoChips={false}
          />

          {result && (
            <>
              {/* Overview: monthly signal volume with the retroactive
                  discovery panel (pre-naming clips surfaced by meaning) and the
                  researcher/documentary value framing alongside. */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                <div className="lg:col-span-2 space-y-4">
                  <TimelineChart
                    data={result.timeline}
                    onPointClick={handleSelectPoint}
                  />
                  {/* Narrative summary sits under the chart to balance the tall
                      retroactive-discovery column on the right. */}
                  <NarrativePanel
                    query={streamingQuery}
                    narrative={result?.narrative_summary}
                    bullets={result?.summary_bullets}
                    timeline={result.timeline}
                    selectedKey={selectedPoint ? pointKey(selectedPoint) : null}
                    onSelectKey={selectByKey}
                  />
                </div>
                <div className="space-y-4">
                  <RetroactiveDiscovery
                    timeline={result.timeline}
                    selectedKey={selectedPoint ? pointKey(selectedPoint) : null}
                    onSelectKey={selectByKey}
                  />
                  <RevenueWidget
                    scenario="V"
                    totalMentions={result.estimated_value.total_mentions}
                    estimatedValueUsd={result.estimated_value.estimated_brand_intelligence_value_usd}
                    basis={result.estimated_value.calculation_basis}
                  />
                </div>
              </div>

              <EraClusters timeline={result.timeline} />

              <div ref={clipGridRef} className="scroll-mt-4">
                <ClipGrid point={selectedPoint} />
              </div>
              <ClipStrip
                timeline={result.timeline}
                selectedKey={selectedPoint ? pointKey(selectedPoint) : null}
                onSelect={handleSelectPoint}
                exportQuery={result.query}
                exportScenario={resultScenario}
              />

              <ChatPanel />
            </>
          )}

          {loading && <LoadingState />}

          {!result && !loading && <CovidEmptyState onRun={handleSearch} />}
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
                <div ref={clipGridRef} className="scroll-mt-4">
                  <ClipGrid point={selectedPoint} />
                </div>
                <ClipStrip
                  timeline={result.timeline}
                  selectedKey={selectedPoint ? pointKey(selectedPoint) : null}
                  onSelect={handleSelectPoint}
                  exportQuery={result.query}
                  exportScenario={resultScenario}
                />
              </div>
              <div className="space-y-4 flex flex-col lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)]">
                <RevenueWidget
                  totalMentions={result.estimated_value.total_mentions}
                  estimatedValueUsd={result.estimated_value.estimated_brand_intelligence_value_usd}
                  basis={result.estimated_value.calculation_basis}
                />
                <div className="flex-1 min-h-[260px] lg:min-h-0">
                  <NarrativePanel
                    query={streamingQuery}
                    narrative={result?.narrative_summary}
                    bullets={result?.summary_bullets}
                    timeline={result.timeline}
                    selectedKey={selectedPoint ? pointKey(selectedPoint) : null}
                    onSelectKey={selectByKey}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className={showDebug ? "lg:col-span-1" : "lg:col-span-2"}>
                <ChatPanel />
              </div>
              {showDebug && (
                <div className="bg-surface-white border border-border-secondary rounded-tlds-3 p-4 text-xs text-foreground-subtle">
                  <h3 className="text-sm font-medium text-foreground-muted mb-2">Debug info</h3>
                  <div>session_id: <code>{result.session_id}</code></div>
                  <div>entity: <code>{result.entity}</code></div>
                  <div>timeline points: {result.timeline.length}</div>
                  <div className="mt-2 text-foreground-subtle">
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

      <footer className="px-6 py-3 border-t border-border-secondary text-xs text-foreground-subtle text-center">
        Demo only · Video sources: each official YouTube channel · Powered by{" "}
        <a href="https://twelvelabs.io" className="text-tl-embed-green hover:underline">
          TwelveLabs
        </a>
      </footer>
    </div>
  );
}
