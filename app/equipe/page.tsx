"use client";

import { useState } from "react";
import { useRole } from "@/components/providers";
import { Field, GhostButton, PrimaryButton, inputClass } from "@/components/ui";
import { useRetiroData } from "@/lib/use-data";
import { ROLE_LABEL } from "@/lib/labels";
import type { Role, TeamMember } from "@/lib/types";
import { supabase } from "@/lib/supabase";

const ROLES: Role[] = ["gestao", "marketing", "design", "redacao", "audiovisual"];

export default function EquipePage() {
  const { members, loading, error, refresh } = useRetiroData();
  const { role } = useRole();
  const [open, setOpen] = useState<TeamMember | "new" | null>(null);
  const canEdit = role === "gestao" || role === "marketing";

  if (loading) return <p className="text-mist">Carregando equipe…</p>;
  if (error) return <p className="text-clay">{error}</p>;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-aqua">Comunicação</p>
          <h1 className="font-display text-4xl">Equipe de marketing</h1>
          <p className="mt-2 max-w-xl text-mist">
            Quem briefa, quem desenha, quem aprova. Troque os nomes placeholder
            pelos nomes reais da equipe.
          </p>
        </div>
        {canEdit && <PrimaryButton onClick={() => setOpen("new")}>Adicionar pessoa</PrimaryButton>}
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => (
          <button
            key={member.id}
            type="button"
            onClick={() => setOpen(member)}
            className="rounded-3xl bg-white p-5 text-left shadow-card"
          >
            <span
              className="mb-4 grid h-12 w-12 place-items-center rounded-2xl text-lg text-white"
              style={{ background: member.color }}
            >
              {member.name.slice(0, 1)}
            </span>
            <h2 className="font-display text-2xl leading-tight">{member.name}</h2>
            <p className="text-sm text-aqua">{ROLE_LABEL[member.role]}</p>
            <p className="mt-1 text-sm text-mist">{member.title}</p>
            {member.notes && <p className="mt-3 text-sm text-mist">{member.notes}</p>}
          </button>
        ))}
      </div>

      {open && (
        <MemberDrawer
          member={open}
          canEdit={canEdit}
          onClose={() => setOpen(null)}
          onSaved={refresh}
        />
      )}
    </div>
  );
}

function MemberDrawer({
  member,
  canEdit,
  onClose,
  onSaved,
}: {
  member: TeamMember | "new";
  canEdit: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = member === "new";
  const current = isNew ? null : member;
  const [form, setForm] = useState({
    name: current?.name ?? "",
    role: current?.role ?? "marketing",
    title: current?.title ?? "",
    email: current?.email ?? "",
    phone: current?.phone ?? "",
    notes: current?.notes ?? "",
    color: current?.color ?? "#1C6B78",
  });

  async function save() {
    const payload = {
      name: form.name,
      role: form.role,
      title: form.title,
      email: form.email || null,
      phone: form.phone || null,
      notes: form.notes || null,
      color: form.color,
    };
    if (isNew) await supabase.from("team_members").insert(payload);
    else await supabase.from("team_members").update(payload).eq("id", current!.id);
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-deep/40">
      <button className="h-full flex-1" aria-label="Fechar" onClick={onClose} />
      <aside className="h-full w-full max-w-lg space-y-4 overflow-y-auto bg-pearl p-5 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl">{isNew ? "Nova pessoa" : form.name}</h2>
          <GhostButton onClick={onClose}>Fechar</GhostButton>
        </div>
        <Field label="Nome">
          <input className={inputClass} value={form.name} disabled={!canEdit} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Função">
          <select className={inputClass} value={form.role} disabled={!canEdit} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
            {ROLES.map((r) => (
              <option key={r} value={r}>{ROLE_LABEL[r]}</option>
            ))}
          </select>
        </Field>
        <Field label="Título">
          <input className={inputClass} value={form.title} disabled={!canEdit} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </Field>
        <Field label="E-mail">
          <input className={inputClass} value={form.email} disabled={!canEdit} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Telefone">
          <input className={inputClass} value={form.phone} disabled={!canEdit} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </Field>
        <Field label="Notas">
          <textarea className={inputClass} rows={3} value={form.notes} disabled={!canEdit} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </Field>
        {canEdit && <PrimaryButton onClick={save}>Salvar</PrimaryButton>}
      </aside>
    </div>
  );
}
