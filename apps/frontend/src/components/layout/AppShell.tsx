/** FactoryGPT — App Shell: Sidebar + Content wrapper */
"use client";
import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[var(--color-base)]">
      <Sidebar />
      {/* Main content area — offset by sidebar width, responsive to collapsed state */}
      <main
        className="flex-1 ml-[68px] lg:ml-[240px] transition-all duration-300"
        style={{ minHeight: "100vh" }}
      >
        <div className="max-w-[1400px] mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
