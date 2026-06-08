import { useState } from "react";

type Props = {
  onSubmit: (query: string, scenario?: string) => void;
  loading: boolean;
};

const SEED_QUERIES = [
  {
    label: "A. Brand visibility",
    query: "How has Adidas brand exposure changed from 1990 to 2025?",
    scenario: "A",
  },
  {
    label: "B. Storytelling evolution",
    query:
      "How has Adidas's storytelling evolved from sports event sponsorship to owned brand films and lifestyle/sustainability campaigns?",
    scenario: "B",
  },
  {
    label: "C. Earned vs owned",
    query:
      "Compare Adidas presence in third-party event coverage (World Cup, Olympics, Euros) vs in its own brand films (NMD, YEEZY, Samba, You Got This).",
    scenario: "C",
  },
];

export function SearchBar({ onSubmit, loading }: Props) {
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
                     focus:outline-none focus:border-brand-500 transition-colors"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2 bg-brand-500 hover:bg-brand-900 text-white rounded-lg
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Analyzing…" : "Analyze"}
        </button>
      </form>

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
                       border border-neutral-700 rounded-full text-neutral-300
                       disabled:opacity-50 transition-colors"
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
