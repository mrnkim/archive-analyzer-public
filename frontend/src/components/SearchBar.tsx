import { useState } from "react";
import { Button, SearchIcon, TextField } from "@twelvelabs-io/react";

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
        <TextField
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything — e.g. 'Adidas exposure over 30 years'"
          disabled={loading}
          className="flex-1"
        />
        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={loading}
          disabled={loading || !input.trim()}
          leftIcon={loading ? undefined : <SearchIcon className="size-4" />}
        >
          {loading ? "Analyzing…" : "Analyze"}
        </Button>
      </form>

      {showDemoChips && (
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-foreground-subtle self-center">Demo prompts:</span>
        {SEED_QUERIES.map((s) => (
          <button
            key={s.scenario}
            onClick={() => {
              setInput(s.query);
              onSubmit(s.query, s.scenario);
            }}
            disabled={loading}
            className="text-xs px-3 py-1 bg-surface-white hover:bg-surface-secondary
                       border border-border-secondary rounded-full text-foreground-muted hover:text-foreground-body
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
