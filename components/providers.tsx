"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Role, TeamMember } from "@/lib/types";

const SESSION_KEY = "retiro-session";

type AuthCtx = {
  loading: boolean;
  member: TeamMember | null;
  role: Role | null;
  login: (email: string, password: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthCtx | null>(null);

export function Providers({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<TeamMember | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      if (raw) setMember(JSON.parse(raw) as TeamMember);
    } catch {
      window.localStorage.removeItem(SESSION_KEY);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.rpc("login_team_member", {
      p_email: email.trim().toLowerCase(),
      p_password: password,
    });
    if (error) throw new Error(error.message);
    const next = data as TeamMember;
    setMember(next);
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(next));
  }, []);

  const signOut = useCallback(() => {
    setMember(null);
    window.localStorage.removeItem(SESSION_KEY);
  }, []);

  const value = useMemo(
    () => ({
      loading,
      member,
      role: member?.role ?? null,
      login,
      signOut,
    }),
    [loading, member, login, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de Providers");
  return ctx;
}

export function useRole() {
  const { role } = useAuth();
  return { role };
}
