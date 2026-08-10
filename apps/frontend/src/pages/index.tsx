/** FactoryGPT — Main Dashboard Page */
import Head from "next/head";
import DashboardOverview from "@/components/dashboard/DashboardOverview";

export default function Home() {
  return (
    <>
      <Head>
        <title>Dashboard — FactoryGPT ERP Portal</title>
      </Head>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-[var(--color-text-primary)]">
              Live Overview
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Real-time production monitoring & system health
            </p>
          </div>
          <div className="text-xs text-[var(--color-text-muted)] font-mono">
            Auto-refreshing every 10s
          </div>
        </div>
        <DashboardOverview />
      </div>
    </>
  );
}
