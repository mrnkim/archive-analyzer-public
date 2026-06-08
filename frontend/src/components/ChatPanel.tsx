import { useState } from "react";
import { postFollowup } from "../api/client";
import { useStore } from "../store";
import { JockeyMarkdown } from "./JockeyMarkdown";

export function ChatPanel() {
  const chat = useStore((s) => s.chat);
  const appendChat = useStore((s) => s.appendChat);
  const result = useStore((s) => s.result);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !result?.session_id) return;

    const userMsg = input.trim();
    appendChat({ role: "user", content: userMsg });
    setInput("");
    setPending(true);

    try {
      const r = await postFollowup(result.session_id, userMsg);
      appendChat({ role: "assistant", content: r.answer });
    } catch (e) {
      appendChat({ role: "assistant", content: `Error: ${e}` });
    } finally {
      setPending(false);
    }
  }

  const disabled = !result?.session_id;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 h-full flex flex-col">
      <h3 className="text-sm font-medium text-neutral-300 mb-3">Multi-turn followups</h3>

      <div className="flex-1 overflow-y-auto space-y-3 mb-3 min-h-0">
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
              <JockeyMarkdown>{m.content}</JockeyMarkdown>
            ) : (
              <div className="text-neutral-100 whitespace-pre-wrap">{m.content}</div>
            )}
          </div>
        ))}

        {pending && (
          <div className="text-xs text-neutral-500 italic">Thinking…</div>
        )}
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={disabled ? "Run a search first" : "Ask a followup…"}
          disabled={disabled || pending}
          className="flex-1 px-3 py-2 text-sm bg-neutral-950 border border-neutral-700 rounded-md
                     focus:outline-none focus:border-brand-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || pending || !input.trim()}
          className="px-3 py-2 text-sm bg-brand-500 hover:bg-brand-900 text-white rounded-md
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}
