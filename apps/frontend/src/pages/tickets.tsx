/** FactoryGPT — Tickets / Alerts Page */
"use client";
import Head from "next/head";
import { useState, useEffect } from "react";
import { api, type Ticket } from "@/lib/api";
import {
  AlertTriangle,
  Filter,
  Clock,
  Eye,
  Wrench,
  Shield,
  RefreshCw,
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
  { value: "closed", label: "Closed" },
];

function getSourceIcon(source: string) {
  switch (source) {
    case "vision":
      return <Eye size={14} />;
    case "maintenance":
      return <Wrench size={14} />;
    case "safety":
      return <Shield size={14} />;
    default:
      return <AlertTriangle size={14} />;
  }
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const loadTickets = () => {
    setLoading(true);
    api
      .getTickets({
        source_module: sourceFilter || undefined,
        status: statusFilter || undefined,
        limit: 50,
      })
      .then(setTickets)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTickets();
  }, [sourceFilter, statusFilter]);

  const openCount = tickets.filter((t) => t.status === "open").length;
  const ackCount = tickets.filter((t) => t.status === "acknowledged").length;

  return (
    <>
      <Head>
        <title>Tickets — FactoryGPT ERP Portal</title>
      </Head>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
              Workflow Tickets
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Automated alerts from Vision AI, Maintenance, and Safety modules
            </p>
          </div>
          <button
            onClick={loadTickets}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-all text-sm"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        {/* Stats Bar */}
        <div className="flex gap-3 mb-6">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-primary-light)] border border-[var(--color-primary-border)]">
            <span className="status-dot status-dot-online" />
            <span className="text-xs text-[var(--color-primary)]">{openCount} open</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-amber-light)] border border-[var(--color-amber-border)]">
            <span className="status-dot status-dot-warning" />
            <span className="text-xs text-[var(--color-amber)]">{ackCount} acknowledged</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-line)]">
            <span className="text-xs text-[var(--color-text-muted)]">{tickets.length} total</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <Filter size={14} className="text-[var(--color-text-muted)]" />
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="bg-white border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)] transition-colors"
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
            className="bg-white border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)] transition-colors"
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
        ) : tickets.length === 0 ? (
          <div className="card-base p-8 text-center">
            <AlertTriangle size={32} className="mx-auto mb-3 text-[var(--color-text-muted)]" />
            <p className="text-sm text-[var(--color-text-muted)]">
              No tickets match the current filters
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="card-base p-4 flex items-start gap-4"
              >
                {/* Source Icon */}
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    t.source_module === "vision"
                      ? "bg-[var(--color-primary-light)] text-[var(--color-primary)]"
                      : t.source_module === "maintenance"
                      ? "bg-[var(--color-amber-light)] text-[var(--color-amber)]"
                      : "bg-[var(--color-danger-light)] text-[var(--color-danger)]"
                  }`}
                >
                  {getSourceIcon(t.source_module)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-[var(--color-text-muted)]">
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
                      {t.status}
                    </span>
                    <span className="badge badge-offline text-[9px]">{t.type}</span>
                  </div>
                  <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">
                    {t.description}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(t.created_at).toLocaleString()}
                    </span>
                    <span className="badge badge-offline text-[9px]">
                      {t.source_module}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
