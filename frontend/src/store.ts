import { create } from "zustand";
import type { ChatMessage, QueryResponse, TimelinePoint } from "./types/api";

type AppState = {
  query: string;
  setQuery: (q: string) => void;

  result: QueryResponse | null;
  setResult: (r: QueryResponse | null) => void;

  // Scenario that produced the on-screen result, so followups + CSV export
  // hit the same Knowledge Store / cache key (e.g. "N" → Trump archive).
  resultScenario: string | undefined;
  setResultScenario: (s: string | undefined) => void;

  selectedPoint: TimelinePoint | null;
  setSelectedPoint: (p: TimelinePoint | null) => void;

  chat: ChatMessage[];
  appendChat: (m: ChatMessage) => void;
  resetChat: () => void;

  streamingQuery: string | null;
  setStreamingQuery: (q: string | null) => void;

  loading: boolean;
  setLoading: (v: boolean) => void;
};

export const useStore = create<AppState>((set) => ({
  query: "",
  setQuery: (q) => set({ query: q }),

  result: null,
  setResult: (r) => set({ result: r }),

  resultScenario: undefined,
  setResultScenario: (s) => set({ resultScenario: s }),

  selectedPoint: null,
  setSelectedPoint: (p) => set({ selectedPoint: p }),

  chat: [],
  appendChat: (m) => set((s) => ({ chat: [...s.chat, m] })),
  resetChat: () => set({ chat: [] }),

  streamingQuery: null,
  setStreamingQuery: (q) => set({ streamingQuery: q }),

  loading: false,
  setLoading: (v) => set({ loading: v }),
}));
