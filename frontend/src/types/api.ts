export type Scene = {
  asset_id: string;
  timestamp_start: number;
  timestamp_end: number;
  title: string;
  thumbnail_url?: string | null;
  manifest_url?: string | null;
  duration?: number | null;
  score?: number | null;
  // One-line explanation from Jockey of why this scene was selected.
  reason?: string | null;
};

// Prevailing tone of a year's coverage — only the Narrative Evolution
// scenario ("N") populates this.
export type Sentiment = {
  label: string; // "positive" | "neutral" | "negative"
  score: number; // -1 (hostile) .. 1 (favorable)
};

export type TimelinePoint = {
  year: number;
  // Optional month (1–12) for sub-year granularity — the Retroactive
  // Discovery / COVID-19 tab ("V") uses month-level points. Absent for the
  // year-based tabs, which keeps their rendering unchanged.
  month?: number | null;
  // Optional human label for the point (e.g. "Jan 2020"). Falls back to the
  // year when absent. See lib/period.ts.
  period_label?: string | null;
  // COVID tab: true for points that predate the "COVID-19" naming, so the
  // chart can highlight the "before it had a name" window.
  pre_terminology?: boolean | null;
  frequency: number;
  dominant_theme: string;
  representative_clip: Scene;
  // All matching scenes for this year, sorted by relevance descending.
  // `representative_clip` === `scenes[0]`. Optional for backwards-compat
  // with older primed JSON payloads.
  scenes?: Scene[];
  // Narrative Evolution + COVID tabs.
  sentiment?: Sentiment | null;
};

// A pivotal moment where the narrative shifted (Narrative Evolution + COVID).
export type InflectionPoint = {
  year: number;
  // Optional month for month-level inflections (COVID tab).
  month?: number | null;
  period_label?: string | null;
  label: string;
  why: string;
};

export type SummaryBullet = {
  year: number;
  // Optional month so bullets can bind to month-level points (COVID tab).
  month?: number | null;
  period_label?: string | null;
  headline: string;
  text: string;
};

export type QueryResponse = {
  entity: string;
  query: string;
  timeline: TimelinePoint[];
  narrative_summary: string;
  summary_bullets?: SummaryBullet[];
  estimated_value: {
    total_mentions: number;
    estimated_brand_intelligence_value_usd: number;
    calculation_basis: string;
  };
  session_id: string;
  source: "jockey" | "mock" | "cache" | string;
  // Narrative Evolution only.
  inflection_points?: InflectionPoint[];
};

export type FollowupResponse = {
  session_id: string;
  answer: string;
  matched_key: string | null;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};
