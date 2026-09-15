"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Role } from "@/lib/types";

const KEY = "retiro-role";

type Ctx = {
  role: Role;
  setRole: (role: Role) => void;
};

const RoleContext = createContext<Ctx | null>(null);

export function Providers({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>("marketing");

  useEffect(() => {
    const saved = window.localStorage.getItem(KEY) as Role | null;
    if (saved) setRoleState(saved);
  }, []);

  const setRole = (next: Role) => {
    setRoleState(next);
    window.localStorage.setItem(KEY, next);
  };

  const value = useMemo(() => ({ role, setRole }), [role]);

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole precisa estar dentro de Providers");
  return ctx;
}
