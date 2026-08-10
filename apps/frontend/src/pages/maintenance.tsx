/** FactoryGPT — Predictive Maintenance Page */
"use client";
import Head from "next/head";
import { useState, useEffect } from "react";
import { api, type MachineHealthResult } from "@/lib/api";
import {
  Wrench,
  Activity,
  Thermometer,
  Gauge,
  AlertTriangle,
  RefreshCw,
  Clock,
} from "lucide-react";

function getHealthColor(score: number) {
  if (score >= 70) return "var(--color-success)";
  if (score >= 40) return "var(--color-amber)";
  return "var(--color-danger)";
}

function getHealthLabel(score: number) {
  if (score >= 70) return "Healthy";
  if (score >= 40) return "Warning";
  return "Critical";
}

export default function MaintenancePage() {
  const [data, setData] = useState<MachineHealthResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(false);

  const load = async () => {
    try {
      const result = await api.checkMachineHealth();
      setData(result);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setChecking(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const runCheck = () => {
    setChecking(true);
    load();
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Maintenance — FactoryGPT ERP Portal</title>
        </Head>
        <div>
          <h1 className="text-2xl font-display font-bold mb-6">Predictive Maintenance</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 animate-shimmer rounded-xl" />
            ))}
          </div>
        </div>
      </>
    );
  }

  const machines = data?.machines ?? [];
  const degradedCount = data?.degraded_machines_count ?? 0;

  return (
    <>
      <Head>
        <title>Maintenance — FactoryGPT ERP Portal</title>
      </Head>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-[var(--color-text-primary)]">
              Predictive Maintenance
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Machine health monitoring & failure prediction
            </p>
          </div>
          <button
            onClick={runCheck}
            disabled={checking}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-cyan text-[var(--color-base)] text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <RefreshCw size={14} className={checking ? "animate-spin" : ""} />
            {checking ? "Checking..." : "Run Health Check"}
          </button>
        </div>

        {/* Status Bar */}
        {data && (
          <div className="flex gap-4 mb-6">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-line)]">
              <span className="text-xs font-mono text-[var(--color-text-secondary)]">
                {data.machines_checked} machines checked
              </span>
            </div>
            {degradedCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-danger-glow)] border border-[rgba(224,86,63,0.2)]">
                <AlertTriangle size={12} className="text-[var(--color-danger)]" />
                <span className="text-xs font-mono text-[var(--color-danger)]">
                  {degradedCount} degraded
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-line)]">
              <span className="text-xs font-mono text-[var(--color-text-muted)]">
                Threshold: {data.threshold}
              </span>
            </div>
          </div>
        )}

        {error ? (
          <div className="card-base p-8 text-center">
            <Wrench size={32} className="mx-auto mb-3 text-[var(--color-text-muted)]" />
            <p className="text-sm text-[var(--color-text-muted)] font-mono">
              Predictive maintenance service unreachable
            </p>
          </div>
        ) : machines.length === 0 ? (
          <div className="card-base p-8 text-center">
            <Activity size={32} className="mx-auto mb-3 text-[var(--color-text-muted)]" />
            <p className="text-sm text-[var(--color-text-muted)] font-mono">
              No machine health data available
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
            {machines.map((m: any) => {
              const color = getHealthColor(m.health_score);
              const label = getHealthLabel(m.health_score);
              const pct = Math.min(100, Math.max(0, m.health_score));

              return (
                <div key={m.machine_id} className="card-base p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Wrench size={16} style={{ color }} />
                      <h3 className="font-display font-semibold text-sm text-[var(--color-text-primary)]">
                        {m.machine_id}
                      </h3>
                    </div>
                    <span
                      className={`badge ${
                        m.health_score >= 70
                          ? "badge-online"
                          : m.health_score >= 40
                          ? "badge-acknowledged"
                          : "badge-critical"
                      }`}
                    >
                      {label}
                    </span>
                  </div>

                  {/* Health Score Ring */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative w-16 h-16 flex-shrink-0">
                      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="var(--color-surface)"
                          strokeWidth="3"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke={color}
                          strokeWidth="3"
                          strokeDasharray={`${pct}, 100`}
                          strokeLinecap="round"
                          style={{ transition: "stroke-dasharray 0.8s ease" }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold font-mono" style={{ color }}>
                          {m.health_score}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1 text-xs font-mono">
                      <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                        <Activity size={12} />
                        <span>Vibration: {m.vibration?.toFixed(1)} mm/s</span>
                      </div>
                      <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                        <Thermometer size={12} />
                        <span>Temp: {m.temperature?.toFixed(1)}°C</span>
                      </div>
                      <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                        <Gauge size={12} />
                        <span>RPM: {m.rpm}</span>
                      </div>
                    </div>
                  </div>

                  {/* Prediction */}
                  <div className="pt-3 border-t border-[var(--color-line)] flex items-center justify-between">
                    <span className="text-[11px] text-[var(--color-text-muted)] font-mono flex items-center gap-1">
                      <Clock size={10} />
                      Days to failure
                    </span>
                    <span
                      className="text-sm font-bold font-mono"
                      style={{ color: m.predicted_days_to_failure <= 7 ? "var(--color-danger)" : color }}
                    >
                      {m.predicted_days_to_failure}d
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
