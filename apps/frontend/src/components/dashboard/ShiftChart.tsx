/** Shift comparison grouped bar chart (Recharts). */
"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { ShiftSummary } from "@/lib/api";

interface ShiftChartProps {
  data: ShiftSummary[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[var(--color-line)] rounded-lg px-3 py-2 text-xs shadow-md">
      <p className="text-[var(--color-text-primary)] font-semibold mb-1">Shift {label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-[var(--color-text-secondary)]">
          {p.name}: <span style={{ color: p.color }} className="font-medium">{p.value.toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
}

import { useState, useEffect } from "react";

export default function ShiftChart({ data }: ShiftChartProps) {
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
        No shift data available
      </div>
    );
  }

  return (
    <div className="w-full h-[240px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="shift"
            tick={{ fontSize: 11, fill: "#64748B" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `Shift ${v}`}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#64748B" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
          <Legend
            wrapperStyle={{ fontSize: "11px", fontFamily: "Inter, sans-serif" }}
            iconType="square"
            iconSize={8}
          />
          <Bar
            dataKey="count"
            name="Produced"
            fill="#2563EB"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
          <Bar
            dataKey="target"
            name="Target"
            fill="#CBD5E1"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
