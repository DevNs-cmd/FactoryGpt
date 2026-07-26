/** Owner: Abhi. Pulls the combined /integrations/overview payload. */
"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Card from "@/components/ui/Card";
import AlertBanner from "@/components/ui/AlertBanner";

export default function DashboardOverview() {
  const [overview, setOverview] = useState<any>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.getOverview().then(setOverview).catch(() => setError(true));
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card title="Vision Inspection" accent="cyan">
        {overview?.vision ? (
          <p className="text-2xl font-display">{overview.vision.status}</p>
        ) : (
          <AlertBanner message="vision-inspection offline" />
        )}
      </Card>
      <Card title="Predictive Maintenance" accent="amber">
        {overview?.maintenance ? (
          <p className="text-2xl font-display">{overview.maintenance.length} machines tracked</p>
        ) : (
          <AlertBanner message="predictive-maintenance offline" />
        )}
      </Card>
      <Card title="Root Cause Analysis" accent="danger">
        {overview?.root_cause ? (
          <p className="text-sm text-gray-300">{overview.root_cause.worst_line ?? "no data yet"}</p>
        ) : (
          <AlertBanner message="root-cause-analysis offline" />
        )}
      </Card>
      {error && <AlertBanner level="critical" message="backend-core unreachable — check it's running" />}
    </div>
  );
}
