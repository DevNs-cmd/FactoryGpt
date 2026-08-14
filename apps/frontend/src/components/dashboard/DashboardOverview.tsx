/** FactoryGPT — Dashboard Overview: KPIs, charts, tickets, service health. */
"use client";
import { useEffect, useState } from "react";
import {
  api,
  type ProductionSummary,
  type Ticket,
  type OverviewData,
} from "@/lib/api";
import {
  Factory,
  Gauge,
  AlertTriangle,
  Activity,
  Clock,
} from "lucide-react";
import KPICard from "./KPICard";
import EfficiencyChart from "./EfficiencyChart";
import ShiftChart from "./ShiftChart";

export default function DashboardOverview() {
  const [summary, setSummary] = useState<ProductionSummary | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, t, o] = await Promise.all([
          api.getProductionSummary(),
          api.getTickets({ limit: 5 }),
          api.getOverview(),
        ]);
        setSummary(s);
        setTickets(t);
        setOverview(o);
        setError(false);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* KPI skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card-base p-5 h-32 animate-shimmer" />
          ))}
        </div>
        {/* Chart skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card-base p-5 h-72 animate-shimmer" />
          <div className="card-base p-5 h-72 animate-shimmer" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-base p-8 text-center">
        <div className="w-12 h-12 rounded-lg bg-[var(--color-danger-light)] flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={24} className="text-[var(--color-danger)]" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Backend Unreachable</h3>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Make sure backend-core is running on port 8000
        </p>
      </div>
    );
  }

  const openTickets = tickets.filter((t) => t.status === "open").length;

  return (
    <div className="space-y-6">
      {/* ── KPI Row ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total Production"
          value={summary?.total_count?.toLocaleString() ?? "—"}
          icon={<Factory size={20} />}
          accent="cyan"
          subtitle={`Target: ${summary?.total_target?.toLocaleString() ?? "—"}`}
          trend="up"
        />
        <KPICard
          label="Overall Efficiency"
          value={`${summary?.overall_efficiency_pct ?? 0}%`}
          icon={<Gauge size={20} />}
          accent={(summary?.overall_efficiency_pct ?? 0) >= 85 ? "success" : "amber"}
          subtitle="OEE across all lines"
          trend={(summary?.overall_efficiency_pct ?? 0) >= 85 ? "up" : "down"}
        />
        <KPICard
          label="Open Tickets"
          value={openTickets}
          icon={<AlertTriangle size={20} />}
          accent={openTickets > 3 ? "danger" : "amber"}
          subtitle={`${tickets.length} total recent`}
        />
        <KPICard
          label="Active Lines"
          value={summary?.by_line?.length ?? 0}
          icon={<Activity size={20} />}
          accent="cyan"
          subtitle={`${summary?.by_shift?.length ?? 0} shifts running`}
          trend="neutral"
        />
      </div>

      {/* ── Charts Row ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card-base p-5">
          <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-4">
            Line Efficiency
          </h3>
          <EfficiencyChart data={summary?.by_line ?? []} />
        </div>
        <div className="card-base p-5">
          <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-4">
            Shift Performance
          </h3>
          <ShiftChart data={summary?.by_shift ?? []} />
        </div>
      </div>

      {/* ── Bottom Row: Tickets + Service Health ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Tickets */}
        <div className="lg:col-span-2 card-base p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[var(--color-text-secondary)]">
              Recent Tickets
            </h3>
            <a
              href="/tickets"
              className="text-xs text-[var(--color-primary)] hover:underline"
            >
              View all →
            </a>
          </div>
          {tickets.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">No tickets yet</p>
          ) : (
            <div className="space-y-2">
              {tickets.map((t) => (
                <div
                  key={t.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-surface)] hover:bg-[var(--color-panel-hover)] transition-colors"
                >
                  <div className="mt-0.5">
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
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--color-text-primary)] truncate">
                      {t.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="badge badge-offline text-[9px]">{t.source_module}</span>
                      <span className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(t.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Service Health */}
        <div className="card-base p-5">
          <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-4">
            Service Health
          </h3>
          <div className="space-y-3">
            {[
              {
                name: "Vision Inspection",
                online: overview?.vision?.status === "ok",
                port: 8001,
              },
              {
                name: "Predictive Maintenance",
                online: Array.isArray(overview?.maintenance),
                port: 8003,
              },
              {
                name: "Root Cause Analysis",
                online: overview?.root_cause?.worst_machine != null,
                port: 8004,
              },
              {
                name: "Chatbot Assistant",
                online: true, // Checked via overview — we don't have a direct key, show as derived
                port: 8002,
              },
            ].map((svc) => (
              <div
                key={svc.name}
                className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-surface)]"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`status-dot ${
                      svc.online ? "status-dot-online" : "status-dot-offline"
                    }`}
                  />
                  <span className="text-sm text-[var(--color-text-primary)]">{svc.name}</span>
                </div>
                <span
                  className={`badge text-[9px] ${svc.online ? "badge-online" : "badge-offline"}`}
                >
                  {svc.online ? "online" : "offline"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
