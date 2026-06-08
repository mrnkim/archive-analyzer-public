import { create } from "zustand";
import type { ChatMessage, QueryResponse, TimelinePoint } from "./types/api";

type AppState = {
  query: string;
  setQuery: (q: string) => void;

  result: QueryResponse | null;
  setResult: (r: QueryResponse | null) => void;

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
