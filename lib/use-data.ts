"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";
import type {
  Deliverable,
  DeliverableFile,
  EditorialPost,
  EventSettings,
  PostFile,
  ProductionStep,
  TeamMember,
} from "./types";

export function useRetiroData() {
  const [settings, setSettings] = useState<EventSettings | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [posts, setPosts] = useState<EditorialPost[]>([]);
  const [steps, setSteps] = useState<ProductionStep[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    const [s, m, p, st, d, f, pf] = await Promise.all([
      supabase.from("event_settings").select("*").eq("id", 1).single(),
      supabase
        .from("team_members")
        .select("id,name,role,title,email,phone,notes,color,password_hash")
        .order("created_at"),
      supabase.from("editorial_posts").select("*").order("sort_order"),
      supabase.from("production_steps").select("*").order("sort_order"),
      supabase.from("deliverables").select("*").order("due_date"),
      supabase.from("deliverable_files").select("*").order("created_at"),
      supabase.from("editorial_post_files").select("*").order("created_at"),
    ]);

    const firstError =
      s.error?.message ||
      m.error?.message ||
      p.error?.message ||
      st.error?.message ||
      d.error?.message ||
      f.error?.message ||
      pf.error?.message;
    if (firstError) setError(firstError);

    if (s.data) setSettings(s.data as EventSettings);
    if (m.data) {
      setMembers(
        (m.data as Array<TeamMember & { password_hash?: string | null }>).map((row) => ({
          id: row.id,
          name: row.name,
          role: row.role,
          title: row.title,
          email: row.email,
          phone: row.phone,
          notes: row.notes,
          color: row.color,
          has_password: Boolean(row.password_hash),
        })),
      );
    }
    if (p.data) {
      const postFiles = (pf.data as PostFile[]) ?? [];
      setPosts(
        (p.data as EditorialPost[]).map((item) => ({
          ...item,
          files: postFiles.filter((file) => file.post_id === item.id),
        })),
      );
    }
    if (st.data) setSteps(st.data as ProductionStep[]);
    if (d.data) {
      const files = (f.data as DeliverableFile[]) ?? [];
      setDeliverables(
        (d.data as Deliverable[]).map((item) => ({
          ...item,
          files: files.filter((file) => file.deliverable_id === item.id),
        })),
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    settings,
    members,
    posts,
    steps,
    deliverables,
    loading,
    error,
    refresh,
  };
}
