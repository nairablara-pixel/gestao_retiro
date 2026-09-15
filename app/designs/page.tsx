"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers";
import { Field, GhostButton, PrimaryButton, inputClass } from "@/components/ui";
import { useRetiroData } from "@/lib/use-data";
import {
  CATEGORY_LABEL,
  DELIVERABLE_STATUS_LABEL,
  formatDate,
} from "@/lib/labels";
import type { Deliverable, DeliverableFile, DeliverableStatus } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { storeImage } from "@/lib/upload";

function coverOf(item: Deliverable) {
  return item.files?.[0]?.url || item.preview_url;
}

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
            Envie quantos arquivos quiser. A gestão vê todas as prévias, dá o OK
            e depois a equipe marca como postado.
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
            {items.map((item) => {
              const cover = coverOf(item);
              const count = item.files?.length ?? 0;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setOpen(item)}
                  className="overflow-hidden rounded-3xl bg-white text-left shadow-card hover:ring-2 hover:ring-gold/40"
                >
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cover}
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
                      {count} {count === 1 ? "arquivo" : "arquivos"}
                      {item.due_date ? ` · prazo ${formatDate(item.due_date)}` : ""}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ))}

      {open && (
        <DesignDrawer
          item={open === "new" ? "new" : deliverables.find((d) => d.id === open.id) ?? open}
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
  const [createdId, setCreatedId] = useState<string | null>(current?.id ?? null);
  const [form, setForm] = useState({
    title: current?.title ?? "",
    category: current?.category ?? "digital",
    description: current?.description ?? "",
    status: (current?.status ?? "nao_iniciado") as DeliverableStatus,
    assignee_id: current?.assignee_id ?? "",
    due_date: current?.due_date ?? "",
    quantity: current?.quantity ?? "",
    notes: current?.notes ?? "",
  });
  const [files, setFiles] = useState<DeliverableFile[]>(current?.files ?? []);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (!current?.id) return;
    void supabase
      .from("deliverable_files")
      .select("*")
      .eq("deliverable_id", current.id)
      .order("created_at")
      .then(({ data, error }) => {
        if (error) setUploadError(error.message);
        else setFiles((data as DeliverableFile[]) ?? []);
      });
  }, [current?.id]);

  async function ensureSaved() {
    if (createdId) return createdId;
    const payload = {
      title: form.title || "Novo design",
      category: form.category,
      description: form.description || null,
      status: form.status,
      assignee_id: form.assignee_id || null,
      due_date: form.due_date || null,
      quantity: form.quantity || null,
      notes: form.notes || null,
    };
    const { data, error } = await supabase
      .from("deliverables")
      .insert(payload)
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message || "Não foi possível criar o design.");
    setCreatedId(data.id);
    return data.id as string;
  }

  async function save(status = form.status) {
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
      preview_url: files[0]?.url || current?.preview_url || null,
    };
    const id = createdId ?? current?.id;
    if (!id) await supabase.from("deliverables").insert(payload);
    else await supabase.from("deliverables").update(payload).eq("id", id);
    setSaving(false);
    onSaved();
    onClose();
  }

  async function onFiles(list: FileList | null) {
    if (!list?.length) return;
    if (!canEdit) {
      setUploadError("Entre com o e-mail da equipe para enviar arquivos.");
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      const deliverableId = await ensureSaved();
      const picked = Array.from(list);
      for (const file of picked) {
        const stored = await storeImage(`designs/${deliverableId}`, file);
        const { data: row, error: insertError } = await supabase
          .from("deliverable_files")
          .insert({
            deliverable_id: deliverableId,
            url: stored.url,
            storage_path: stored.storage_path,
            file_name: stored.file_name,
          })
          .select("*")
          .single();
        if (insertError) throw new Error(insertError.message);
        if (row) setFiles((prev) => [...prev, row as DeliverableFile]);
      }
      const { data: uploaded } = await supabase
        .from("deliverable_files")
        .select("url")
        .eq("deliverable_id", deliverableId)
        .order("created_at")
        .limit(1)
        .maybeSingle();
      await supabase
        .from("deliverables")
        .update({ preview_url: uploaded?.url || null })
        .eq("id", deliverableId);
      onSaved();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Falha no envio.");
    } finally {
      setUploading(false);
    }
  }

  async function removeFile(file: DeliverableFile) {
    if (!canEdit) return;
    await supabase.from("deliverable_files").delete().eq("id", file.id);
    if (file.storage_path) {
      await supabase.storage.from("designs").remove([file.storage_path]);
    }
    const next = files.filter((item) => item.id !== file.id);
    setFiles(next);
    if (current) {
      await supabase
        .from("deliverables")
        .update({ preview_url: next[0]?.url || null })
        .eq("id", current.id);
    }
    onSaved();
  }

  const hasFiles = files.length > 0;
  const flow = [
    { label: "Arquivos enviados", done: hasFiles },
    {
      label: "Enviado para OK da gestão",
      done: ["aguardando_aprovacao", "aprovado", "postado"].includes(form.status),
    },
    { label: "Aprovado", done: form.status === "aprovado" || form.status === "postado" },
    { label: "Postado", done: form.status === "postado" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-deep/40">
      <button className="h-full flex-1" aria-label="Fechar" onClick={onClose} />
      <aside className="h-full w-full max-w-lg space-y-4 overflow-y-auto bg-pearl p-5 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl">{isNew ? "Novo design" : form.title}</h2>
          <GhostButton onClick={onClose}>Fechar</GhostButton>
        </div>

        <div className="rounded-2xl bg-white p-4">
          <p className="mb-3 text-[11px] uppercase tracking-[0.16em] text-mist">Fluxo</p>
          <ol className="space-y-2">
            {flow.map((step) => (
              <li key={step.label} className="flex items-center gap-3 text-sm">
                <span
                  className={`grid h-5 w-5 place-items-center rounded-full border text-[10px] ${
                    step.done ? "border-aqua bg-aqua text-white" : "border-mist/40 text-transparent"
                  }`}
                >
                  ✓
                </span>
                <span className={step.done ? "text-mist" : ""}>{step.label}</span>
              </li>
            ))}
          </ol>
        </div>

        <div>
          <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-mist">
            Arquivos para aprovação
          </p>
          <div className="grid grid-cols-2 gap-2">
            {files.map((file) => (
              <div key={file.id} className="relative overflow-hidden rounded-2xl bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={file.url} alt={file.file_name ?? "Prévia"} className="h-32 w-full object-cover" />
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => void removeFile(file)}
                    className="absolute right-2 top-2 rounded-full bg-deep/80 px-2 py-0.5 text-[11px] text-white"
                  >
                    Remover
                  </button>
                )}
              </div>
            ))}
          </div>
          <Field label="Adicionar arquivos">
            <input
              type="file"
              multiple
              accept="image/*"
              disabled={!canEdit || uploading}
              className="block w-full text-sm"
              onChange={(e) => {
                const selected = e.target.files;
                void onFiles(selected);
              }}
            />
            <p className="mt-1 text-xs text-mist">
              Selecione uma ou várias imagens. Elas aparecem aqui assim que salvam.
            </p>
            {uploading && <p className="text-sm text-aqua">Salvando arquivos… aguarde.</p>}
            {uploadError && (
              <p className="mt-2 rounded-xl bg-[#f8e4e2] px-3 py-2 text-sm text-clay">
                {uploadError}
              </p>
            )}
          </Field>
        </div>

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
          {canEdit && (createdId || current) && !["aguardando_aprovacao", "aprovado", "postado"].includes(form.status) && (
            <GhostButton onClick={() => save("aguardando_aprovacao")}>Pedir OK da gestão</GhostButton>
          )}
          {isGestao && form.status === "aguardando_aprovacao" && (
            <>
              <PrimaryButton onClick={() => save("aprovado")}>Aprovar design</PrimaryButton>
              <GhostButton onClick={() => save("producao")}>Pedir alteração</GhostButton>
            </>
          )}
          {canEdit && form.status === "aprovado" && (
            <PrimaryButton onClick={() => save("postado")}>Marcar como postado</PrimaryButton>
          )}
          {canEdit && form.status === "postado" && (
            <GhostButton onClick={() => save("aprovado")}>Desmarcar postado</GhostButton>
          )}
        </div>
      </aside>
    </div>
  );
}
