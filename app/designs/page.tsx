"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers";
import { Field, GhostButton, PrimaryButton, inputClass } from "@/components/ui";
import { useRetiroData } from "@/lib/use-data";
import {
  CATEGORY_LABEL,
  DELIVERABLE_STATUS_LABEL,
  formatDate,
} from "@/lib/labels";
import type { Deliverable, DeliverableStatus } from "@/lib/types";
import { supabase } from "@/lib/supabase";

const STATUSES: DeliverableStatus[] = [
  "nao_iniciado",
  "briefing",
  "producao",
  "aguardando_aprovacao",
  "aprovado",
  "concluido",
];

export default function DesignsPage() {
  const { deliverables, members, loading, error, refresh } = useRetiroData();
  const { role, hasRole, isAdmin } = useAuth();
  const [open, setOpen] = useState<Deliverable | "new" | null>(null);
  const canEdit = hasRole("gestao", "design", "marketing");

  if (loading) return <p className="text-mist">Carregando designs…</p>;
  if (error) return <p className="text-clay">{error}</p>;

  const byCategory = Object.entries(
    deliverables.reduce<Record<string, Deliverable[]>>((acc, item) => {
      acc[item.category] = acc[item.category] || [];
      acc[item.category].push(item);
      return acc;
    }, {}),
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-aqua">
            Prévia visual
          </p>
          <h1 className="font-display text-4xl">Designs</h1>
          <p className="mt-2 max-w-xl text-mist">
            Envie a arte (telão, flyer, caderneta, lembrancinha, feed…) para a
            gestão ver a prévia e dar o OK antes da produção.
          </p>
        </div>
        {canEdit && <PrimaryButton onClick={() => setOpen("new")}>Novo design</PrimaryButton>}
      </header>

      {!role && (
        <p className="rounded-xl bg-[#f7ead0] px-4 py-2 text-sm text-[#7a5a12]">
          Para enviar prévia e pedir aprovação,{" "}
          <Link href="/login" className="underline">
            entre com o e-mail da equipe
          </Link>
          .
        </p>
      )}

      {byCategory.map(([category, items]) => (
        <section key={category}>
          <h2 className="font-display mb-3 text-2xl">
            {CATEGORY_LABEL[category] ?? category}
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setOpen(item)}
                className="overflow-hidden rounded-3xl bg-white text-left shadow-card hover:ring-2 hover:ring-gold/40"
              >
                {item.preview_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.preview_url}
                    alt={`Prévia de ${item.title}`}
                    className="h-44 w-full object-cover"
                  />
                ) : (
                  <div className="grid h-32 place-items-center bg-foam text-sm text-mist">
                    Sem prévia visual
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-medium">{item.title}</h3>
                    <span className="rounded-full bg-foam px-2.5 py-0.5 text-[11px] text-tide">
                      {DELIVERABLE_STATUS_LABEL[item.status]}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-mist">{item.description}</p>
                  <p className="mt-3 text-xs text-mist">
                    {item.due_date ? `Prazo ${formatDate(item.due_date)}` : "Sem prazo"}
                    {item.quantity ? ` · ${item.quantity}` : ""}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>
      ))}

      {open && (
        <DesignDrawer
          item={open}
          members={members}
          canEdit={canEdit}
          isGestao={isAdmin}
          onClose={() => setOpen(null)}
          onSaved={refresh}
        />
      )}
    </div>
  );
}

