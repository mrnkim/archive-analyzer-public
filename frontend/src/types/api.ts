export type Scene = {
  asset_id: string;
  timestamp_start: number;
  timestamp_end: number;
  title: string;
  thumbnail_url?: string | null;
  manifest_url?: string | null;
  duration?: number | null;
  score?: number | null;
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
};

export type QueryResponse = {
  entity: string;
  query: string;
  timeline: TimelinePoint[];
  narrative_summary: string;
  estimated_value: {
    total_mentions: number;
    estimated_brand_intelligence_value_usd: number;
    calculation_basis: string;
  };
  session_id: string;
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
