/** Owner: Abhi. Reusable shell every module's dashboard widget sits inside. */
export default function Card({
  title,
  children,
  accent = "cyan",
}: {
  title: string;
  children: React.ReactNode;
  accent?: "cyan" | "amber" | "danger";
}) {
  const accentColor = { cyan: "#3dc7c7", amber: "#e8a33d", danger: "#e0563f" }[accent];
  return (
    <div className="bg-panel border border-line rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
        <h3 className="font-display text-sm uppercase tracking-wide text-gray-300">{title}</h3>
      </div>
      {children}
    </div>
  );
}
