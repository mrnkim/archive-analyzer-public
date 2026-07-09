import type { FollowupResponse, QueryResponse } from "../types/api";

const BASE = ""; // Vite proxy가 /api → :8000으로 보냄

export async function postQuery(query: string, scenario?: string): Promise<QueryResponse> {
  const r = await fetch(`${BASE}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, scenario }),
  });
  if (!r.ok) throw new Error(`Query failed: ${r.status}`);
  return r.json();
}

export async function postFollowup(
  sessionId: string,
  message: string,
  scenario?: string,
  context?: Record<string, unknown>
): Promise<FollowupResponse> {
  const r = await fetch(`${BASE}/api/sessions/${sessionId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, scenario, context }),
  });
  if (!r.ok) throw new Error(`Followup failed: ${r.status}`);
  return r.json();
}
