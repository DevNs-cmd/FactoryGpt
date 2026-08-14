/** Data table with sorting indicators, row hover, and empty state. */
import { ArrowUpDown } from "lucide-react";

interface TableProps {
  columns: string[];
  rows: (string | number)[][];
  emptyMessage?: string;
}

export default function Table({
  columns,
  rows,
  emptyMessage = "No data available",
}: TableProps) {
  if (rows.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--color-text-muted)] text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[var(--color-text-muted)] border-b border-[var(--color-line)]">
            {columns.map((c) => (
              <th
                key={c}
                className="pb-3 pr-4 font-medium text-xs"
              >
                <span className="inline-flex items-center gap-1">
                  {c}
                  <ArrowUpDown size={10} className="opacity-30" />
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-[var(--color-line)] border-opacity-50 hover:bg-[var(--color-surface)] transition-colors"
            >
              {row.map((cell, j) => (
                <td
                  key={j}
                  className="py-2.5 pr-4 text-[var(--color-text-secondary)]"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
