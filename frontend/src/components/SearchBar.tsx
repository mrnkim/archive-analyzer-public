import { useState } from "react";
import { Icon } from "./Icon";

type Props = {
  onSubmit: (query: string, scenario?: string) => void;
  loading: boolean;
  // Quick-access demo chips — hidden on the empty state (the scenario
  // cards cover that), shown once a result is on screen for fast re-runs.
  showDemoChips?: boolean;
};

export const SEED_QUERIES = [
  {
    label: "A. Brand visibility",
    title: "Brand visibility",
    blurb: "Track how Adidas exposure shows up year-by-year across 30 years of footage.",
    query: "How has Adidas brand exposure changed from 1990 to 2025?",
    scenario: "A",
  },
  {
    label: "B. Storytelling evolution",
    title: "Storytelling evolution",
    blurb: "From event sponsorship to owned brand films, lifestyle and sustainability.",
    query:
      "How has Adidas's storytelling evolved from sports event sponsorship to owned brand films and lifestyle/sustainability campaigns?",
    scenario: "B",
  },
  {
    label: "C. Earned vs owned",
    title: "Earned vs owned",
    blurb: "Compare third-party event coverage against Adidas's own brand films.",
    query:
      "Compare Adidas presence in third-party event coverage (World Cup, Olympics, Euros) vs in its own brand films (NMD, YEEZY, Samba, You Got This).",
    scenario: "C",
  },
];

export function SearchBar({ onSubmit, loading, showDemoChips = true }: Props) {
  const [input, setInput] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (input.trim()) onSubmit(input.trim());
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything — e.g. 'Adidas exposure over 30 years'"
          className="flex-1 px-4 py-2 bg-neutral-900 border border-neutral-700 rounded-lg
                     focus:outline-none focus:border-neutral-50 focus:ring-2 focus:ring-neutral-50/10 transition-colors"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-50 hover:bg-neutral-200 text-neutral-900 font-medium rounded-lg
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <Icon name="spinner" className="w-4 h-4 animate-spin" />
          ) : (
            <Icon name="search" className="w-4 h-4" />
          )}
          {loading ? "Analyzing…" : "Analyze"}
        </button>
      </form>

      {showDemoChips && (
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-neutral-500 self-center">Demo prompts:</span>
        {SEED_QUERIES.map((s) => (
          <button
            key={s.scenario}
            onClick={() => {
              setInput(s.query);
              onSubmit(s.query, s.scenario);
            }}
            disabled={loading}
            className="text-xs px-3 py-1 bg-neutral-900 hover:bg-neutral-800
                       border border-neutral-700 rounded-full text-neutral-300 hover:text-neutral-50
                       disabled:opacity-50 transition-colors"
          >
            {s.label}
          </button>
        ))}
      </div>
      )}
    </div>
  );
}
