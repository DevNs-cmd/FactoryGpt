/** Owner: Abhi. Main dashboard — first thing anyone sees in the demo. */
import DashboardOverview from "@/components/dashboard/DashboardOverview";

export default function Home() {
  return (
    <main>
      <h1 className="font-display text-2xl mb-6 text-gray-100">FactoryGPT — Live Overview</h1>
      <DashboardOverview />
    </main>
  );
}
