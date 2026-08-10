/** FactoryGPT — AI Vision Inspection Page */
"use client";
import Head from "next/head";
import { useState, useEffect } from "react";
import { api, type Ticket, type OverviewData } from "@/lib/api";
import { Eye, AlertTriangle, Clock, Camera, ShieldCheck } from "lucide-react";

export default function VisionPage() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [defectTickets, setDefectTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getOverview(),
      api.getTickets({ source_module: "vision", limit: 20 }),
    ])
      .then(([o, t]) => {
        setOverview(o);
        setDefectTickets(t);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const visionOnline = overview?.vision?.status === "ok";
  const openDefects = defectTickets.filter((t) => t.status === "open").length;
  const closedDefects = defectTickets.filter((t) => t.status === "closed").length;

  return (
    <>
      <Head>
        <title>Vision AI — FactoryGPT ERP Portal</title>
      </Head>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-[var(--color-text-primary)]">
              AI Vision Inspection
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Automated defect detection powered by computer vision
            </p>
          </div>
          <span className={`badge ${visionOnline ? "badge-online" : "badge-offline"}`}>
            {visionOnline ? "Service Online" : "Service Offline"}
          </span>
        </div>

        {/* Status + Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 stagger-children">
          <div className="card-base p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-cyan-glow)] flex items-center justify-center">
                <Camera size={16} className="text-[var(--color-cyan)]" />
              </div>
              <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-medium">
                Service Status
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`status-dot ${visionOnline ? "status-dot-online" : "status-dot-offline"}`} />
              <span className="text-lg font-display font-bold" style={{ color: visionOnline ? "var(--color-success)" : "var(--color-text-muted)" }}>
                {visionOnline ? "Active" : "Offline"}
              </span>
            </div>
            <p className="text-[11px] text-[var(--color-text-muted)] font-mono mt-2">
              {visionOnline ? "Inspecting production line images" : "Start vision-inspection service on port 8001"}
            </p>
          </div>

          <div className="card-base p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-danger-glow)] flex items-center justify-center">
                <AlertTriangle size={16} className="text-[var(--color-danger)]" />
              </div>
              <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-medium">
                Open Defects
              </span>
            </div>
            <p className="text-2xl font-display font-bold text-[var(--color-danger)]">{openDefects}</p>
            <p className="text-[11px] text-[var(--color-text-muted)] font-mono mt-1">
              Awaiting resolution
            </p>
          </div>

          <div className="card-base p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-success-glow)] flex items-center justify-center">
                <ShieldCheck size={16} className="text-[var(--color-success)]" />
              </div>
              <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-medium">
                Resolved
              </span>
            </div>
            <p className="text-2xl font-display font-bold text-[var(--color-success)]">{closedDefects}</p>
            <p className="text-[11px] text-[var(--color-text-muted)] font-mono mt-1">
              Defects closed
            </p>
          </div>
        </div>

        {/* Defect Detection Log */}
        <div className="card-base p-5">
          <h3 className="text-sm font-display font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-4">
            Detection Log
          </h3>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-shimmer rounded-lg" />
              ))}
            </div>
          ) : defectTickets.length === 0 ? (
            <div className="text-center py-8">
              <Eye size={32} className="mx-auto mb-3 text-[var(--color-text-muted)]" />
              <p className="text-sm text-[var(--color-text-muted)] font-mono">
                No vision defect events recorded yet
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {defectTickets.map((t) => (
                <div
                  key={t.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-[var(--color-surface)] hover:bg-[var(--color-panel-hover)] transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-[var(--color-danger-glow)] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Eye size={14} className="text-[var(--color-danger)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-[var(--color-text-muted)]">#{t.id}</span>
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
                    <span className="text-[10px] text-[var(--color-text-muted)] font-mono flex items-center gap-1 mt-1">
                      <Clock size={10} />
                      {new Date(t.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
