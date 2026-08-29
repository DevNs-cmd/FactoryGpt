import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import "@/styles/globals.css";
import AppShell from "@/components/layout/AppShell";
import Head from "next/head";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Activity, Clock, RefreshCw, LogOut } from "lucide-react";

function PendingApprovalScreen({ user }: { user: any }) {
  const { logout, refreshUser } = useAuth();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // Auto-poll approval status every 6 seconds
    const interval = setInterval(() => {
      refreshUser();
    }, 6000);
    return () => clearInterval(interval);
  }, [refreshUser]);

  const handleManualCheck = async () => {
    setChecking(true);
    await refreshUser();
    setTimeout(() => setChecking(false), 500);
  };

  return (
    <div className="min-h-screen bg-[var(--color-base)] flex flex-col justify-center items-center px-4 py-12">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)] flex items-center justify-center shadow-sm">
          <Activity size={22} color="#FFFFFF" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)] tracking-tight">
            FactoryGPT
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] font-medium">
            AI-Powered Smart Factory Operating System
          </p>
        </div>
      </div>

      {/* Pending Approval Card */}
      <div className="w-full max-w-lg card-base p-8 shadow-sm text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-5 shadow-xs">
          <Clock size={28} />
        </div>

        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Access Pending Approval
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          Your account has been registered with factory code{" "}
          <span className="font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
            {user.factory_code || "FACTORY"}
          </span>
          . For plant security, a <strong>Plant Owner</strong> or <strong>Manager</strong> must approve your access before you can enter the operating portal.
        </p>

        {/* User Details Box */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-left text-xs space-y-2.5 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Applicant:</span>
            <span className="text-slate-900 font-bold">{user.full_name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Work Email:</span>
            <span className="text-slate-900 font-mono font-medium">{user.email}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Requested Role:</span>
            <span className="capitalize text-slate-800 font-semibold px-2 py-0.5 bg-white border border-slate-200 rounded">
              {user.role?.replace(/_/g, " ")}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-200/80">
            <span className="text-slate-500 font-medium">Membership Status:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Pending Review
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={handleManualCheck}
            disabled={checking}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-50"
          >
            <RefreshCw size={14} className={checking ? "animate-spin" : ""} />
            <span>{checking ? "Checking..." : "Check Status"}</span>
          </button>
          <button
            type="button"
            onClick={logout}
            className="w-full sm:w-auto py-2.5 px-4 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 transition-all flex items-center justify-center gap-1.5"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const isAuthPage = router.pathname === "/login" || router.pathname === "/register";

  useEffect(() => {
    if (!loading && !user && !isAuthPage) {
      router.replace("/login");
    }
    if (!loading && user && isAuthPage) {
      router.replace("/");
    }
  }, [user, loading, isAuthPage, router]);

  if (isAuthPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-base)] flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)] flex items-center justify-center shadow-md animate-pulse mb-4">
          <Activity size={24} color="#FFFFFF" />
        </div>
        <p className="text-sm font-medium text-[var(--color-text-secondary)]">
          Loading FactoryGPT Workspace...
        </p>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  if (user.is_approved === false) {
    return <PendingApprovalScreen user={user} />;
  }

  return <AppShell>{children}</AppShell>;
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Head>
        <title>FactoryGPT — ERP Portal</title>
        <meta
          name="description"
          content="AI-Powered Factory ERP Portal — Production Monitoring, Vision Inspection, Predictive Maintenance, and Workflow Automation"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <AuthGuard>
        <Component {...pageProps} />
      </AuthGuard>
    </AuthProvider>
  );
}
