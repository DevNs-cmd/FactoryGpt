/** FactoryGPT — Production Monitoring Page */
"use client";
import Head from "next/head";
import { useState, useEffect } from "react";
import { api, type ProductionSummary } from "@/lib/api";
import { Factory, Clock, BarChart3, Gauge } from "lucide-react";
import ProductionTable from "@/components/production/ProductionTable";
import DowntimeTable from "@/components/production/DowntimeTable";
import KPICard from "@/components/dashboard/KPICard";

type Tab = "live" | "downtime";

export default function Production() {
  const [tab, setTab] = useState<Tab>("live");
  const [summary, setSummary] = useState<ProductionSummary | null>(null);

  useEffect(() => {
    api.getProductionSummary().then(setSummary).catch(() => {});
  }, []);

  return (
    <>
      <Head>
        <title>Production — FactoryGPT ERP Portal</title>
      </Head>
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            Production Monitoring
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Live production counts, efficiency metrics, and downtime tracking
          </p>
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
              label="Efficiency"
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
          {(["live", "downtime"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium transition-all duration-150 border-b-2 -mb-px ${
                tab === t
                  ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                  : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              {t === "live" ? "Live Production" : "Downtime Log"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="card-base p-5" key={tab}>
          {tab === "live" ? <ProductionTable /> : <DowntimeTable />}
        </div>
      </div>
    </>
  );
}
