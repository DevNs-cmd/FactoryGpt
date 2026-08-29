/** FactoryGPT — Login Page */
"use client";
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Activity, Mail, Lock, ArrowRight, AlertCircle, Sparkles, Building2 } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await login({ email, password });
    } catch (err: any) {
      setError(err?.message || "Failed to log in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail("admin@factorygpt.com");
    setPassword("admin123");
    setError(null);
    setLoading(true);
    try {
      await login({ email: "admin@factorygpt.com", password: "admin123" });
    } catch (err: any) {
      setError(err?.message || "Demo login failed. Please ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login — FactoryGPT ERP Portal</title>
      </Head>
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

        {/* Login Card */}
        <div className="w-full max-w-md card-base p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
              Welcome Back
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Sign in to access your plant analytics & operational telemetry
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 p-3 rounded-lg bg-[var(--color-danger-light)] border border-[var(--color-danger-border)] text-xs text-[var(--color-danger)] animate-fade-in">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3 text-[var(--color-text-muted)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-[var(--color-line)] rounded-lg text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary-border)] transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[var(--color-text-primary)]">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3 text-[var(--color-text-muted)]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-[var(--color-line)] rounded-lg text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary-border)] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-[var(--color-primary)] hover:opacity-95 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--color-line)]" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase">
              <span className="bg-white px-2 text-[var(--color-text-muted)] font-medium tracking-wider">
                Or Quick Access
              </span>
            </div>
          </div>

          {/* Quick Demo Login */}
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-[var(--color-surface)] hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)] border border-[var(--color-line)] hover:border-[var(--color-primary-border)] text-xs font-semibold text-[var(--color-text-secondary)] flex items-center justify-center gap-2 transition-all"
          >
            <Building2 size={15} />
            <span>Sign In as Demo Admin (Tata Motors Plant)</span>
          </button>

          {/* Footer link */}
          <p className="text-center text-xs text-[var(--color-text-secondary)] mt-6">
            New factory owner or team member?{" "}
            <Link href="/register" className="font-semibold text-[var(--color-primary)] hover:underline">
              Create an account or join a factory
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
