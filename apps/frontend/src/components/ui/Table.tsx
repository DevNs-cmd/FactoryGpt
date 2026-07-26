/** Owner: Abhi. Generic data table reused across production/downtime/report views. */
export default function Table({
  columns,
  rows,
}: {
  columns: string[];
  rows: (string | number)[][];
}) {
  return (
    <table className="w-full text-sm font-mono">
      <thead>
        <tr className="text-left text-gray-400 border-b border-line">
          {columns.map((c) => (
            <th key={c} className="pb-2 pr-4 font-normal">{c}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-b border-line/50">
            {row.map((cell, j) => (
              <td key={j} className="py-1.5 pr-4 text-gray-200">{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
