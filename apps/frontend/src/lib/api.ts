/**
 * Owner: Abhi
 * The ONLY place the frontend talks to the backend. Every component below
 * imports from here — never calls fetch() directly against a service URL.
 * This means if backend-core's integrations layer changes how it reaches
 * vision/chatbot/maintenance/root-cause, only this one file needs updating.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status} on ${path}`);
  return res.json();
}

export const api = {
  getLiveProduction: () => request("/production/live"),
  getDowntime: () => request("/production/downtime"),
  getOverview: () => request("/integrations/overview"),
  sendChatMessage: (message: string, language: string = "en") =>
    request("/integrations/chat", {
      method: "POST",
      body: JSON.stringify({ message, language }),
    }),
};
