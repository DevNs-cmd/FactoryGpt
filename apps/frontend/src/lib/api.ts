/**
 * FactoryGPT — Centralized API client with Auth & Multi-Tenant Support.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

let authToken: string | null = null;

if (typeof window !== "undefined") {
  authToken = localStorage.getItem("factorygpt_token");
}

export function setStoredToken(token: string | null) {
  authToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("factorygpt_token", token);
    } else {
      localStorage.removeItem("factorygpt_token");
    }
  }
}

export function getStoredToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("factorygpt_token") || authToken;
  }
  return authToken;
}

async function request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (netErr: any) {
    throw new Error(
      `Unable to reach FactoryGPT backend (${API_URL}). Please verify that backend-core is running on port 8000.`
    );
  }

  if (!res.ok) {
    let errorDetail = `API error ${res.status} on ${path}`;
    try {
      const errJson = await res.json();
      if (errJson?.detail) {
        errorDetail = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // ignore json parse failure
    }
    throw new Error(errorDetail);
  }

  return res.json();
}

/* ── Auth & Multi-Tenant Models ──────────────────────────────────── */

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: string; // owner | manager | qc_inspector | maintenance_engineer | operator
  factory_id: number | null;
  factory_name: string | null;
  factory_code: string | null;
  is_approved?: boolean;
  created_at: string;
}

export interface FactoryLine {
  id: number;
  name: string;
  machine_count: number;
  target_per_shift: number;
  shifts: string;
}

export interface Factory {
  id: number;
  name: string;
  code: string;
  location?: string | null;
  industry: string;
  lines: FactoryLine[];
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
  factory: Factory | null;
}

/* ── Production Models ───────────────────────────────────────────── */

export interface ProductionEvent {
  id?: number;
  factory_id?: number | null;
  line_id: string;
  count: number;
  target: number;
  shift: string;
  timestamp: string;
}

export interface DowntimeEvent {
  id?: number;
  factory_id?: number | null;
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
  factory_id?: number | null;
  source_module: string;
  type: string;
  status: string;
  description: string;
  created_at: string;
}

export interface MachineHealthResult {
  status: string;
  factory_id?: number;
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
    degrading?: boolean;
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
  chatbot: ServiceHealth | null;
  maintenance: any[] | null;
  root_cause: RootCauseData | null;
}

/* ── API Methods ─────────────────────────────────────────────────── */

export interface ChatAssistantResponse {
  answer?: string;
  reply?: string;
  source?: string;
  confidence?: number;
  suggestions?: string[];
  execution_time_ms?: number;
  model_used?: string;
}

export interface VoiceAssistantResponse {
  transcription: string;
  response: ChatAssistantResponse;
}

export const api = {
  // Auth
  login: (data: { email: string; password: string }) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  register: (data: {
    email: string;
    password: string;
    full_name: string;
    role: string;
    factory_name?: string;
    factory_location?: string;
    industry?: string;
    factory_code?: string;
    lines?: { name: string; machine_count: number; target_per_shift: number; shifts: string }[];
  }) =>
    request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getMe: () => request<AuthResponse>("/auth/me"),
  getFactory: () => request<Factory | null>("/auth/factory"),
  getPendingUsers: () => request<User[]>("/auth/pending-users"),
  approveUser: (userId: number) =>
    request<{ status: string; message: string }>("/auth/approve-user", {
      method: "POST",
      body: JSON.stringify({ user_id: userId }),
    }),
  rejectUser: (userId: number) =>
    request<{ status: string; message: string }>("/auth/reject-user", {
      method: "POST",
      body: JSON.stringify({ user_id: userId }),
    }),

  // Production
  getLiveProduction: (limit = 20) =>
    request<ProductionEvent[]>(`/production/live?limit=${limit}`),
  getDowntime: (limit = 50) =>
    request<DowntimeEvent[]>(`/production/downtime?limit=${limit}`),
  getProductionSummary: () =>
    request<ProductionSummary>("/production/summary"),
  logProduction: (data: { line_id: string; count: number; target: number; shift: string }) =>
    request<ProductionEvent>("/production/log", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  logDowntime: (data: { line_id: string; machine_id: string; duration_seconds: number; reason: string }) =>
    request<DowntimeEvent>("/production/downtime/log", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  seedData: (clearExisting = false) =>
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
  updateTicketStatus: (ticketId: number, status: string) =>
    request<Ticket>(`/workflow/tickets/${ticketId}/status?status=${encodeURIComponent(status)}`, {
      method: "PATCH",
    }),
  checkMachineHealth: (threshold = 40) =>
    request<MachineHealthResult>(`/workflow/check-machine-health?threshold=${threshold}`),
  resetMachineHealth: () =>
    request<{ status: string; message: string }>("/workflow/reset-machine-health", {
      method: "POST",
    }),
  toggleMachineAnomaly: (machineId: string, degrading: boolean = true) =>
    request<{ status: string; message: string }>(
      `/workflow/toggle-machine-anomaly?machine_id=${encodeURIComponent(machineId)}&degrading=${degrading}`,
      { method: "POST" }
    ),

  // Integrations
  getOverview: () => request<OverviewData>("/integrations/overview"),
  sendChatMessage: (message: string, language: string = "en", role: string = "Production Manager") =>
    request<ChatAssistantResponse>("/integrations/chat", {
      method: "POST",
      body: JSON.stringify({ message, language, role }),
    }),

  sendVoiceMessage: async (audioBlob: Blob, language: string = "en", role: string = "Production Manager") => {
    const token = getStoredToken();
    const formData = new FormData();
    formData.append("file", audioBlob, "voice_command.wav");
    formData.append("language", language);
    formData.append("role", role);
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}/integrations/voice`, {
      method: "POST",
      headers,
      body: formData,
    });
    if (!res.ok) throw new Error("Voice transcription failed");
    return res.json() as Promise<VoiceAssistantResponse>;
  },

  inspectImage: async (file: File) => {
    const token = getStoredToken();
    const formData = new FormData();
    formData.append("file", file);
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}/integrations/vision/inspect`, {
      method: "POST",
      headers,
      body: formData,
    });
    if (!res.ok) throw new Error("Image inspection failed");
    return res.json() as Promise<{
      status: string;
      image_ref: string;
      defects: { defect_type: string; confidence: number; bbox?: number[] }[];
      tickets_created: number[];
    }>;
  },

  importProductionCSV: async (file: File, clearExisting = false) => {
    const token = getStoredToken();
    const formData = new FormData();
    formData.append("file", file);
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}/production/import-csv?clear_existing=${clearExisting}`, {
      method: "POST",
      headers,
      body: formData,
    });
    if (!res.ok) throw new Error("CSV import failed");
    return res.json();
  },

  // Health check
  getHealth: () => request<{ status: string; service: string }>("/health"),
};
