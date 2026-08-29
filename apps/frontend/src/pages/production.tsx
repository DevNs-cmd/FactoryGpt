/** FactoryGPT — Production Monitoring Page with Built-In CSV Importer */
"use client";
import Head from "next/head";
import { useState, useEffect, useRef } from "react";
import { api, type ProductionSummary } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  Factory,
  Clock,
  BarChart3,
  Gauge,
  Plus,
  X,
  Check,
  AlertCircle,
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  FileText,
  Layers,
} from "lucide-react";
import ProductionTable from "@/components/production/ProductionTable";
import DowntimeTable from "@/components/production/DowntimeTable";
import KPICard from "@/components/dashboard/KPICard";

type Tab = "live" | "downtime" | "csv_import";

export default function Production() {
  const { factory } = useAuth();
  const [tab, setTab] = useState<Tab>("live");
  const [summary, setSummary] = useState<ProductionSummary | null>(null);

  // Manual logging modal
  const [showLogModal, setShowLogModal] = useState(false);
  const [logType, setLogType] = useState<"production" | "downtime">("production");

  // CSV Import State
  const [csvFile, setCSVFile] = useState<File | null>(null);
  const [clearExistingCSV, setClearExistingCSV] = useState(false);
  const [csvSubmitting, setCSVSubmitting] = useState(false);
  const [csvResult, setCSVResult] = useState<string | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Production Form
  const [lineId, setLineId] = useState("");
  const [count, setCount] = useState<number>(100);
  const [target, setTarget] = useState<number>(120);
  const [shift, setShift] = useState("A");

  // Downtime Form
  const [machineId, setMachineId] = useState("");
  const [durationSeconds, setDurationSeconds] = useState<number>(300);
  const [reason, setReason] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const availableLines = factory?.lines?.map((l) => l.name) || ["Line-1", "Line-2", "Line-3"];

  useEffect(() => {
    if (availableLines.length > 0 && !lineId) {
      setLineId(availableLines[0]);
      setMachineId(`${availableLines[0]}-M1`);
    }
  }, [availableLines, lineId]);

  const loadSummary = () => {
    api.getProductionSummary().then(setSummary).catch(() => {});
  };

  useEffect(() => {
    loadSummary();
    const interval = setInterval(loadSummary, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      if (logType === "production") {
        await api.logProduction({
          line_id: lineId || availableLines[0],
          count: Number(count),
          target: Number(target),
          shift,
        });
        setFeedback("Production record logged successfully!");
      } else {
        await api.logDowntime({
          line_id: lineId || availableLines[0],
          machine_id: machineId || `${lineId || availableLines[0]}-M1`,
          duration_seconds: Number(durationSeconds),
          reason: reason || "Unplanned equipment check",
        });
        setFeedback("Downtime event logged successfully!");
      }
      loadSummary();
      setTimeout(() => {
        setShowLogModal(false);
        setFeedback(null);
      }, 1200);
    } catch (err: any) {
      setFeedback(`Error: ${err?.message || "Failed to log event"}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCSVUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;

    setCSVSubmitting(true);
    setCSVResult(null);
    try {
      const res = await api.importProductionCSV(csvFile, clearExistingCSV);
      setCSVResult(res.message || "CSV imported successfully!");
      loadSummary();
      setTimeout(() => {
        setCSVFile(null);
      }, 2000);
    } catch (err: any) {
      setCSVResult(`Error: ${err?.message || "Failed to parse CSV file."}`);
    } finally {
      setCSVSubmitting(false);
    }
  };

  const downloadSampleCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8,line_id,count,target,shift\n" +
      "Floor-1-PressShop-Line1,1420,1500,A\n" +
      "Floor-1-PressShop-Line1,1390,1500,B\n" +
      "Floor-1-PressShop-Line1,1340,1500,C\n" +
      "Floor-1-PressShop-Line2,1320,1400,A\n" +
      "Floor-1-PressShop-Line2,1290,1400,B\n" +
      "Floor-2-RoboticWeld-Line1,820,850,A\n" +
      "Floor-2-RoboticWeld-Line1,810,850,B\n" +
      "Floor-2-RoboticWeld-Line2,880,900,A\n" +
      "Floor-3-BatteryPack-Line1,580,600,A\n" +
      "Floor-3-BatteryPack-Line1,570,600,B\n" +
      "Floor-3-BatteryPack-Line2,630,650,A\n" +
      "Floor-3-InverterAssy-Line3,1060,1100,A\n" +
      "Floor-4-PaintInspection-Line1,1180,1200,A\n" +
      "Floor-4-FinalAssembly-Line2,920,950,A\n" +
      "Floor-4-Packaging-Line3,2150,2200,A\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "my_multistory_plant_production.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Head>
        <title>Production & CSV Importer — FactoryGPT ERP Portal</title>
      </Head>
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
              Production Monitoring & Telemetry
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Live shop-floor output, OEE efficiency analytics, and custom factory data ingestion for {factory?.name || "your plant"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab("csv_import")}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--color-primary-light)] border border-[var(--color-primary-border)] text-xs font-bold text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-all shadow-xs"
              title="Bulk import custom factory telemetry via CSV spreadsheet"
            >
              <FileSpreadsheet size={15} />
              <span>Upload Factory CSV</span>
            </button>

            <button
              onClick={() => {
                setLogType("production");
                setShowLogModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--color-primary)] text-white text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm"
            >
              <Plus size={15} />
              <span>Log Output</span>
            </button>
          </div>
        </div>

        {/* Summary KPIs */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KPICard
              label="Total Produced"
              value={summary.total_count.toLocaleString()}
              icon={<Factory size={20} />}
              accent="cyan"
              subtitle={`Target: ${summary.total_target.toLocaleString()}`}
            />
            <KPICard
              label="Overall OEE Efficiency"
              value={`${summary.overall_efficiency_pct}%`}
              icon={<Gauge size={20} />}
              accent={summary.overall_efficiency_pct >= 85 ? "success" : "amber"}
              trend={summary.overall_efficiency_pct >= 85 ? "up" : "down"}
            />
            <KPICard
              label="Active Lines"
              value={summary.by_line.length}
              icon={<BarChart3 size={20} />}
              accent="cyan"
            />
            <KPICard
              label="Shifts Running"
              value={summary.by_shift.length}
              icon={<Clock size={20} />}
              accent="amber"
            />
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 mb-4 border-b border-[var(--color-line)]">
          <button
            onClick={() => setTab("live")}
            className={`px-4 py-2.5 text-sm font-medium transition-all duration-150 border-b-2 -mb-px ${
              tab === "live"
                ? "border-[var(--color-primary)] text-[var(--color-primary)] font-bold"
                : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            Live Production Stream
          </button>
          <button
            onClick={() => setTab("downtime")}
            className={`px-4 py-2.5 text-sm font-medium transition-all duration-150 border-b-2 -mb-px ${
              tab === "downtime"
                ? "border-[var(--color-primary)] text-[var(--color-primary)] font-bold"
                : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            Downtime Incidents Log
          </button>
          <button
            onClick={() => setTab("csv_import")}
            className={`px-4 py-2.5 text-sm font-medium transition-all duration-150 border-b-2 -mb-px flex items-center gap-1.5 ${
              tab === "csv_import"
                ? "border-[var(--color-primary)] text-[var(--color-primary)] font-bold"
                : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            <FileSpreadsheet size={15} />
            <span>Custom Factory CSV Importer</span>
          </button>
        </div>

        {/* Content Tabs */}
        {tab === "live" && (
          <div className="card-base p-5">
            <ProductionTable />
          </div>
        )}

        {tab === "downtime" && (
          <div className="card-base p-5">
            <DowntimeTable />
          </div>
        )}

        {tab === "csv_import" && (
          <div className="card-base p-6 space-y-6 animate-fade-in">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--color-line)] pb-4">
              <div>
                <h2 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                  <FileSpreadsheet size={18} className="text-[var(--color-primary)]" />
                  <span>Ingest Your Factory's Real Production Spreadsheet</span>
                </h2>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  Upload custom production telemetry from SAP, Oracle, Excel, or shop-floor SCADA CSV logs. All OEE KPIs and shift charts will recalculate immediately.
                </p>
              </div>

              <button
                type="button"
                onClick={downloadSampleCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-line)] text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-line)] transition-all shadow-xs"
              >
                <Download size={13} className="text-[var(--color-primary)]" />
                <span>Download Sample CSV Template</span>
              </button>
            </div>

            {csvResult && (
              <div
                className={`p-4 rounded-xl text-xs font-medium flex items-center gap-2.5 animate-scale-up ${
                  csvResult.startsWith("Error")
                    ? "bg-[var(--color-danger-light)] text-[var(--color-danger)] border border-[var(--color-danger-border)]"
                    : "bg-[var(--color-success-light)] text-[var(--color-success)] border border-[var(--color-success-border)]"
                }`}
              >
                {csvResult.startsWith("Error") ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                <span>{csvResult}</span>
              </div>
            )}

            <form onSubmit={handleCSVUpload} className="space-y-4">
              <input
                type="file"
                ref={csvInputRef}
                onChange={(e) => setCSVFile(e.target.files?.[0] || null)}
                accept=".csv,.txt"
                className="hidden"
              />

              <div
                onClick={() => csvInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  csvFile
                    ? "border-[var(--color-primary)] bg-[var(--color-primary-light)]"
                    : "border-[var(--color-line)] hover:border-[var(--color-primary)] bg-[var(--color-surface)]"
                }`}
              >
                <Upload size={32} className="mx-auto mb-3 text-[var(--color-primary)]" />
                <p className="text-sm font-bold text-[var(--color-text-primary)]">
                  {csvFile ? csvFile.name : "Click to select or drag & drop a CSV file here"}
                </p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  Expected schema: <code className="font-mono bg-white px-1.5 py-0.5 rounded border">line_id, count, target, shift</code>
                </p>
                <p className="text-[11px] text-[var(--color-primary)] font-medium mt-2">
                  (You can also use the pre-built <strong className="underline">my_plant_production.csv</strong> in your project folder)
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[var(--color-text-secondary)]">
                  <input
                    type="checkbox"
                    checked={clearExistingCSV}
                    onChange={(e) => setClearExistingCSV(e.target.checked)}
                    className="rounded border-[var(--color-line)] text-[var(--color-primary)] focus:ring-0"
                  />
                  <span>Clear previous production history before import</span>
                </label>

                <button
                  type="submit"
                  disabled={csvSubmitting || !csvFile}
                  className="px-6 py-2.5 rounded-lg bg-[var(--color-primary)] text-white text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm flex items-center gap-2"
                >
                  {csvSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Ingesting Records...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={14} />
                      <span>Process & Recalculate OEE</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Manual Data Entry Modal ───────────────────────────────── */}
        {showLogModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-[var(--color-line)] animate-scale-up">
              <div className="flex items-center justify-between mb-4 border-b border-[var(--color-line)] pb-3">
                <h3 className="font-bold text-base text-[var(--color-text-primary)]">
                  {logType === "production" ? "Log Live Production Output" : "Log Downtime Event"}
                </h3>
                <button
                  onClick={() => setShowLogModal(false)}
                  className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] rounded"
                >
                  <X size={18} />
                </button>
              </div>

              {feedback && (
                <div
                  className={`mb-4 p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                    feedback.startsWith("Error")
                      ? "bg-[var(--color-danger-light)] text-[var(--color-danger)]"
                      : "bg-[var(--color-success-light)] text-[var(--color-success)]"
                  }`}
                >
                  {feedback.startsWith("Error") ? <AlertCircle size={14} /> : <Check size={14} />}
                  <span>{feedback}</span>
                </div>
              )}

              <form onSubmit={handleManualSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                    Production Line
                  </label>
                  <select
                    value={lineId}
                    onChange={(e) => {
                      setLineId(e.target.value);
                      setMachineId(`${e.target.value}-M1`);
                    }}
                    className="w-full px-3 py-2 bg-white border border-[var(--color-line)] rounded-lg text-xs outline-none focus:border-[var(--color-primary)]"
                  >
                    {availableLines.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>

                {logType === "production" ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                          Actual Units
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={count}
                          onChange={(e) => setCount(parseInt(e.target.value) || 0)}
                          required
                          className="w-full px-3 py-2 bg-white border border-[var(--color-line)] rounded-lg text-xs outline-none focus:border-[var(--color-primary)]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                          Target Units
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={target}
                          onChange={(e) => setTarget(parseInt(e.target.value) || 0)}
                          required
                          className="w-full px-3 py-2 bg-white border border-[var(--color-line)] rounded-lg text-xs outline-none focus:border-[var(--color-primary)]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                        Shift
                      </label>
                      <div className="flex gap-2">
                        {["A", "B", "C"].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setShift(s)}
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                              shift === s
                                ? "bg-[var(--color-primary-light)] border-[var(--color-primary)] text-[var(--color-primary)]"
                                : "bg-white border-[var(--color-line)] text-[var(--color-text-secondary)]"
                            }`}
                          >
                            Shift {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                          Machine ID
                        </label>
                        <input
                          type="text"
                          value={machineId}
                          onChange={(e) => setMachineId(e.target.value)}
                          placeholder="e.g. Line-1-M2"
                          required
                          className="w-full px-3 py-2 bg-white border border-[var(--color-line)] rounded-lg text-xs outline-none focus:border-[var(--color-primary)]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                          Duration (Sec)
                        </label>
                        <input
                          type="number"
                          min={10}
                          step={30}
                          value={durationSeconds}
                          onChange={(e) => setDurationSeconds(parseInt(e.target.value) || 60)}
                          required
                          className="w-full px-3 py-2 bg-white border border-[var(--color-line)] rounded-lg text-xs outline-none focus:border-[var(--color-primary)]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                        Failure / Downtime Reason
                      </label>
                      <input
                        type="text"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g. Pneumatic pressure drop on jig #2"
                        required
                        className="w-full px-3 py-2 bg-white border border-[var(--color-line)] rounded-lg text-xs outline-none focus:border-[var(--color-primary)]"
                      />
                    </div>
                  </>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowLogModal(false)}
                    className="flex-1 py-2 rounded-lg bg-[var(--color-surface)] text-[var(--color-text-secondary)] text-xs font-semibold hover:bg-[var(--color-line)] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2 rounded-lg bg-[var(--color-primary)] text-white text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {submitting ? "Submitting..." : "Submit Record"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
