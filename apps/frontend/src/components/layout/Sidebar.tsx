/** FactoryGPT — Sidebar Navigation with Multi-Tenant State & RBAC */
"use client";
import { useRouter } from "next/router";
import Link from "next/link";
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
  LogOut,
  Building2,
  KeyRound,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  module?: string;
  allowedRoles?: string[]; // If omitted, all roles can see
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: <LayoutDashboard size={18} /> },
  {
    label: "Production",
    href: "/production",
    icon: <Factory size={18} />,
    allowedRoles: ["owner", "manager", "operator"],
  },
  {
    label: "Vision AI",
    href: "/vision",
    icon: <Eye size={18} />,
    module: "vision",
    allowedRoles: ["owner", "manager", "qc_inspector"],
  },
  {
    label: "Maintenance",
    href: "/maintenance",
    icon: <Wrench size={18} />,
    module: "maintenance",
    allowedRoles: ["owner", "manager", "maintenance_engineer"],
  },
  {
    label: "Root Cause",
    href: "/rootcause",
    icon: <Search size={18} />,
    module: "root_cause",
    allowedRoles: ["owner", "manager", "maintenance_engineer"],
  },
  {
    label: "Tickets",
    href: "/tickets",
    icon: <AlertTriangle size={18} />,
    allowedRoles: ["owner", "manager", "qc_inspector", "maintenance_engineer"],
  },
  { label: "Assistant", href: "/chat", icon: <MessageSquare size={18} /> },
  {
    label: "Settings",
    href: "/settings",
    icon: <Building2 size={18} />,
    allowedRoles: ["owner", "manager"],
  },
];

function formatRoleName(role?: string) {
  switch (role) {
    case "owner":
      return "Plant Owner";
    case "manager":
      return "General Manager";
    case "qc_inspector":
      return "QC Inspector";
    case "maintenance_engineer":
      return "Maintenance Tech";
    case "operator":
      return "Line Operator";
    default:
      return role || "Staff";
  }
}

export default function Sidebar() {
  const router = useRouter();
  const { user, factory, logout, hasRole } = useAuth();
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
      {/* Logo & Factory Header */}
      <div className="px-3.5 h-16 border-b border-[var(--color-line)] flex items-center justify-between">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center flex-shrink-0 shadow-sm">
            <Activity size={17} color="#FFFFFF" strokeWidth={2.5} />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-xs font-bold text-[var(--color-text-primary)] truncate">
                {factory?.name || "FactoryGPT"}
              </h1>
              {factory?.code ? (
                <span className="inline-flex items-center gap-1 text-[9px] font-mono font-semibold text-[var(--color-primary)] bg-[var(--color-primary-light)] px-1.5 py-0.2 rounded">
                  <KeyRound size={9} />
                  {factory.code}
                </span>
              ) : (
                <p className="text-[10px] text-[var(--color-text-muted)]">Enterprise ERP</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Backend & Factory Status Bar */}
      <div className="px-3.5 py-2 border-b border-[var(--color-line)] bg-[var(--color-surface)]">
        <div className="flex items-center gap-2">
          <span
            className={`status-dot ${backendOnline ? "status-dot-online" : "status-dot-offline"}`}
          />
          {!collapsed && (
            <div className="flex-1 flex items-center justify-between">
              <span className="text-[10px] font-medium text-[var(--color-text-secondary)] truncate">
                {backendOnline ? "Gateway Online" : "Gateway Offline"}
              </span>
              <span className="text-[9px] text-[var(--color-text-muted)] capitalize">
                {factory?.industry || "Industrial"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          // Check RBAC permission
          const isAllowed = !item.allowedRoles || hasRole(item.allowedRoles);
          if (!isAllowed) return null;

          const isActive = router.pathname === item.href;
          const moduleOnline = item.module ? serviceStatus[item.module] : undefined;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`group flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? "bg-[var(--color-primary-light)] text-[var(--color-primary)] shadow-sm"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]"
              }`}
            >
              <span className="flex-shrink-0">{item.icon}</span>

              {!collapsed && (
                <span className="flex-1 truncate">{item.label}</span>
              )}

              {/* Service health indicator dot */}
              {!collapsed && moduleOnline !== undefined && (
                <span
                  className={`status-dot ${
                    moduleOnline ? "status-dot-online" : "status-dot-offline"
                  }`}
                  title={moduleOnline ? "Microservice active" : "Microservice offline"}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile & Logout Footer */}
      <div className="border-t border-[var(--color-line)] p-2">
        {!collapsed ? (
          <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--color-surface)]">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] font-bold text-xs flex items-center justify-center flex-shrink-0 border border-[var(--color-primary-border)]">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="overflow-hidden">
                <p className="text-[11px] font-semibold text-[var(--color-text-primary)] truncate">
                  {user?.full_name || "Plant User"}
                </p>
                <span className="inline-block text-[9px] font-medium text-[var(--color-primary)] capitalize truncate">
                  {formatRoleName(user?.role)}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors rounded"
              title="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            className="w-full flex items-center justify-center py-2 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors rounded"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        )}

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center h-8 mt-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors rounded"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
    </aside>
  );
}
