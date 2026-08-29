/** FactoryGPT — Predictive Maintenance Studio with Dynamic Plant Equipment Telemetry */
"use client";
import Head from "next/head";
import Link from "next/link";
import { useState, useEffect } from "react";
import { api, type MachineHealthResult } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  Wrench,
  Activity,
  Thermometer,
  Gauge,
  AlertTriangle,
  RefreshCw,
  Clock,
  RotateCcw,
  ShieldAlert,
  TrendingUp,
  Search,
  Filter,
  Layers,
  Zap,
  CheckCircle2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

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

interface TelemetryPoint {
  time: string;
  machine_id: string;
  vibration: number;
  temperature: number;
  health_score: number;
}

export default function MaintenancePage() {
  const { factory } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<MachineHealthResult | null>(null);
  const [history, setHistory] = useState<TelemetryPoint[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [anomalyLoading, setAnomalyLoading] = useState(false);
  const [error, setError] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [floorFilter, setFloorFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const load = async () => {
    try {
      const result = await api.checkMachineHealth();
      setData(result);
      setError(false);

      const machinesList = result.machines || [];
      if (!selectedMachine && machinesList.length > 0) {
        // Default to first anomaly or first machine
        const firstAnomaly = machinesList.find((m: any) => m.health_score < 70) || machinesList[0];
        setSelectedMachine(firstAnomaly.machine_id);
      }

      // Record rolling telemetry history for time-series charts
      const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const newPoints = machinesList.map((m: any) => ({
        time: nowStr,
        machine_id: m.machine_id,
        vibration: m.vibration,
        temperature: m.temperature,
        health_score: m.health_score,
      }));

      setHistory((prev) => [...prev, ...newPoints].slice(-100));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setChecking(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  const runCheck = () => {
    setChecking(true);
    load();
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      await api.resetMachineHealth();
      setHistory([]);
      await load();
    } catch {
      // ignore
    } finally {
      setResetting(false);
    }
  };

  const handleToggleAnomaly = async (mId: string, currentDegrading: boolean) => {
    setAnomalyLoading(true);
    try {
      await api.toggleMachineAnomaly(mId, !currentDegrading);
      await load();
    } catch {
      // ignore
    } finally {
      setAnomalyLoading(false);
    }
  };

  const machines = data?.machines ?? [];
  const totalMachines = machines.length;
  const criticalCount = machines.filter((m: any) => m.health_score < 40).length;
  const warningCount = machines.filter((m: any) => m.health_score >= 40 && m.health_score < 70).length;
  const healthyCount = machines.filter((m: any) => m.health_score >= 70).length;
  const avgHealth = totalMachines > 0
    ? Math.round(machines.reduce((acc: number, m: any) => acc + (m.health_score || 0), 0) / totalMachines)
    : 100;

  // Extract distinct floors or line groups for filtering
  const distinctGroups = Array.from(
    new Set(
      machines.map((m: any) => {
        const parts = m.machine_id.split("-M");
        return parts[0];
      })
    )
  );

  // Filtered machine list
  const filteredMachines = machines.filter((m: any) => {
    const matchesSearch = m.machine_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFloor = floorFilter === "all" || m.machine_id.startsWith(floorFilter);
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "critical" && m.health_score < 40) ||
      (statusFilter === "warning" && m.health_score >= 40 && m.health_score < 70) ||
      (statusFilter === "healthy" && m.health_score >= 70);
    return matchesSearch && matchesFloor && matchesStatus;
  });

  const selectedMachineObj = machines.find((m: any) => m.machine_id === selectedMachine) || machines[0];
  const machineHistory = history.filter((h) => h.machine_id === selectedMachine);

  if (!mounted) {
    return (
      <div className="p-8 text-center text-xs text-[var(--color-text-muted)]">
        Loading Predictive Maintenance Studio...
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Predictive Maintenance — FactoryGPT ERP Portal</title>
      </Head>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
              Predictive Maintenance & Fleet Telemetry
            </h1>
            <p className="text-xs font-medium text-[var(--color-text-secondary)] mt-1">
              Multi-floor IoT vibration, thermal harmonics, and remaining useful life (RUL) forecasting for {factory?.name || "your plant"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              disabled={resetting}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-line)] text-xs font-bold text-[var(--color-text-primary)] hover:bg-[var(--color-line)] transition-all disabled:opacity-50 shadow-xs"
              title="Reset all sensor streams back to healthy baseline"
            >
              <RotateCcw size={13} className={resetting ? "animate-spin" : ""} />
              <span>{resetting ? "Resetting..." : "Reset All to Baseline"}</span>
            </button>

            <button
              onClick={runCheck}
              disabled={checking}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm"
            >
              <RefreshCw size={13} className={checking ? "animate-spin" : ""} />
              <span>{checking ? "Scanning..." : "Poll Sensor Streams"}</span>
            </button>
          </div>
        </div>

        {/* ── Fleet Health Metric Summary Cards ─────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card-base p-4">
            <span className="text-xs text-[var(--color-text-secondary)] font-semibold">Total Plant Assets</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-bold text-[var(--color-text-primary)]">{totalMachines}</span>
              <span className="text-[10px] text-[var(--color-text-muted)]">Active IoT nodes</span>
            </div>
          </div>

          <div className="card-base p-4">
            <span className="text-xs text-[var(--color-text-secondary)] font-semibold">Fleet Health Score</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-bold text-emerald-700">{avgHealth}%</span>
              <span className="badge badge-online text-[10px]">Optimal</span>
            </div>
          </div>

          <div className="card-base p-4">
            <span className="text-xs text-[var(--color-text-secondary)] font-semibold">At-Risk (Warning)</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-bold text-[var(--color-amber)]">{warningCount}</span>
              <span className="text-[10px] text-[var(--color-text-muted)]">Needs inspection</span>
            </div>
          </div>

          <div className="card-base p-4">
            <span className="text-xs text-[var(--color-text-secondary)] font-semibold">Critical Threshold</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-bold text-[var(--color-danger)]">{criticalCount}</span>
              <span className="text-[10px] text-[var(--color-danger)] font-bold">Action required</span>
            </div>
          </div>
        </div>

        {/* ── Real-Time Focus Inspector Chart ────────────────────────── */}
        <div className="card-base p-6 border-2 border-blue-100 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--color-line)] pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Activity size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                    Focused Telemetry Stream:
                  </span>
                  <span className="font-mono text-sm font-bold text-[var(--color-primary)]">
                    {selectedMachineObj?.machine_id || "Select Machine"}
                  </span>
                  <span
                    className="badge text-[10px] font-bold"
                    style={{
                      backgroundColor: `${getHealthColor(selectedMachineObj?.health_score || 100)}15`,
                      color: getHealthColor(selectedMachineObj?.health_score || 100),
                    }}
                  >
                    {getHealthLabel(selectedMachineObj?.health_score || 100)} ({selectedMachineObj?.health_score || 100}%)
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 font-medium">
                  Live 5s sampling &bull; Vibration: <strong>{selectedMachineObj?.vibration || 2.1} mm/s</strong> &bull; Temp: <strong>{selectedMachineObj?.temperature || 54}°C</strong> &bull; RPM: <strong>{selectedMachineObj?.rpm || 1500}</strong> &bull; Predicted RUL: <strong>{selectedMachineObj?.predicted_days_to_failure || 60} days</strong>
                </p>
              </div>
            </div>

            {/* Interactive Simulation Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggleAnomaly(selectedMachineObj?.machine_id, selectedMachineObj?.degrading || false)}
                disabled={anomalyLoading}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-xs ${
                  selectedMachineObj?.degrading
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100"
                    : "bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100"
                }`}
                title="Toggle simulated mechanical wear on this machine"
              >
                <Zap size={14} className={selectedMachineObj?.degrading ? "text-emerald-600" : "text-amber-600"} />
                <span>
                  {selectedMachineObj?.degrading ? "✓ Restore Healthy Baseline" : "⚡ Simulate Anomaly Degradation"}
                </span>
              </button>

              <Link
                href="/tickets"
                className="px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-line)] text-xs font-bold text-[var(--color-text-primary)] hover:bg-[var(--color-line)] transition-all"
              >
                Open Work Order &rarr;
              </Link>
            </div>
          </div>

          {/* Time Series Recharts Graph */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={machineHistory.length > 0 ? machineHistory : [{ time: "Now", vibration: 2.18, temperature: 54, health_score: 98 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#64748B" }} />
                <YAxis yAxisId="health" domain={[0, 100]} tick={{ fontSize: 10, fill: "#16A34A" }} label={{ value: "Health %", angle: -90, position: "insideLeft", fontSize: 10, fill: "#16A34A" }} />
                <YAxis yAxisId="vib" orientation="right" domain={[0, 8]} tick={{ fontSize: 10, fill: "#DC2626" }} label={{ value: "Vibration (mm/s)", angle: 90, position: "insideRight", fontSize: 10, fill: "#DC2626" }} />
                <Tooltip />
                <ReferenceLine yAxisId="vib" y={4.5} stroke="#DC2626" strokeDasharray="3 3" label={{ value: "Danger Limit (4.5mm/s)", fill: "#DC2626", fontSize: 9 }} />
                <Line yAxisId="health" type="monotone" dataKey="health_score" stroke="#16A34A" strokeWidth={2.5} name="Health Score (%)" dot={false} />
                <Line yAxisId="vib" type="monotone" dataKey="vibration" stroke="#DC2626" strokeWidth={2} name="Vibration (mm/s)" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Machine Grid Explorer & Filters ───────────────────────── */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-[var(--color-text-primary)]">
                Equipment Fleet ({filteredMachines.length} of {totalMachines}):
              </span>

              {/* Floor Filter */}
              <select
                value={floorFilter}
                onChange={(e) => setFloorFilter(e.target.value)}
                className="bg-white border border-[var(--color-line)] rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)] shadow-xs"
              >
                <option value="all">All Floors & Lines ({totalMachines})</option>
                {distinctGroups.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-[var(--color-line)] rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)] shadow-xs"
              >
                <option value="all">All Statuses ({totalMachines})</option>
                <option value="critical">🚨 Critical (&lt;40%) [{criticalCount}]</option>
                <option value="warning">⚠️ Warning (40-69%) [{warningCount}]</option>
                <option value="healthy">✅ Healthy (70%+) [{healthyCount}]</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                type="text"
                placeholder="Search machine ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[var(--color-line)] bg-white text-[var(--color-text-primary)] font-medium outline-none focus:border-[var(--color-primary)] shadow-xs"
              />
            </div>
          </div>

          {/* Machine Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMachines.map((m: any) => {
              const isSelected = m.machine_id === selectedMachine;
              return (
                <div
                  key={m.machine_id}
                  onClick={() => setSelectedMachine(m.machine_id)}
                  className={`card-base p-4 cursor-pointer transition-all ${
                    isSelected
                      ? "ring-2 ring-[var(--color-primary)] border-transparent bg-blue-50/20"
                      : "hover:border-[var(--color-primary)] hover:shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getHealthColor(m.health_score) }}
                      />
                      <span className="font-bold text-xs text-[var(--color-text-primary)] font-mono">
                        {m.machine_id}
                      </span>
                    </div>
                    <span
                      className="badge text-[10px] font-bold"
                      style={{
                        backgroundColor: `${getHealthColor(m.health_score)}15`,
                        color: getHealthColor(m.health_score),
                      }}
                    >
                      {getHealthLabel(m.health_score)} ({m.health_score}%)
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="progress-bar mb-3">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${m.health_score}%`,
                        backgroundColor: getHealthColor(m.health_score),
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                    <div className="p-2 rounded bg-[var(--color-surface)] text-center">
                      <span className="text-[10px] text-[var(--color-text-muted)] block">Vibration</span>
                      <span className="font-bold text-[var(--color-text-primary)] font-mono">{m.vibration}</span>
                    </div>
                    <div className="p-2 rounded bg-[var(--color-surface)] text-center">
                      <span className="text-[10px] text-[var(--color-text-muted)] block">Temp</span>
                      <span className="font-bold text-[var(--color-text-primary)] font-mono">{m.temperature}°C</span>
                    </div>
                    <div className="p-2 rounded bg-[var(--color-surface)] text-center">
                      <span className="text-[10px] text-[var(--color-text-muted)] block">RUL</span>
                      <span className="font-bold text-[var(--color-text-primary)]">{m.predicted_days_to_failure}d</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)] pt-2 border-t border-[var(--color-line)]">
                    <span className="font-medium">
                      {m.degrading ? "⚡ Anomaly active" : "Normal state"}
                    </span>
                    <span className="text-[var(--color-primary)] font-bold hover:underline">
                      {isSelected ? "● Focused" : "Click to focus →"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
