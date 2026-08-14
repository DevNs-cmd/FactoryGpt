/** Production table with progress bars and color-coded efficiency. */
"use client";
import { useEffect, useState } from "react";
import { api, type ProductionEvent } from "@/lib/api";

export default function ProductionTable() {
  const [rows, setRows] = useState<ProductionEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = () =>
      api
        .getLiveProduction(30)
        .then((data) => {
          setRows(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 animate-shimmer rounded-lg" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--color-text-muted)] text-sm">
        No production data — run POST /production/seed to populate
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[var(--color-text-muted)] border-b border-[var(--color-line)]">
            <th className="pb-3 pr-4 font-medium text-xs">Line</th>
            <th className="pb-3 pr-4 font-medium text-xs">Shift</th>
            <th className="pb-3 pr-4 font-medium text-xs">Progress</th>
            <th className="pb-3 pr-4 font-medium text-xs text-right">Count / Target</th>
            <th className="pb-3 font-medium text-xs text-right">Time</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const pct = r.target > 0 ? Math.min(100, Math.round((r.count / r.target) * 100)) : 0;
            const barColor =
              pct >= 90
                ? "var(--color-success)"
                : pct >= 80
                ? "var(--color-amber)"
                : "var(--color-danger)";

            return (
              <tr
                key={i}
                className="border-b border-[var(--color-line)] border-opacity-50 hover:bg-[var(--color-surface)] transition-colors"
              >
                <td className="py-3 pr-4">
                  <span className="font-medium text-[var(--color-text-primary)]">
                    {r.line_id}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <span className="badge badge-offline text-[9px]">Shift {r.shift}</span>
                </td>
                <td className="py-3 pr-4 w-48">
                  <div className="flex items-center gap-2">
                    <div className="progress-bar flex-1">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${pct}%`, background: barColor }}
                      />
                    </div>
                    <span
                      className="text-xs font-medium"
                      style={{ color: barColor }}
                    >
                      {pct}%
                    </span>
                  </div>
                </td>
                <td className="py-3 pr-4 text-right text-[var(--color-text-secondary)]">
                  <span className="text-[var(--color-text-primary)]">{r.count}</span> / {r.target}
                </td>
                <td className="py-3 text-right text-xs text-[var(--color-text-muted)]">
                  {new Date(r.timestamp).toLocaleTimeString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
