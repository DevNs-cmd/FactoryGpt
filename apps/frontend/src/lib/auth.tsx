/**
 * FactoryGPT — React Auth Context & Provider.
 * Handles user sessions, JWT tokens, multi-tenant factory state, and RBAC permissions.
 */
import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/router";
import { api, setStoredToken, getStoredToken, type User, type Factory, type AuthResponse } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  factory: Factory | null;
  token: string | null;
  loading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (payload: {
    email: string;
    password: string;
    full_name: string;
    role: string;
    factory_name?: string;
    factory_location?: string;
    industry?: string;
    factory_code?: string;
    lines?: { name: string; machine_count: number; target_per_shift: number; shifts: string }[];
  }) => Promise<void>;
  logout: () => void;
  hasRole: (allowedRoles: string[]) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [factory, setFactory] = useState<Factory | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSession = async () => {
    const stored = getStoredToken();
    if (!stored) {
      setLoading(false);
      return;
    }

    try {
      setTokenState(stored);
      const res = await api.getMe();
      setUser(res.user);
      setFactory(res.factory);
    } catch (err) {
      console.warn("Session expired or invalid:", err);
      setStoredToken(null);
      setTokenState(null);
      setUser(null);
      setFactory(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSession();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "factorygpt_token") {
        loadSession();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    const res = await api.login(credentials);
    setStoredToken(res.access_token);
    setTokenState(res.access_token);
    setUser(res.user);
    setFactory(res.factory);
    router.push("/");
  };

  const register = async (payload: {
    email: string;
    password: string;
    full_name: string;
    role: string;
    factory_name?: string;
    factory_location?: string;
    industry?: string;
    factory_code?: string;
    lines?: { name: string; machine_count: number; target_per_shift: number; shifts: string }[];
  }) => {
    const res = await api.register(payload);
    setStoredToken(res.access_token);
    setTokenState(res.access_token);
    setUser(res.user);
    setFactory(res.factory);
    router.push("/");
  };

  const logout = () => {
    setStoredToken(null);
    setTokenState(null);
    setUser(null);
    setFactory(null);
    router.push("/login");
  };

  const hasRole = (allowedRoles: string[]): boolean => {
    if (!user) return false;
    if (user.role === "owner" || user.role === "manager") return true;
    return allowedRoles.includes(user.role);
  };

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      setUser(res.user);
      setFactory(res.factory);
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        factory,
        token,
        loading,
        login,
        register,
        logout,
        hasRole,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
