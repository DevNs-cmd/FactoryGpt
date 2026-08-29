/** Line-wise production efficiency bar chart (Recharts). */
"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { LineSummary } from "@/lib/api";

interface EfficiencyChartProps {
  data: LineSummary[];
}

function getBarColor(efficiency: number) {
  if (efficiency >= 90) return "#16A34A";
  if (efficiency >= 80) return "#D97706";
  return "#DC2626";
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-[var(--color-line)] rounded-lg px-3 py-2 text-xs shadow-md">
      <p className="text-[var(--color-text-primary)] font-semibold mb-1">{d.line_id}</p>
      <p className="text-[var(--color-text-secondary)]">
        Produced: <span className="text-[var(--color-text-primary)] font-medium">{d.count.toLocaleString()}</span> / {d.target.toLocaleString()}
      </p>
      <p className="text-[var(--color-text-secondary)]">
        Efficiency: <span style={{ color: getBarColor(d.efficiency_pct) }} className="font-medium">{d.efficiency_pct}%</span>
      </p>
    </div>
  );
}

import { useState, useEffect } from "react";

export default function EfficiencyChart({ data }: EfficiencyChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-[240px] w-full animate-shimmer rounded-lg" />;
  }

  if (!data || !data.length) {
    return (
      <div className="flex items-center justify-center h-[240px] text-[var(--color-text-muted)] text-sm">
        No production data available
      </div>
    );
  }

  return (
    <div className="w-full h-[240px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="line_id"
            tick={{ fontSize: 11, fill: "#64748B" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: "#64748B" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
          <Bar dataKey="efficiency_pct" radius={[4, 4, 0, 0]} maxBarSize={60}>
            {data.map((entry, i) => (
              <Cell key={i} fill={getBarColor(entry.efficiency_pct)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
