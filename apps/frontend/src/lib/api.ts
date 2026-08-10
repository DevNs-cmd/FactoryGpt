/**
 * FactoryGPT — Centralized API client.
 * The ONLY place the frontend talks to the backend. Every component
 * imports from here — never calls fetch() directly against a service URL.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status} on ${path}`);
  return res.json();
}

/* ── Production ──────────────────────────────────────────────────── */

export interface ProductionEvent {
  line_id: string;
  count: number;
  target: number;
  shift: string;
  timestamp: string;
}

export interface DowntimeEvent {
  line_id: string;
  machine_id: string;
  duration_seconds: number;
  reason: string;
  timestamp: string;
}

export interface ShiftSummary {
  shift: string;
  count: number;
  target: number;
  efficiency_pct: number;
}

export interface LineSummary {
  line_id: string;
  count: number;
  target: number;
  efficiency_pct: number;
}

export interface ProductionSummary {
  total_count: number;
  total_target: number;
  overall_efficiency_pct: number;
  by_shift: ShiftSummary[];
  by_line: LineSummary[];
}

/* ── Workflow / Tickets ──────────────────────────────────────────── */

export interface Ticket {
  id: number;
  source_module: string;
  type: string;
  status: string;
  description: string;
  created_at: string;
}

export interface MachineHealthResult {
  status: string;
  threshold: number;
  machines_checked: number;
  degraded_machines_count: number;
  alerts: {
    ticket_id: number;
    machine_id: string;
    health_score: number;
    status: string;
  }[];
  machines: {
    machine_id: string;
    health_score: number;
    vibration: number;
    temperature: number;
    rpm: number;
    predicted_days_to_failure: number;
    timestamp: string;
  }[];
}

/* ── Integrations ────────────────────────────────────────────────── */

export interface ServiceHealth {
  status: string;
  service: string;
}

export interface RootCauseData {
  by_reason: { reason: string; count: number; total_downtime_seconds: number }[];
  worst_machine: string;
  worst_line: string;
}

export interface OverviewData {
  vision: ServiceHealth | null;
  maintenance: any[] | null;
  root_cause: RootCauseData | null;
}

/* ── API Methods ─────────────────────────────────────────────────── */

export const api = {
  // Production
  getLiveProduction: (limit = 20) =>
    request<ProductionEvent[]>(`/production/live?limit=${limit}`),
  getDowntime: (limit = 50) =>
    request<DowntimeEvent[]>(`/production/downtime?limit=${limit}`),
  getProductionSummary: () =>
    request<ProductionSummary>("/production/summary"),
  seedData: (clearExisting = true) =>
    request("/production/seed", {
      method: "POST",
      body: JSON.stringify({ clear_existing: clearExisting }),
    }),

  // Workflow / Tickets
  getTickets: (filters?: { source_module?: string; status?: string; limit?: number }) => {
    const params = new URLSearchParams();
    if (filters?.source_module) params.set("source_module", filters.source_module);
    if (filters?.status) params.set("status", filters.status);
    if (filters?.limit) params.set("limit", String(filters.limit));
    const qs = params.toString();
    return request<Ticket[]>(`/workflow/tickets${qs ? `?${qs}` : ""}`);
  },
  checkMachineHealth: (threshold = 40) =>
    request<MachineHealthResult>(`/workflow/check-machine-health?threshold=${threshold}`),

  // Integrations
  getOverview: () => request<OverviewData>("/integrations/overview"),
  sendChatMessage: (message: string, language: string = "en") =>
    request<{ reply: string }>("/integrations/chat", {
      method: "POST",
      body: JSON.stringify({ message, language }),
    }),

  // Health check
  getHealth: () => request<{ status: string; service: string }>("/health"),
};
