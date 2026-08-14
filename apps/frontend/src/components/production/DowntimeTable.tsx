/** Downtime event log table. */
"use client";
import { useEffect, useState } from "react";
import { api, type DowntimeEvent } from "@/lib/api";
import { Clock, AlertTriangle } from "lucide-react";

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export default function DowntimeTable() {
  const [rows, setRows] = useState<DowntimeEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getDowntime(30)
      .then(setRows)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 animate-shimmer rounded-lg" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--color-text-muted)] text-sm">
        No downtime events recorded
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[var(--color-text-muted)] border-b border-[var(--color-line)]">
            <th className="pb-3 pr-4 font-medium text-xs">Machine</th>
            <th className="pb-3 pr-4 font-medium text-xs">Line</th>
            <th className="pb-3 pr-4 font-medium text-xs">Duration</th>
            <th className="pb-3 pr-4 font-medium text-xs">Reason</th>
            <th className="pb-3 font-medium text-xs text-right">Time</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const isLong = r.duration_seconds > 600;
            return (
              <tr
                key={i}
                className="border-b border-[var(--color-line)] border-opacity-50 hover:bg-[var(--color-surface)] transition-colors"
              >
                <td className="py-3 pr-4">
                  <span className="font-medium text-[var(--color-text-primary)]">
                    {r.machine_id}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <span className="text-[var(--color-text-secondary)]">{r.line_id}</span>
                </td>
                <td className="py-3 pr-4">
                  <span
                    className="inline-flex items-center gap-1 text-xs"
                    style={{ color: isLong ? "var(--color-danger)" : "var(--color-amber)" }}
                  >
                    {isLong && <AlertTriangle size={12} />}
                    <Clock size={12} />
                    {formatDuration(r.duration_seconds)}
                  </span>
                </td>
                <td className="py-3 pr-4 max-w-xs">
                  <span className="text-[var(--color-text-secondary)] text-xs truncate block">
                    {r.reason}
                  </span>
                </td>
                <td className="py-3 text-right text-xs text-[var(--color-text-muted)]">
                  {new Date(r.timestamp).toLocaleString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
