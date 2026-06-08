import { useEffect, useRef, useState } from "react";

type StreamState = {
  text: string;
  done: boolean;
  error: string | null;
};

/**
 * SSE 클라이언트 훅. query가 truthy로 바뀔 때마다 새 연결을 연다.
 * 응답은 'token' 이벤트의 {delta} JSON을 누적, 'done' 이벤트에서 종료.
 */
export function useEventSource(query: string | null): StreamState {
  const [state, setState] = useState<StreamState>({
    text: "",
    done: false,
    error: null,
  });
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!query) return;

    setState({ text: "", done: false, error: null });
    const url = `/api/stream?query=${encodeURIComponent(query)}`;
    const es = new EventSource(url);
    sourceRef.current = es;

    es.addEventListener("token", (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        setState((s) => ({ ...s, text: s.text + (data.delta ?? "") }));
      } catch {
        // ignore malformed events
      }
    });

    es.addEventListener("done", () => {
      setState((s) => ({ ...s, done: true }));
      es.close();
    });

    es.onerror = () => {
      setState((s) => ({ ...s, error: "Stream connection error", done: true }));
      es.close();
    };

    return () => {
      es.close();
      sourceRef.current = null;
    };
  }, [query]);

  return state;
}
