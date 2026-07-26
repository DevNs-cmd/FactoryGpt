/** Owner: Abhi. Used by alerts/maintenance/safety panels. */
export default function AlertBanner({
  message,
  level = "warning",
}: {
  message: string;
  level?: "warning" | "critical";
}) {
  const color = level === "critical" ? "border-danger text-danger" : "border-amber text-amber";
  return (
    <div className={`border-l-2 ${color} bg-black/20 px-3 py-2 text-sm font-mono`}>
      {message}
    </div>
  );
}
