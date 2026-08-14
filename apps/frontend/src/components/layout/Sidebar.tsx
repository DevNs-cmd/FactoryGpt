/** FactoryGPT — Sidebar Navigation */
"use client";
import { useRouter } from "next/router";
import {
  LayoutDashboard,
  Factory,
  Eye,
  Wrench,
  AlertTriangle,
  Search,
  MessageSquare,
  Activity,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { api, type ServiceHealth } from "@/lib/api";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  module?: string; // maps to integrations/overview keys
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: <LayoutDashboard size={20} /> },
  { label: "Production", href: "/production", icon: <Factory size={20} /> },
  { label: "Vision AI", href: "/vision", icon: <Eye size={20} />, module: "vision" },
  { label: "Maintenance", href: "/maintenance", icon: <Wrench size={20} />, module: "maintenance" },
  { label: "Root Cause", href: "/rootcause", icon: <Search size={20} />, module: "root_cause" },
  { label: "Tickets", href: "/tickets", icon: <AlertTriangle size={20} /> },
  { label: "Assistant", href: "/chat", icon: <MessageSquare size={20} /> },
];

export default function Sidebar() {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [serviceStatus, setServiceStatus] = useState<Record<string, boolean>>({});
  const [backendOnline, setBackendOnline] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await api.getHealth();
        setBackendOnline(true);
        try {
          const overview = await api.getOverview();
          setServiceStatus({
            vision: overview.vision?.status === "ok",
            maintenance: Array.isArray(overview.maintenance),
            root_cause: overview.root_cause?.worst_machine != null,
          });
        } catch {
          setServiceStatus({});
        }
      } catch {
        setBackendOnline(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside
      className={`fixed top-0 left-0 h-screen z-50 flex flex-col transition-all duration-300 ease-in-out ${
        collapsed ? "w-[68px]" : "w-[240px]"
      }`}
      style={{
        background: "#FFFFFF",
        borderRight: "1px solid var(--color-line)",
      }}
    >
      {/* Logo Area */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-[var(--color-line)]">
        <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center flex-shrink-0">
          <Activity size={18} color="#FFFFFF" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-semibold text-[var(--color-text-primary)]">
              FactoryGPT
            </h1>
            <p className="text-[10px] text-[var(--color-text-muted)] tracking-wide">
              ERP Portal
            </p>
          </div>
        )}
      </div>

      {/* Backend Status */}
      <div className="px-4 py-3 border-b border-[var(--color-line)]">
        <div className="flex items-center gap-2">
          <span
            className={`status-dot ${backendOnline ? "status-dot-online" : "status-dot-offline"}`}
          />
          {!collapsed && (
            <span className="text-[11px] text-[var(--color-text-secondary)]">
              {backendOnline ? "System Online" : "Backend Offline"}
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = router.pathname === item.href;
          const moduleOnline = item.module ? serviceStatus[item.module] : undefined;

          return (
            <a
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-[var(--color-primary-light)] text-[var(--color-primary)]"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]"
              }`}
            >
              <span className="flex-shrink-0">{item.icon}</span>

              {!collapsed && (
                <span className="flex-1 truncate">{item.label}</span>
              )}

              {/* Service health dot */}
              {!collapsed && moduleOnline !== undefined && (
                <span
                  className={`status-dot ${
                    moduleOnline ? "status-dot-online" : "status-dot-offline"
                  }`}
                  title={moduleOnline ? "Service online" : "Service offline"}
                />
              )}
            </a>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-12 border-t border-[var(--color-line)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors"
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
}
