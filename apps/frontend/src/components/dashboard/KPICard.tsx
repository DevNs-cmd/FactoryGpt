/** Reusable KPI stat card with icon, value, label, trend, and accent. */
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
  cyan: { bg: "var(--color-primary-light)", border: "var(--color-primary-border)", color: "var(--color-primary)" },
  amber: { bg: "var(--color-amber-light)", border: "var(--color-amber-border)", color: "var(--color-amber)" },
  danger: { bg: "var(--color-danger-light)", border: "var(--color-danger-border)", color: "var(--color-danger)" },
  success: { bg: "var(--color-success-light)", border: "var(--color-success-border)", color: "var(--color-success)" },
};

export default function KPICard({ label, value, icon, accent, subtitle, trend, delay = 0 }: KPICardProps) {
  const a = ACCENT_MAP[accent];

  return (
    <div className="card-base p-5">
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: a.bg }}
        >
          <span style={{ color: a.color }}>{icon}</span>
        </div>
        {trend && (
          <span
            className={`flex items-center gap-1 text-xs ${
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
      <p className="text-2xl font-semibold text-[var(--color-text-primary)]">
        {value}
      </p>
      <p className="text-xs text-[var(--color-text-secondary)] mt-1 font-medium">
        {label}
      </p>
      {subtitle && (
        <p className="text-[11px] text-[var(--color-text-muted)] mt-1">{subtitle}</p>
      )}
    </div>
  );
}
