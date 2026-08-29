/** FactoryGPT — Interactive Tickets Hub & Status Management */
"use client";
import Head from "next/head";
import { useState, useEffect } from "react";
import { api, type Ticket } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  AlertTriangle,
  Filter,
  Clock,
  Eye,
  Wrench,
  Shield,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Tag,
  FileText,
} from "lucide-react";

const SOURCE_FILTERS = [
  { value: "", label: "All Sources" },
  { value: "vision", label: "Vision AI" },
  { value: "maintenance", label: "Maintenance" },
  { value: "safety", label: "Safety" },
];

const STATUS_FILTERS = [
  { value: "", label: "All Status" },
  { value: "open", label: "Open" },
  { value: "acknowledged", label: "Acknowledged" },
  { value: "closed", label: "Closed / Resolved" },
];

function formatSafeDate(d?: string | null): string {
  if (!d) return "Just now";
  try {
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? "Recent" : dt.toLocaleString();
  } catch {
    return "Recent";
  }
}

function getSourceIcon(source: string) {
  switch (source) {
    case "vision":
      return <Eye size={15} />;
    case "maintenance":
      return <Wrench size={15} />;
    case "safety":
      return <Shield size={15} />;
    default:
      return <AlertTriangle size={15} />;
  }
}

export default function TicketsPage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadTickets = () => {
    setLoading(true);
    api
      .getTickets({
        source_module: sourceFilter || undefined,
        status: statusFilter || undefined,
        limit: 50,
      })
      .then((res) => {
        const safeList = Array.isArray(res) ? res : [];
        setTickets(safeList);
        if (selectedTicket) {
          const updated = safeList.find((t) => t.id === selectedTicket.id);
          if (updated) setSelectedTicket(updated);
        }
      })
      .catch(() => {
        setTickets([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setMounted(true);
    loadTickets();
  }, [sourceFilter, statusFilter]);

  const handleStatusChange = async (ticketId: number, newStatus: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setUpdatingId(ticketId);
    setFeedback(null);
    try {
      const updated = await api.updateTicketStatus(ticketId, newStatus);
      setTickets((prev) => {
        const arr = Array.isArray(prev) ? prev : [];
        return arr.map((t) => (t.id === ticketId ? updated : t));
      });
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket(updated);
      }
      setFeedback(`Ticket #${ticketId} status updated to '${newStatus}'.`);
      setTimeout(() => setFeedback(null), 2500);
    } catch (err: any) {
      setFeedback(`Error: ${err?.message || "Failed to update ticket status"}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const safeTickets = Array.isArray(tickets) ? tickets : [];
  const openCount = safeTickets.filter((t) => t?.status === "open").length;
  const ackCount = safeTickets.filter((t) => t?.status === "acknowledged").length;
  const closedCount = safeTickets.filter((t) => t?.status === "closed").length;

  if (!mounted) {
    return (
      <div className="p-8 text-center text-xs text-[var(--color-text-muted)]">
        Loading Tickets Hub...
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Tickets Hub & Remediation — FactoryGPT ERP Portal</title>
      </Head>
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
              Workflow Work Orders & Tickets Hub
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Real-time anomaly remediation, root-cause tracking, and automated work orders
            </p>
          </div>
          <button
            onClick={loadTickets}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-line)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-all text-xs font-semibold shadow-xs"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Refresh Tickets</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mb-6 p-3 rounded-lg text-xs font-semibold flex items-center gap-2 animate-scale-up ${
              feedback.startsWith("Error")
                ? "bg-[var(--color-danger-light)] text-[var(--color-danger)] border border-[var(--color-danger-border)]"
                : "bg-[var(--color-success-light)] text-[var(--color-success)] border border-[var(--color-success-border)]"
            }`}
          >
            {feedback.startsWith("Error") ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
            <span>{feedback}</span>
          </div>
        )}

        {/* Stats Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="card-base p-4">
            <span className="text-[11px] text-[var(--color-text-muted)] font-medium">Open Issues</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="status-dot status-dot-offline" />
              <span className="text-xl font-bold text-[var(--color-danger)]">{openCount}</span>
            </div>
          </div>
          <div className="card-base p-4">
            <span className="text-[11px] text-[var(--color-text-muted)] font-medium">In Progress (Ack)</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="status-dot status-dot-warning" />
              <span className="text-xl font-bold text-[var(--color-amber)]">{ackCount}</span>
            </div>
          </div>
          <div className="card-base p-4">
            <span className="text-[11px] text-[var(--color-text-muted)] font-medium">Resolved / Fixed</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="status-dot status-dot-online" />
              <span className="text-xl font-bold text-[var(--color-success)]">{closedCount}</span>
            </div>
          </div>
          <div className="card-base p-4">
            <span className="text-[11px] text-[var(--color-text-muted)] font-medium">Total Work Orders</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xl font-bold text-[var(--color-text-primary)]">{safeTickets.length}</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] font-medium">
            <Filter size={13} />
            <span>Filter By:</span>
          </div>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="bg-white border border-[var(--color-line)] rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)] transition-colors shadow-xs"
          >
            {SOURCE_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-[var(--color-line)] rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)] transition-colors shadow-xs"
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* Ticket List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 animate-shimmer rounded-lg" />
            ))}
          </div>
        ) : safeTickets.length === 0 ? (
          <div className="card-base p-12 text-center">
            <AlertTriangle size={36} className="mx-auto mb-3 text-[var(--color-text-muted)]" />
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
              No tickets found matching filters
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Select another filter or trigger an inspection on the Vision or Maintenance pages.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {safeTickets.map((t) => {
              const isUpdating = updatingId === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className="card-base p-4.5 flex flex-wrap items-start justify-between gap-4 cursor-pointer hover:border-[var(--color-primary)] hover:shadow-xs transition-all"
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-[280px]">
                    {/* Source Icon */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        t.source_module === "vision"
                          ? "bg-[var(--color-primary-light)] text-[var(--color-primary)] border border-[var(--color-primary-border)]"
                          : t.source_module === "maintenance"
                          ? "bg-[var(--color-amber-light)] text-[var(--color-amber)] border border-[var(--color-amber-border)]"
                          : "bg-[var(--color-danger-light)] text-[var(--color-danger)] border border-[var(--color-danger-border)]"
                      }`}
                    >
                      {getSourceIcon(t.source_module)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-bold text-[var(--color-text-primary)] font-mono">
                          #{t.id}
                        </span>
                        <span
                          className={`badge ${
                            t.status === "open"
                              ? "badge-open"
                              : t.status === "acknowledged"
                              ? "badge-acknowledged"
                              : "badge-closed"
                          }`}
                        >
                          {t.status === "closed" ? "Closed / Resolved" : t.status}
                        </span>
                        <span className="badge badge-offline text-[9px] uppercase font-mono">{t.type}</span>
                        <span className="text-[10px] text-[var(--color-text-muted)] capitalize ml-auto hidden sm:inline-block">
                          Module: {t.source_module}
                        </span>
                      </div>

                      <p className="text-xs font-bold text-slate-900 leading-relaxed">
                        {t.description?.includes(":")
                          ? t.description.split(/:\s*/).slice(1).join(": ").trim()
                          : t.description}
                      </p>

                      <div className="flex items-center gap-3 mt-2 text-[10px] text-[var(--color-text-muted)]">
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {formatSafeDate(t.created_at)}
                        </span>
                        <span className="text-[var(--color-primary)] font-semibold hover:underline">
                          Click to view full remediation details →
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ── Status Triage Buttons on Card ────────────────────── */}
                  <div className="flex items-center gap-1.5 self-center sm:self-start">
                    {t.status === "open" && (
                      <>
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={(e) => handleStatusChange(t.id, "acknowledged", e)}
                          className="px-2.5 py-1 rounded bg-[var(--color-amber-light)] text-[var(--color-amber)] hover:bg-[var(--color-amber)] hover:text-white border border-[var(--color-amber-border)] text-xs font-semibold transition-all"
                          title="Acknowledge work order"
                        >
                          {isUpdating ? "..." : "Acknowledge"}
                        </button>
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={(e) => handleStatusChange(t.id, "closed", e)}
                          className="px-2.5 py-1 rounded bg-[var(--color-success-light)] text-[var(--color-success)] hover:bg-[var(--color-success)] hover:text-white border border-[var(--color-success-border)] text-xs font-semibold transition-all"
                          title="Mark defect or anomaly as fixed"
                        >
                          {isUpdating ? "..." : "Resolve / Close"}
                        </button>
                      </>
                    )}

                    {t.status === "acknowledged" && (
                      <>
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={(e) => handleStatusChange(t.id, "closed", e)}
                          className="px-3 py-1 rounded bg-[var(--color-success)] text-white hover:opacity-90 text-xs font-semibold transition-all shadow-xs"
                        >
                          {isUpdating ? "..." : "Mark Fixed & Close"}
                        </button>
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={(e) => handleStatusChange(t.id, "open", e)}
                          className="px-2 py-1 rounded bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-xs font-semibold"
                        >
                          Reopen
                        </button>
                      </>
                    )}

                    {t.status === "closed" && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={(e) => handleStatusChange(t.id, "open", e)}
                        className="px-2.5 py-1 rounded bg-[var(--color-surface)] border border-[var(--color-line)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] text-xs font-semibold transition-all"
                      >
                        Re-open Work Order
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Ticket Detail Modal / Drawer ─────────────────────────── */}
        {selectedTicket && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-[var(--color-line)] animate-scale-up max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-[var(--color-line)] pb-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-bold text-[var(--color-primary)]">
                      Work Order #{selectedTicket.id}
                    </span>
                    <span
                      className={`badge ${
                        selectedTicket.status === "open"
                          ? "badge-open"
                          : selectedTicket.status === "acknowledged"
                          ? "badge-acknowledged"
                          : "badge-closed"
                      }`}
                    >
                      {selectedTicket.status === "closed" ? "Resolved / Closed" : selectedTicket.status}
                    </span>
                    <span className="badge badge-offline text-[9px] uppercase">
                      {selectedTicket.source_module}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-[var(--color-text-primary)] leading-snug">
                    {(selectedTicket.type || "defect").replace("_", " ").toUpperCase()} REMEDIATION ORDER
                  </h3>
                </div>

                <button
                  onClick={() => setSelectedTicket(null)}
                  className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Full Description Box */}
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
                    Incident Description & Telemetry
                  </label>
                  <div className="p-3.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-line)] text-sm text-[var(--color-text-primary)] leading-relaxed font-medium">
                    {selectedTicket.description}
                  </div>
                </div>

                {/* Details Breakdown */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-slate-50 border border-[var(--color-line)] space-y-1">
                    <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider block font-semibold">
                      Trigger Module
                    </span>
                    <p className="font-bold text-[var(--color-text-primary)] capitalize">
                      {selectedTicket.source_module} Subsystem
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-[var(--color-line)] space-y-1">
                    <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider block font-semibold">
                      Created Timestamp
                    </span>
                    <p className="font-bold text-[var(--color-text-primary)]">
                      {formatSafeDate(selectedTicket.created_at)}
                    </p>
                  </div>
                </div>

                {/* Recommended Remediation Action */}
                <div>
                  <label className="block text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
                    Recommended Shop-Floor Action
                  </label>
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 space-y-1.5">
                    <p className="font-semibold">
                      {selectedTicket.source_module === "vision"
                        ? "Inspect welding torch alignment, clear optical shroud, and replace deburring insert."
                        : selectedTicket.source_module === "maintenance"
                        ? "Inspect main spindle bearings, check lubrication viscosity, and verify vibrational frequency harmonics."
                        : "Verify safety curtain interlocks, emergency stop relay response, and electrical isolation."}
                    </p>
                    <p className="text-[11px] text-blue-700">
                      Standard operating procedure SOP-IND-409 applies. Verify fix prior to closing ticket.
                    </p>
                  </div>
                </div>

                {/* Status Switcher Bar */}
                <div className="pt-3 border-t border-[var(--color-line)]">
                  <label className="block text-[11px] font-bold text-[var(--color-text-primary)] mb-2">
                    Update Work Order Status:
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(selectedTicket.id, "open")}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                        selectedTicket.status === "open"
                          ? "bg-[var(--color-danger)] text-white border-[var(--color-danger)] shadow-xs"
                          : "bg-white border-[var(--color-line)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
                      }`}
                    >
                      Open (Needs Action)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(selectedTicket.id, "acknowledged")}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                        selectedTicket.status === "acknowledged"
                          ? "bg-[var(--color-amber)] text-white border-[var(--color-amber)] shadow-xs"
                          : "bg-white border-[var(--color-line)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
                      }`}
                    >
                      Acknowledged (In Progress)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(selectedTicket.id, "closed")}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                        selectedTicket.status === "closed"
                          ? "bg-[var(--color-success)] text-white border-[var(--color-success)] shadow-xs"
                          : "bg-white border-[var(--color-line)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
                      }`}
                    >
                      Resolved & Closed
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end pt-4 mt-4 border-t border-[var(--color-line)]">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="px-5 py-2 rounded-lg bg-[var(--color-primary)] text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
