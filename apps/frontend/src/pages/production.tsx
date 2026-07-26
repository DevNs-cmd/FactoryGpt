/** Owner: Abhi. */
import ProductionTable from "@/components/production/ProductionTable";

export default function Production() {
  return (
    <main>
      <h1 className="font-display text-2xl mb-6 text-gray-100">Production Monitoring</h1>
      <div className="bg-panel border border-line rounded-lg p-4">
        <ProductionTable />
      </div>
    </main>
  );
}
