"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Role, TeamMember } from "@/lib/types";

type AuthCtx = {
  loading: boolean;
  session: Session | null;
  member: TeamMember | null;
  role: Role | null;
  sendCode: (email: string) => Promise<void>;
  verifyCode: (email: string, token: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx | null>(null);

async function loadMember(email: string | undefined) {
  if (!email) return null;
  const { data } = await supabase
    .from("team_members")
    .select("*")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();
  return (data as TeamMember | null) ?? null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [member, setMember] = useState<TeamMember | null>(null);

  const sync = useCallback(async (next: Session | null) => {
    setSession(next);
    const found = await loadMember(next?.user.email);
    if (next && !found) {
      await supabase.auth.signOut();
      setSession(null);
      setMember(null);
      return;
    }
    setMember(found);
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      await sync(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      void sync(next);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [sync]);

  const sendCode = useCallback(async (email: string) => {
    const normalized = email.trim().toLowerCase();
    const found = await loadMember(normalized);
    if (!found) {
      throw new Error("Este e-mail não está cadastrado na equipe.");
    }
    const { error } = await supabase.auth.signInWithOtp({
      email: normalized,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    if (error) throw error;
  }, []);

  const verifyCode = useCallback(async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: token.trim(),
      type: "email",
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setMember(null);
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      loading,
      session,
      member,
      role: member?.role ?? null,
      sendCode,
      verifyCode,
      signOut,
    }),
    [loading, session, member, sendCode, verifyCode, signOut],
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
