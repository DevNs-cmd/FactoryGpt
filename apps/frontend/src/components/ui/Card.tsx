/** Enhanced reusable Card with glassmorphism, hover effects, and loading state. */
import { Loader2 } from "lucide-react";

interface CardProps {
  title?: string;
  children: React.ReactNode;
  accent?: "cyan" | "amber" | "danger" | "success";
  loading?: boolean;
  className?: string;
}

const ACCENT_MAP = {
  cyan: "#3dc7c7",
  amber: "#e8a33d",
  danger: "#e0563f",
  success: "#34d399",
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
          <h3 className="text-sm font-display font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
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
