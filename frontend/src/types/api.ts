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
  frequency: number;
  dominant_theme: string;
  representative_clip: Scene;
  // All matching scenes for this year, sorted by relevance descending.
  // `representative_clip` === `scenes[0]`. Optional for backwards-compat
  // with older primed JSON payloads.
  scenes?: Scene[];
  // Narrative Evolution only.
  sentiment?: Sentiment | null;
};

// A pivotal year where the narrative shifted (Narrative Evolution only).
export type InflectionPoint = {
  year: number;
  label: string;
  why: string;
};

export type SummaryBullet = {
  year: number;
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
