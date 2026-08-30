/** FactoryGPT — Multi-Tenant Registration & Factory Onboarding Page */
"use client";
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  Activity,
  User,
  Mail,
  Lock,
  Building2,
  MapPin,
  Tag,
  KeyRound,
  Layers,
  Plus,
  Trash2,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Crown,
  Eye,
  Wrench,
  Users,
  Factory as FactoryIcon,
} from "lucide-react";

interface LineConfig {
  name: string;
  machine_count: number;
  target_per_shift: number;
  shifts: string;
}

const ROLES = [
  {
    id: "owner",
    label: "Plant Owner / GM",
    desc: "Register a new factory with custom production lines & targets",
    icon: <Crown size={18} className="text-[var(--color-primary)]" />,
    isOwner: true,
  },
  {
    id: "manager",
    label: "Operations Manager",
    desc: "Supervise production shifts, manage tickets, and review line downtime",
    icon: <Users size={18} className="text-indigo-600" />,
    isOwner: false,
  },
  {
    id: "qc_inspector",
    label: "Quality Inspector",
    desc: "Review vision AI defect detections and QA ticket workflows",
    icon: <Eye size={18} className="text-[var(--color-amber)]" />,
    isOwner: false,
  },
  {
    id: "maintenance_engineer",
    label: "Maintenance Engineer",
    desc: "Track machine telemetry, vibration/temp alerts, and failure forecasts",
    icon: <Wrench size={18} className="text-[var(--color-danger)]" />,
    isOwner: false,
  },
  {
    id: "operator",
    label: "Line Operator",
    desc: "Log live line counts, view shift progress, and report downtime",
    icon: <FactoryIcon size={18} className="text-[var(--color-success)]" />,
    isOwner: false,
  },
];

