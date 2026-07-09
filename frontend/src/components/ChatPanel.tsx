import { useEffect, useRef, useState } from "react";
import { postFollowup } from "../api/client";
import { useStore } from "../store";
import { Markdown } from "./Markdown";

export function ChatPanel() {
  const chat = useStore((s) => s.chat);
  const appendChat = useStore((s) => s.appendChat);
  const result = useStore((s) => s.result);
  const resultScenario = useStore((s) => s.resultScenario);
  const selectedPoint = useStore((s) => s.selectedPoint);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);
  // Chip auto-reactivates whenever the user picks a new point. They can
  // dismiss it for the current selection without losing the selection itself
  // (player + chart highlight stay put).
  const [contextEnabled, setContextEnabled] = useState(true);
  useEffect(() => {
    setContextEnabled(true);
  }, [selectedPoint?.year]);

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [chat.length, pending]);

  const contextActive = !!selectedPoint && contextEnabled;
  const contextLabel = selectedPoint
    ? `${selectedPoint.year} — ${selectedPoint.representative_clip.title || "clip"}`
    : "";

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !result?.session_id) return;

    const typed = input.trim();
    const userMsg = contextActive
      ? `Regarding ${selectedPoint!.year} ("${selectedPoint!.representative_clip.title || "clip"}"): ${typed}`
      : typed;
    const followupContext =
      contextActive && selectedPoint
        ? {
            type: "selection",
            year: selectedPoint.year,
            theme: selectedPoint.dominant_theme,
            frequency: selectedPoint.frequency,
            clip_title: selectedPoint.representative_clip.title,
            clip_reason: selectedPoint.representative_clip.reason,
            scenes: (selectedPoint.scenes ?? []).map((scene) => ({
              title: scene.title,
              reason: scene.reason,
            })),
          }
        : result
        ? {
            type: "result",
            entity: result.entity,
            query: result.query,
            narrative_summary: result.narrative_summary,
            summary_bullets: (result.summary_bullets ?? []).map((bullet) => ({
              year: bullet.year,
              headline: bullet.headline,
              text: bullet.text,
            })),
            timeline: result.timeline.map((point) => ({
              year: point.year,
              frequency: point.frequency,
              theme: point.dominant_theme,
            })),
          }
        : undefined;
    const useSession = result.source === "jockey";
    appendChat({ role: "user", content: userMsg });
    setInput("");
    setPending(true);

    try {
      const r = await postFollowup(
        result.session_id,
        userMsg,
        resultScenario,
        followupContext,
        useSession
      );
      appendChat({ role: "assistant", content: r.answer });
    } catch (e) {
      appendChat({ role: "assistant", content: `Error: ${e}` });
    } finally {
      setPending(false);
    }
  }

  const disabled = !result?.session_id;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 flex flex-col">
      <h3 className="text-sm font-medium text-neutral-300 mb-3">Multi-turn followups</h3>

      <div className="flex-1 overflow-y-auto space-y-3 mb-3 min-h-0 max-h-[420px]">
        {chat.length === 0 && (
          <div className="text-xs text-neutral-500 text-center py-8">
            Run a search above first,<br />then ask followup questions here.
            <div className="mt-3 text-neutral-600">
              Try: "Why did 2012 spike?" or "Compare with Nike"
            </div>
          </div>
        )}

        {chat.map((m, i) => (
          <div
            key={i}
            className={`text-sm rounded-md p-2 ${
              m.role === "user"
                ? "bg-brand-900/30 border border-brand-900 ml-6"
                : "bg-neutral-800 border border-neutral-700 mr-6"
            }`}
          >
            <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">
              {m.role === "user" ? "You" : "AI"}
            </div>
            {m.role === "assistant" ? (
              <Markdown>{m.content}</Markdown>
            ) : (
              <div className="text-neutral-100 whitespace-pre-wrap">{m.content}</div>
            )}
          </div>
        ))}

        {pending && (
          <div className="text-xs text-neutral-500 italic">Thinking…</div>
        )}
        <div ref={scrollAnchorRef} aria-hidden="true" />
      </div>

      {contextActive && (
        <div className="mb-2 flex items-center gap-2 px-2 py-1.5 bg-[#BFF3A4]/30 border border-[#60E21C] rounded-md">
          <span className="text-[10px] uppercase tracking-wider text-[#60E21C] font-medium">
            Asking about
          </span>
          <span className="text-xs text-neutral-200 truncate flex-1" title={contextLabel}>
            {contextLabel}
          </span>
          <button
            type="button"
            onClick={() => setContextEnabled(false)}
            aria-label="Remove clip context"
            className="text-neutral-400 hover:text-neutral-100 text-sm leading-none px-1"
          >
            ×
          </button>
        </div>
      )}

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            disabled
              ? "Run a search first"
              : contextActive
              ? "Ask about this clip…"
              : "Ask a followup…"
          }
          disabled={disabled || pending}
          className="flex-1 px-3 py-2 text-sm bg-neutral-950 border border-neutral-700 rounded-md
          focus:outline-none focus:border-neutral-50 focus:ring-2 focus:ring-neutral-50/10 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || pending || !input.trim()}
          className="px-3 py-2 text-sm bg-neutral-50 hover:bg-neutral-200 text-neutral-900 font-medium rounded-md
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}