function DesignDrawer({
  item,
  members,
  canEdit,
  isGestao,
  onClose,
  onSaved,
}: {
  item: Deliverable | "new";
  members: { id: string; name: string; title: string }[];
  canEdit: boolean;
  isGestao: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = item === "new";
  const current = isNew ? null : item;
  const [form, setForm] = useState({
    title: current?.title ?? "",
    category: current?.category ?? "digital",
    description: current?.description ?? "",
    status: (current?.status ?? "nao_iniciado") as DeliverableStatus,
    assignee_id: current?.assignee_id ?? "",
    due_date: current?.due_date ?? "",
    quantity: current?.quantity ?? "",
    notes: current?.notes ?? "",
    preview_url: current?.preview_url ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function save(status = form.status, preview = form.preview_url) {
    setSaving(true);
    const payload = {
      title: form.title,
      category: form.category,
      description: form.description || null,
      status,
      assignee_id: form.assignee_id || null,
      due_date: form.due_date || null,
      quantity: form.quantity || null,
      notes: form.notes || null,
      preview_url: preview || null,
    };
    if (isNew) await supabase.from("deliverables").insert(payload);
    else await supabase.from("deliverables").update(payload).eq("id", current!.id);
    setSaving(false);
    onSaved();
    onClose();
  }

  async function onFile(file: File | undefined) {
    if (!file || !canEdit) return;
    if (!current) {
      setUploadError("Salve o design primeiro, depois envie a prévia.");
      return;
    }
    setUploading(true);
    setUploadError(null);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${current.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("designs").upload(path, file, {
      upsert: true,
      contentType: file.type,
    });
    if (error) {
      setUploading(false);
      setUploadError(error.message);
      return;
    }
    const { data } = supabase.storage.from("designs").getPublicUrl(path);
    setForm((prev) => ({ ...prev, preview_url: data.publicUrl }));
    await supabase
      .from("deliverables")
      .update({ preview_url: data.publicUrl })
      .eq("id", current.id);
    setUploading(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-deep/40">
      <button className="h-full flex-1" aria-label="Fechar" onClick={onClose} />
      <aside className="h-full w-full max-w-lg space-y-4 overflow-y-auto bg-pearl p-5 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl">{isNew ? "Novo design" : form.title}</h2>
          <GhostButton onClick={onClose}>Fechar</GhostButton>
        </div>

        {form.preview_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={form.preview_url} alt="Prévia" className="max-h-64 w-full rounded-2xl object-contain bg-white" />
        )}

        <Field label="Prévia visual">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            disabled={!canEdit}
            className="block w-full text-sm"
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
          <p className="mt-1 text-xs text-mist">
            PNG, JPG ou WEBP até 10 MB. A gestão vê esta imagem na aprovação.
          </p>
          {uploading && <p className="text-sm text-aqua">Enviando prévia…</p>}
          {uploadError && <p className="text-sm text-clay">{uploadError}</p>}
        </Field>

        <Field label="Título">
          <input className={inputClass} value={form.title} disabled={!canEdit} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </Field>
        <Field label="Categoria">
          <select className={inputClass} value={form.category} disabled={!canEdit} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {Object.entries(CATEGORY_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </Field>
        <Field label="Descrição">
          <textarea className={inputClass} rows={3} value={form.description} disabled={!canEdit} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <Field label="Status">
          <select className={inputClass} value={form.status} disabled={!canEdit} onChange={(e) => setForm({ ...form, status: e.target.value as DeliverableStatus })}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{DELIVERABLE_STATUS_LABEL[s]}</option>
            ))}
          </select>
        </Field>
        <Field label="Responsável">
          <select className={inputClass} value={form.assignee_id} disabled={!canEdit} onChange={(e) => setForm({ ...form, assignee_id: e.target.value })}>
            <option value="">Sem responsável</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name} · {m.title}</option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Prazo">
            <input type="date" className={inputClass} value={form.due_date} disabled={!canEdit} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          </Field>
          <Field label="Quantidade">
            <input className={inputClass} value={form.quantity} disabled={!canEdit} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          </Field>
        </div>
        <Field label="Notas">
          <textarea className={inputClass} rows={3} value={form.notes} disabled={!canEdit} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </Field>
        <div className="flex flex-wrap gap-2">
          <PrimaryButton disabled={!canEdit || saving} onClick={() => save()}>
            Salvar
          </PrimaryButton>
          {canEdit && !isNew && form.status !== "aguardando_aprovacao" && form.status !== "concluido" && (
            <GhostButton onClick={() => save("aguardando_aprovacao")}>Pedir OK da gestão</GhostButton>
          )}
          {isGestao && form.status === "aguardando_aprovacao" && (
            <PrimaryButton onClick={() => save("aprovado")}>Aprovar design</PrimaryButton>
          )}
        </div>
      </aside>
    </div>
  );
}
