/** Reusable Card with title, accent dot, and loading state. */
import { Loader2 } from "lucide-react";

interface CardProps {
  title?: string;
  children: React.ReactNode;
  accent?: "cyan" | "amber" | "danger" | "success";
  loading?: boolean;
  className?: string;
}

const ACCENT_MAP = {
  cyan: "#2563EB",
  amber: "#D97706",
  danger: "#DC2626",
  success: "#16A34A",
};

export default function Card({
  title,
  children,
  accent = "cyan",
  loading = false,
  className = "",
}: CardProps) {
  return (
    <div className={`card-base p-5 ${className}`}>
      {title && (
        <div className="flex items-center gap-2 mb-4">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: ACCENT_MAP[accent] }}
          />
          <h3 className="text-sm font-semibold text-[var(--color-text-secondary)]">
            {title}
          </h3>
        </div>
      )}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={20} className="animate-spin text-[var(--color-text-muted)]" />
        </div>
      ) : (
        children
      )}
    </div>
  );
}
