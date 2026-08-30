import Head from "next/head";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { api, type User } from "@/lib/api";
import {
  Building2,
  KeyRound,
  MapPin,
  Tag,
  Layers,
  Users,
  Shield,
  Copy,
  Check,
  Server,
  Activity,
  Zap,
  UserCheck,
  UserX,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";

export default function SettingsPage() {
  const { user, factory } = useAuth();
  const [copied, setCopied] = useState(false);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const isAdmin = user?.is_approved !== false && (user?.role === "owner" || user?.role === "manager");

  const fetchPending = async (showLoading = true) => {
    if (!isAdmin) return;
    if (showLoading) setLoadingPending(true);
    try {
      const list = await api.getPendingUsers();
      setPendingUsers(list);
    } catch (err: any) {
      console.warn("Failed to load pending users:", err);
    } finally {
      if (showLoading) setLoadingPending(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    fetchPending(true);

    const interval = setInterval(() => {
      fetchPending(false);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAdmin, user?.id, factory?.id]);

  const handleApprove = async (userId: number, name: string) => {
    setActionLoading(userId);
    setFeedback(null);
    try {
      await api.approveUser(userId);
      setFeedback({ type: "success", msg: `Approved ${name}. They now have full workspace access.` });
      await fetchPending();
    } catch (err: any) {
      setFeedback({ type: "error", msg: err?.message || "Failed to approve user." });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId: number, name: string) => {
    if (!confirm(`Are you sure you want to reject and remove membership request for ${name}?`)) {
      return;
    }
    setActionLoading(userId);
    setFeedback(null);
    try {
      await api.rejectUser(userId);
      setFeedback({ type: "success", msg: `Rejected registration for ${name}.` });
      await fetchPending();
    } catch (err: any) {
      setFeedback({ type: "error", msg: err?.message || "Failed to reject user." });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCopyCode = () => {
    if (!factory?.code) return;
    navigator.clipboard.writeText(factory.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = factory?.lines || [];

  return (
    <>
      <Head>
        <title>Plant Settings — FactoryGPT ERP Portal</title>
      </Head>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Plant Configuration & Workspace Settings
          </h1>
          <p className="text-sm text-slate-600 font-medium mt-1">
            Manage factory infrastructure, production targets, and team collaboration
          </p>
        </div>

        {/* ── Factory Profile & Join Code ─────────────────────────── */}
        <div className="card-base p-6 shadow-sm bg-white border border-slate-200">
          <div className="flex items-center gap-2 mb-5 border-b border-slate-200 pb-3">
            <Building2 size={20} className="text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Factory Profile & Team Access
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Factory Name
                </label>
                <p className="text-lg font-bold text-slate-900 mt-1">
                  {factory?.name || "Manufacturing Facility"}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Facility Location
                </label>
                <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 mt-1">
                  <MapPin size={16} className="text-blue-600" />
                  <span>{factory?.location || "Main Plant Campus"}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Industry Sector
                </label>
                <span className="inline-block text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-md capitalize mt-1.5 shadow-xs">
                  {factory?.industry || "Industrial Manufacturing"}
                </span>
              </div>
            </div>

            {/* Team Join Code Card */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  <KeyRound size={16} className="text-blue-600" />
                  <span>Factory Join Code</span>
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed mb-4">
                  Share this code with your plant supervisors, maintenance technicians, and QA inspectors. They can enter it during sign-up to immediately join this factory workspace.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 bg-white border-2 border-slate-300 px-4 py-2.5 rounded-lg font-mono font-extrabold text-base tracking-widest text-slate-900 shadow-xs flex items-center">
                  <span className="text-slate-900 font-bold select-all tracking-widest">
                    {factory?.code || "TATA-7X3K"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm flex-shrink-0"
                >
                  {copied ? (
                    <>
                      <Check size={14} />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Feedback Message ────────────────────────────────────── */}
        {feedback && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold animate-fade-in ${
              feedback.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === "success" ? (
                <CheckCircle2 size={16} className="text-emerald-600" />
              ) : (
                <AlertCircle size={16} className="text-rose-600" />
              )}
              <span>{feedback.msg}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-slate-400 hover:text-slate-700"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* ── Pending Member Approvals (Owner & Manager Only) ──────── */}
        {isAdmin && (
          <div className="card-base p-6 shadow-sm bg-white border border-slate-200">
            <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <UserCheck size={20} className="text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Pending Member Approvals
                </h2>
                {pendingUsers.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                    {pendingUsers.length} Pending
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fetchPending(true)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Refresh List
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              Review and grant dashboard permissions to workers, engineers, and inspectors who registered with your factory code.
            </p>

            {loadingPending ? (
              <div className="py-8 text-center text-xs text-slate-500">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading pending join requests...
              </div>
            ) : pendingUsers.length === 0 ? (
              <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <CheckCircle2 size={24} className="text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-800">
                  All Caught Up!
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  There are no pending join requests waiting for approval.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {pendingUsers.map((pUser) => (
                  <div
                    key={pUser.id}
                    className="p-4 bg-white hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {pUser.full_name}
                        </span>
                        <span className="capitalize px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {pUser.role?.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="font-mono">{pUser.email}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-[11px]">
                          <Clock size={12} />
                          {new Date(pUser.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleApprove(pUser.id, pUser.full_name)}
                        disabled={actionLoading === pUser.id}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
                      >
                        <Check size={14} />
                        <span>{actionLoading === pUser.id ? "Approving..." : "Approve Access"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(pUser.id, pUser.full_name)}
                        disabled={actionLoading === pUser.id}
                        className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 hover:border-rose-300 text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
                      >
                        <X size={14} />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Configured Production Lines ─────────────────────────── */}
        <div className="card-base p-6 shadow-sm bg-white border border-slate-200">
          <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Layers size={20} className="text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Active Production Lines ({lines.length})
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {lines.map((line) => (
              <div
                key={line.id}
                className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2.5 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900">
                    {line.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Active
                  </span>
                </div>
                <div className="text-xs text-slate-700 space-y-1.5 pt-1 border-t border-slate-200/60">
                  <p className="flex justify-between">
                    <span className="text-slate-500 font-medium">Equipped Machines:</span>
                    <strong className="text-slate-900 font-semibold">{line.machine_count} units</strong>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-500 font-medium">Target Per Shift:</span>
                    <strong className="text-slate-900 font-semibold">{line.target_per_shift.toLocaleString()} units</strong>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-500 font-medium">Operating Shifts:</span>
                    <strong className="text-slate-900 font-semibold">Shifts {line.shifts}</strong>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Role Permissions Matrix ─────────────────────────────── */}
        <div className="card-base p-6 shadow-sm bg-white border border-slate-200">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-3">
            <Shield size={20} className="text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Role-Based Access Control (RBAC)
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3 px-3 font-bold">User Role</th>
                  <th className="py-3 px-3 font-bold">Production & OEE</th>
                  <th className="py-3 px-3 font-bold">Vision AI QA</th>
                  <th className="py-3 px-3 font-bold">Predictive Maint.</th>
                  <th className="py-3 px-3 font-bold">Tickets & Remediation</th>
                  <th className="py-3 px-3 font-bold">Factory Setup</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-3 font-bold text-blue-700">Plant Owner / GM</td>
                  <td className="py-3 px-3 text-emerald-700 font-bold">Full Access</td>
                  <td className="py-3 px-3 text-emerald-700 font-bold">Full Access</td>
                  <td className="py-3 px-3 text-emerald-700 font-bold">Full Access</td>
                  <td className="py-3 px-3 text-emerald-700 font-bold">Full Access</td>
                  <td className="py-3 px-3 text-emerald-700 font-bold">Full Access</td>
                </tr>
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-900">QC Inspector</td>
                  <td className="py-3 px-3 text-slate-500 font-medium">View Only</td>
                  <td className="py-3 px-3 text-emerald-700 font-bold">Inspect & Detect</td>
                  <td className="py-3 px-3 text-slate-400 font-medium">Restricted</td>
                  <td className="py-3 px-3 text-blue-700 font-bold">Acknowledge QA</td>
                  <td className="py-3 px-3 text-slate-400 font-medium">Restricted</td>
                </tr>
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-900">Maintenance Tech</td>
                  <td className="py-3 px-3 text-slate-500 font-medium">View Only</td>
                  <td className="py-3 px-3 text-slate-400 font-medium">Restricted</td>
                  <td className="py-3 px-3 text-emerald-700 font-bold">Run Diagnostics</td>
                  <td className="py-3 px-3 text-blue-700 font-bold">Resolve Repairs</td>
                  <td className="py-3 px-3 text-slate-400 font-medium">Restricted</td>
                </tr>
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-900">Line Operator</td>
                  <td className="py-3 px-3 text-blue-700 font-bold">Log Production / Downtime</td>
                  <td className="py-3 px-3 text-slate-400 font-medium">Restricted</td>
                  <td className="py-3 px-3 text-slate-400 font-medium">Restricted</td>
                  <td className="py-3 px-3 text-slate-500 font-medium">View Only</td>
                  <td className="py-3 px-3 text-slate-400 font-medium">Restricted</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
