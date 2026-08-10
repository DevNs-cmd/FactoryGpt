/** Reusable KPI stat card with icon, value, label, trend, and accent glow. */
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KPICardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent: "cyan" | "amber" | "danger" | "success";
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  delay?: number;
}

const ACCENT_MAP = {
  cyan: { bg: "var(--color-cyan-glow)", border: "rgba(61,199,199,0.25)", color: "var(--color-cyan)" },
  amber: { bg: "var(--color-amber-glow)", border: "rgba(232,163,61,0.25)", color: "var(--color-amber)" },
  danger: { bg: "var(--color-danger-glow)", border: "rgba(224,86,63,0.25)", color: "var(--color-danger)" },
  success: { bg: "var(--color-success-glow)", border: "rgba(52,211,153,0.25)", color: "var(--color-success)" },
};

export default function KPICard({ label, value, icon, accent, subtitle, trend, delay = 0 }: KPICardProps) {
  const a = ACCENT_MAP[accent];

  return (
    <div
      className="card-base p-5 animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: a.bg, border: `1px solid ${a.border}` }}
        >
          <span style={{ color: a.color }}>{icon}</span>
        </div>
        {trend && (
          <span
            className={`flex items-center gap-1 text-xs font-mono ${
              trend === "up"
                ? "text-success"
                : trend === "down"
                ? "text-danger"
                : "text-[var(--color-text-muted)]"
            }`}
          >
            {trend === "up" && <TrendingUp size={14} />}
            {trend === "down" && <TrendingDown size={14} />}
            {trend === "neutral" && <Minus size={14} />}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold font-display animate-count-up" style={{ color: a.color }}>
        {value}
      </p>
      <p className="text-xs text-[var(--color-text-secondary)] mt-1 uppercase tracking-wider font-medium">
        {label}
      </p>
      {subtitle && (
        <p className="text-[11px] text-[var(--color-text-muted)] font-mono mt-1">{subtitle}</p>
      )}
    </div>
  );
}
