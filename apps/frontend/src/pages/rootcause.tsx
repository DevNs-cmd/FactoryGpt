/** FactoryGPT — Root Cause Analysis Page */
"use client";
import Head from "next/head";
import { useState, useEffect } from "react";
import { api, type OverviewData, type DowntimeEvent } from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { Search, AlertTriangle, Factory, Wrench } from "lucide-react";

const PIE_COLORS = ["#2563EB", "#D97706", "#DC2626", "#16A34A", "#64748B", "#7C3AED", "#EC4899"];

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-[var(--color-line)] rounded-lg px-3 py-2 text-xs shadow-md">
      <p className="text-[var(--color-text-primary)] font-semibold mb-1">{d.reason || d.name}</p>
      {d.total_downtime_seconds != null && (
        <p className="text-[var(--color-text-secondary)]">
          Total downtime:{" "}
          <span className="text-[var(--color-amber)] font-medium">
            {Math.round(d.total_downtime_seconds / 60)}m
          </span>
        </p>
      )}
      {d.count != null && (
        <p className="text-[var(--color-text-secondary)]">
          Occurrences: <span className="text-[var(--color-primary)] font-medium">{d.count}</span>
        </p>
      )}
    </div>
  );
}

export default function RootCausePage() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [downtime, setDowntime] = useState<DowntimeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    Promise.all([api.getOverview(), api.getDowntime(50)])
      .then(([o, d]) => {
        setOverview(o);
        setDowntime(d);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  // Build local aggregation from downtime data
  const reasonBreakdown = (() => {
    const map: Record<string, { count: number; total: number }> = {};
    downtime.forEach((d) => {
      const r = d.reason || "unknown";
      if (!map[r]) map[r] = { count: 0, total: 0 };
      map[r].count += 1;
      map[r].total += d.duration_seconds;
    });
    return Object.entries(map)
      .map(([reason, data]) => ({
        reason,
        name: reason,
        count: data.count,
        total_downtime_seconds: data.total,
      }))
      .sort((a, b) => b.total_downtime_seconds - a.total_downtime_seconds);
  })();

  const worstMachine = (() => {
    const map: Record<string, number> = {};
    downtime.forEach((d) => {
      map[d.machine_id] = (map[d.machine_id] || 0) + d.duration_seconds;
    });
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
    return sorted[0] ?? null;
  })();

  const worstLine = (() => {
    const map: Record<string, number> = {};
    downtime.forEach((d) => {
      map[d.line_id] = (map[d.line_id] || 0) + d.duration_seconds;
    });
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
    return sorted[0] ?? null;
  })();

  // Use root_cause from integrations/overview if available
  const rcData = overview?.root_cause;

  if (loading) {
    return (
      <>
        <Head>
          <title>Root Cause — FactoryGPT ERP Portal</title>
        </Head>
        <div>
          <h1 className="text-2xl font-semibold mb-6">Root Cause Analysis</h1>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="h-72 animate-shimmer rounded-lg" />
            <div className="h-72 animate-shimmer rounded-lg" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Root Cause — FactoryGPT ERP Portal</title>
      </Head>
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            Root Cause Analysis
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Downtime breakdown by reason, machine, and production line
          </p>
        </div>

        {/* Highlight Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="card-base p-5">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} className="text-[var(--color-danger)]" />
              <span className="text-xs text-[var(--color-text-muted)] font-medium">
                Top Downtime Reason
              </span>
            </div>
            <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">
              {reasonBreakdown[0]?.reason || rcData?.by_reason?.[0]?.reason || "No data"}
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              {reasonBreakdown[0]
                ? `${Math.round(reasonBreakdown[0].total_downtime_seconds / 60)}min total`
                : ""}
            </p>
          </div>
          <div className="card-base p-5">
            <div className="flex items-center gap-2 mb-2">
              <Wrench size={16} className="text-[var(--color-amber)]" />
              <span className="text-xs text-[var(--color-text-muted)] font-medium">
                Worst Machine
              </span>
            </div>
            <p className="text-lg font-semibold text-[var(--color-text-primary)]">
              {rcData?.worst_machine || worstMachine?.[0] || "—"}
            </p>
            {worstMachine && (
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                {Math.round(worstMachine[1] / 60)}min total downtime
              </p>
            )}
          </div>
          <div className="card-base p-5">
            <div className="flex items-center gap-2 mb-2">
              <Factory size={16} className="text-[var(--color-primary)]" />
              <span className="text-xs text-[var(--color-text-muted)] font-medium">
                Worst Line
              </span>
            </div>
            <p className="text-lg font-semibold text-[var(--color-text-primary)]">
              {rcData?.worst_line || worstLine?.[0] || "—"}
            </p>
            {worstLine && (
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                {Math.round(worstLine[1] / 60)}min total downtime
              </p>
            )}
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Bar Chart: Downtime by Reason */}
          <div className="card-base p-5">
            <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-4">
              Downtime by Reason
            </h3>
            {reasonBreakdown.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-[var(--color-text-muted)] text-sm">
                No downtime data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={reasonBreakdown.slice(0, 8)}
                  layout="vertical"
                  margin={{ top: 0, right: 8, bottom: 0, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "#64748B" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${Math.round(v / 60)}m`}
                  />
                  <YAxis
                    type="category"
                    dataKey="reason"
                    tick={{ fontSize: 10, fill: "#64748B" }}
                    axisLine={false}
                    tickLine={false}
                    width={120}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                  <Bar dataKey="total_downtime_seconds" radius={[0, 4, 4, 0]} maxBarSize={28}>
                    {reasonBreakdown.slice(0, 8).map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Pie Chart: Occurrences by Reason */}
          <div className="card-base p-5">
            <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-4">
              Occurrence Distribution
            </h3>
            {reasonBreakdown.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-[var(--color-text-muted)] text-sm">
                No data
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="60%" height={280}>
                  <PieChart>
                    <Pie
                      data={reasonBreakdown.slice(0, 6)}
                      dataKey="count"
                      nameKey="reason"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={50}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {reasonBreakdown.slice(0, 6).map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {reasonBreakdown.slice(0, 6).map((r, i) => (
                    <div key={r.reason} className="flex items-center gap-2 text-xs">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <span className="text-[var(--color-text-secondary)] truncate flex-1">
                        {r.reason}
                      </span>
                      <span className="text-[var(--color-text-muted)]">{r.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Service Status */}
        {!rcData && (
          <div className="mt-4 border-l-2 border-[var(--color-amber)] bg-[var(--color-amber-light)] px-4 py-3 rounded-r-lg text-sm">
            <span className="text-[var(--color-amber)] font-medium">Note:</span>{" "}
            <span className="text-[var(--color-text-secondary)]">
              Root cause analysis service is offline. Showing local aggregation from downtime data.
            </span>
          </div>
        )}
      </div>
    </>
  );
}
