import { useEffect, useRef, useState } from "react";
import { postFollowup } from "../api/client";
import { useStore } from "../store";
import { Markdown } from "./Markdown";
import { Button, TextField, CloseIcon } from "@twelvelabs-io/react";

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
    // Only follow the conversation as it grows — never on the empty chat that
    // mounts with a fresh result, or the page would yank down to this panel
    // (it sits at the bottom) the moment a scenario loads.
    if (chat.length === 0) return;
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
    <div className="bg-surface-white border border-border-secondary rounded-tlds-3 p-4 flex flex-col">
      <h3 className="text-sm font-medium text-foreground-muted mb-3">Multi-turn followups</h3>

      <div className="flex-1 overflow-y-auto space-y-3 mb-3 min-h-0 max-h-[420px]">
        {chat.length === 0 && (
          <div className="text-xs text-foreground-subtle text-center py-8">
            Run a search above first,<br />then ask followup questions here.
            <div className="mt-3 text-foreground-subtle">
              Try: "Why did 2012 spike?" or "Compare with Nike"
            </div>
          </div>
        )}

        {chat.map((m, i) => (
          <div
            key={i}
            className={`text-sm rounded-nav-item p-2 ${
              m.role === "user"
                ? "bg-[color-mix(in_srgb,var(--tl-color-embed-green)_30%,transparent)] border border-tl-embed-green ml-6"
                : "bg-surface-secondary border border-border-secondary mr-6"
            }`}
          >
            <div className="text-[10px] uppercase tracking-wider text-foreground-subtle mb-1">
              {m.role === "user" ? "You" : "AI"}
            </div>
            {m.role === "assistant" ? (
              <Markdown>{m.content}</Markdown>
            ) : (
              <div className="text-foreground-body whitespace-pre-wrap">{m.content}</div>
            )}
          </div>
        ))}

        {pending && (
          <div className="text-xs text-foreground-subtle italic">Thinking…</div>
        )}
        <div ref={scrollAnchorRef} aria-hidden="true" />
      </div>

      {contextActive && (
        <div className="mb-2 flex items-center gap-2 px-2 py-1.5 bg-[color-mix(in_srgb,var(--tl-color-embed-light-green)_30%,transparent)] border border-tl-embed-green rounded-nav-item">
          <span className="text-[10px] uppercase tracking-wider text-tl-embed-green font-medium">
            Asking about
          </span>
          <span className="text-xs text-foreground-muted truncate flex-1" title={contextLabel}>
            {contextLabel}
          </span>
          <button
            type="button"
            onClick={() => setContextEnabled(false)}
            aria-label="Remove clip context"
            className="text-foreground-subtle hover:text-foreground-body leading-none px-1"
          >
            <CloseIcon className="size-3" />
          </button>
        </div>
      )}

      <form onSubmit={handleSend} className="flex gap-2">
        <TextField
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
          className="flex-1"
        />
        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={pending}
          disabled={disabled || pending || !input.trim()}
        >
          Send
        </Button>
      </form>
    </div>
  );
}
