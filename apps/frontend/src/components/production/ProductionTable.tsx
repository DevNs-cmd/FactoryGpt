/** Owner: Abhi. */
"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Table from "@/components/ui/Table";

export default function ProductionTable() {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    const load = () => api.getLiveProduction().then(setRows).catch(() => {});
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Table
      columns={["Line", "Count", "Target", "Shift", "Time"]}
      rows={rows.map((r) => [
        r.line_id,
        r.count,
        r.target,
        r.shift,
        new Date(r.timestamp).toLocaleTimeString(),
      ])}
    />
  );
}
