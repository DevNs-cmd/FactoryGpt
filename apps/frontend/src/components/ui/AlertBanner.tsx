/** AlertBanner with multiple levels and dismiss option. */
import { AlertTriangle, Info, CheckCircle, XCircle, X } from "lucide-react";
import { useState } from "react";

interface AlertBannerProps {
  message: string;
  level?: "info" | "warning" | "critical" | "success";
  dismissible?: boolean;
}

const LEVEL_CONFIG = {
  info: {
    border: "var(--color-primary)",
    bg: "var(--color-primary-light)",
    text: "var(--color-primary)",
    icon: <Info size={14} />,
  },
  warning: {
    border: "var(--color-amber)",
    bg: "var(--color-amber-light)",
    text: "var(--color-amber)",
    icon: <AlertTriangle size={14} />,
  },
  critical: {
    border: "var(--color-danger)",
    bg: "var(--color-danger-light)",
    text: "var(--color-danger)",
    icon: <XCircle size={14} />,
  },
  success: {
    border: "var(--color-success)",
    bg: "var(--color-success-light)",
    text: "var(--color-success)",
    icon: <CheckCircle size={14} />,
  },
};

export default function AlertBanner({
  message,
  level = "warning",
  dismissible = false,
}: AlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const config = LEVEL_CONFIG[level];

  return (
    <div
      className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm animate-fade-in"
      style={{
        borderLeft: `3px solid ${config.border}`,
        background: config.bg,
        color: config.text,
      }}
    >
      {config.icon}
      <span className="flex-1">{message}</span>
      {dismissible && (
        <button
          onClick={() => setDismissed(true)}
          className="hover:opacity-70 transition-opacity"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