const INDUSTRIES = [
  { id: "automotive", label: "Automotive & Parts Assembly" },
  { id: "electronics", label: "Electronics & PCB Manufacturing" },
  { id: "pharma", label: "Pharmaceuticals & Chemical Processing" },
  { id: "food", label: "Food & Beverage Packaging" },
  { id: "textile", label: "Textiles & Garment Production" },
  { id: "general", label: "General Industrial Manufacturing" },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("owner");

  // Factory Owner state
  const [factoryName, setFactoryName] = useState("");
  const [factoryLocation, setFactoryLocation] = useState("");
  const [industry, setIndustry] = useState("automotive");
  const [lines, setLines] = useState<LineConfig[]>([
    { name: "Line-1 (Stamping)", machine_count: 3, target_per_shift: 1500, shifts: "A,B,C" },
    { name: "Line-2 (Assembly)", machine_count: 3, target_per_shift: 800, shifts: "A,B,C" },
    { name: "Line-3 (Packaging)", machine_count: 3, target_per_shift: 2000, shifts: "A,B,C" },
  ]);

  // Non-owner state (Join code)
  const [factoryCode, setFactoryCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwnerRole = role === "owner";

  const handleAddLine = () => {
    const nextNum = lines.length + 1;
    setLines([
      ...lines,
      { name: `Line-${nextNum}`, machine_count: 3, target_per_shift: 1000, shifts: "A,B,C" },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleLineChange = (index: number, field: keyof LineConfig, value: any) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: value };
    setLines(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      setError("Please complete all account fields.");
      return;
    }

    if (isOwnerRole && !factoryName.trim()) {
      setError("Please specify your factory name.");
      return;
    }

    if (!isOwnerRole && !factoryCode.trim()) {
      setError("Please enter the factory join code provided by your plant manager.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await register({
        full_name: fullName,
        email,
        password,
        role,
        factory_name: isOwnerRole ? factoryName : undefined,
        factory_location: isOwnerRole ? factoryLocation : undefined,
        industry: isOwnerRole ? industry : undefined,
        factory_code: !isOwnerRole ? factoryCode.trim().toUpperCase() : undefined,
        lines: isOwnerRole ? lines : undefined,
      });
    } catch (err: any) {
      setError(err?.message || "Registration failed. Please check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Sign Up & Factory Setup — FactoryGPT ERP</title>
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
              Multi-Tenant Factory Onboarding
            </p>
          </div>
        </div>

        {/* Registration Card */}
        <div className="w-full max-w-2xl card-base p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
              Create Your Account
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Set up your plant workspace or join your existing manufacturing team
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-2.5 p-3 rounded-lg bg-[var(--color-danger-light)] border border-[var(--color-danger-border)] text-xs text-[var(--color-danger)] animate-fade-in">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: User Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-3 text-[var(--color-text-muted)]" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Vikram Rao"
                    required
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-[var(--color-line)] rounded-lg text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary-border)] transition-all"
                  />
                </div>
              </div>

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
                    placeholder="vikram@tatamotors.com"
                    required
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-[var(--color-line)] rounded-lg text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary-border)] transition-all"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-3 text-[var(--color-text-muted)]" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 chars (upper, lower, digit)"
                    required
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-[var(--color-line)] rounded-lg text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary-border)] transition-all"
                  />
                </div>
                <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
                  Security policy: Min. 8 characters with at least 1 uppercase, 1 lowercase, and 1 number.
                </p>
              </div>
            </div>

            {/* Section 2: Role Selection */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-2">
                Select Your Role
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ROLES.map((r) => {
                  const isSelected = role === r.id;
                  return (
                    <div
                      key={r.id}
                      onClick={() => setRole(r.id)}
                      className={`cursor-pointer p-3.5 rounded-xl border transition-all ${
                        isSelected
                          ? "bg-[var(--color-primary-light)] border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]"
                          : "bg-white border-[var(--color-line)] hover:bg-[var(--color-surface)]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          {r.icon}
                          <span className="text-xs font-bold text-[var(--color-text-primary)]">
                            {r.label}
                          </span>
                        </div>
                        {isSelected && <CheckCircle2 size={16} className="text-[var(--color-primary)]" />}
                      </div>
                      <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                        {r.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 3A: Factory Setup (Owner) */}
            {isOwnerRole ? (
              <div className="pt-4 border-t border-[var(--color-line)] space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 size={16} className="text-[var(--color-primary)]" />
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                    Factory Plant Configuration
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                      Factory / Plant Name
                    </label>
                    <input
                      type="text"
                      value={factoryName}
                      onChange={(e) => setFactoryName(e.target.value)}
                      placeholder="e.g. Tata Motors Pune Plant"
                      required={isOwnerRole}
                      className="w-full px-3.5 py-2 bg-white border border-[var(--color-line)] rounded-lg text-sm outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                      Location / Region
                    </label>
                    <div className="relative">
                      <MapPin size={14} className="absolute left-3 top-2.5 text-[var(--color-text-muted)]" />
                      <input
                        type="text"
                        value={factoryLocation}
                        onChange={(e) => setFactoryLocation(e.target.value)}
                        placeholder="Pune, Maharashtra"
                        className="w-full pl-8 pr-3.5 py-2 bg-white border border-[var(--color-line)] rounded-lg text-sm outline-none focus:border-[var(--color-primary)]"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                      Manufacturing Industry
                    </label>
                    <select
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[var(--color-line)] rounded-lg text-sm outline-none focus:border-[var(--color-primary)] text-[var(--color-text-primary)]"
                    >
                      {INDUSTRIES.map((ind) => (
                        <option key={ind.id} value={ind.id}>
                          {ind.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Production Lines Configurator */}
                <div>
                  <div className="flex items-center justify-between mb-2 mt-4">
                    <label className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
                      <Layers size={14} className="text-[var(--color-primary)]" />
                      Production Lines ({lines.length})
                    </label>
                    <button
                      type="button"
                      onClick={handleAddLine}
                      className="text-xs font-semibold text-[var(--color-primary)] hover:underline flex items-center gap-1"
                    >
                      <Plus size={13} />
                      Add Line
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {lines.map((line, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 bg-[var(--color-surface)] border border-[var(--color-line)] rounded-lg"
                      >
                        <div className="flex-1">
                          <label className="block text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-0.5">
                            Line Name
                          </label>
                          <input
                            type="text"
                            value={line.name}
                            onChange={(e) => handleLineChange(idx, "name", e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-[var(--color-line)] rounded text-xs text-[var(--color-text-primary)] font-medium"
                          />
                        </div>

                        <div className="w-24">
                          <label className="block text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-0.5">
                            Machines
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={20}
                            value={line.machine_count}
                            onChange={(e) => handleLineChange(idx, "machine_count", parseInt(e.target.value) || 1)}
                            className="w-full px-2.5 py-1.5 bg-white border border-[var(--color-line)] rounded text-xs text-[var(--color-text-primary)]"
                          />
                        </div>

                        <div className="w-32">
                          <label className="block text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-0.5">
                            Target/Shift
                          </label>
                          <input
                            type="number"
                            min={100}
                            step={100}
                            value={line.target_per_shift}
                            onChange={(e) => handleLineChange(idx, "target_per_shift", parseInt(e.target.value) || 500)}
                            className="w-full px-2.5 py-1.5 bg-white border border-[var(--color-line)] rounded text-xs text-[var(--color-text-primary)]"
                          />
                        </div>

                        {lines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(idx)}
                            className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors mt-3"
                            title="Remove Line"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Section 3B: Join Factory via Code */
              <div className="pt-4 border-t border-[var(--color-line)] space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <KeyRound size={16} className="text-[var(--color-primary)]" />
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                    Join Existing Factory
                  </h3>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Enter the 8-character Factory Join Code provided by your Plant Administrator (e.g.{" "}
                  <code className="font-mono bg-[var(--color-surface)] px-1.5 py-0.5 rounded text-[var(--color-primary)] font-semibold">
                    TATA-7X3K
                  </code>
                  ).
                </p>
                <div>
                  <input
                    type="text"
                    value={factoryCode}
                    onChange={(e) => setFactoryCode(e.target.value.toUpperCase())}
                    placeholder="e.g. TATA-7X3K"
                    required={!isOwnerRole}
                    className="w-full px-3.5 py-2.5 bg-white border border-[var(--color-line)] rounded-lg text-sm font-mono uppercase tracking-widest text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg bg-[var(--color-primary)] hover:opacity-95 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Complete Setup & Enter Portal</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Footer link */}
          <p className="text-center text-xs text-[var(--color-text-secondary)] mt-6">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[var(--color-primary)] hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
