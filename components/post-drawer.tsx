"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { EditorialPost, PostFile, PostStatus, ProductionStep, TeamMember } from "@/lib/types";
import { useAuth } from "./providers";
import {
  CHANNEL_LABEL,
  ROLE_LABEL,
  STAGE_LABEL,
  formatDateLong,
} from "@/lib/labels";
import { Field, GhostButton, PrimaryButton, StatusBadge, inputClass } from "./ui";

const CHANNELS = ["feed", "stories", "feed_stories"];
const STAGES = Object.keys(STAGE_LABEL);

type Props = {
  post: EditorialPost | "new" | null;
  steps: ProductionStep[];
  members: TeamMember[];
  onClose: () => void;
  onSaved: () => void;
};

const emptyPost = {
  publish_date: new Date().toISOString().slice(0, 10),
  channel: "feed",
  format: "Arte",
  theme: "",
  content: "",
  cta: "",
  campaign_stage: "curiosidade",
  post_type: "regular" as "regular" | "marco",
  status: "rascunho" as PostStatus,
  assignee_id: "",
  briefing: "",
  copy_text: "",
  design_notes: "",
  approval_comment: "",
};

export function PostDrawer({ post, steps, members, onClose, onSaved }: Props) {
  const { hasRole, isAdmin } = useAuth();
  const isNew = post === "new";
  const current = post && post !== "new" ? post : null;
  const [createdId, setCreatedId] = useState<string | null>(current?.id ?? null);
  const [form, setForm] = useState(emptyPost);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [files, setFiles] = useState<PostFile[]>(current?.files ?? []);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [viewer, setViewer] = useState<PostFile | null>(null);
  const canEdit = hasRole("gestao", "marketing", "design");
  const canSendApproval = canEdit;
  const isGestao = isAdmin;
  const postId = createdId ?? current?.id ?? null;

  async function loadFiles(id: string) {
    const { data, error } = await supabase
      .from("editorial_post_files")
      .select("*")
      .eq("post_id", id)
      .order("created_at");
    if (error) {
      setUploadError(error.message);
      return;
    }
    setFiles((data as PostFile[]) ?? []);
  }

  useEffect(() => {
    if (current) {
      setForm({
        publish_date: current.publish_date,
        channel: current.channel,
        format: current.format,
        theme: current.theme,
        content: current.content,
        cta: current.cta ?? "",
        campaign_stage: current.campaign_stage,
        post_type: current.post_type,
        status: current.status,
        assignee_id: current.assignee_id ?? "",
        briefing: current.briefing ?? "",
        copy_text: current.copy_text ?? "",
        design_notes: current.design_notes ?? "",
        approval_comment: current.approval_comment ?? "",
      });
      setComment("");
      setCreatedId(current.id);
      void loadFiles(current.id);
    } else {
      setForm(emptyPost);
      setFiles([]);
      setCreatedId(null);
    }
  }, [current?.id, isNew]);

  const orderedSteps = useMemo(
    () => [...steps].sort((a, b) => a.sort_order - b.sort_order),
    [steps],
  );

  if (!post) return null;

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function ensureSaved() {
    if (createdId) return createdId;
    const payload = {
      publish_date: form.publish_date,
      channel: form.channel,
      format: form.format,
      theme: form.theme || "Nova publicação",
      content: form.content,
      cta: form.cta || null,
      campaign_stage: form.campaign_stage,
      post_type: form.post_type,
      assignee_id: form.assignee_id || null,
      briefing: form.briefing || null,
      copy_text: form.copy_text || null,
      design_notes: form.design_notes || null,
      status: "rascunho",
      sort_order: 500,
    };
    const { data, error } = await supabase
      .from("editorial_posts")
      .insert(payload)
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message || "Não foi possível criar a publicação.");
    await supabase.from("production_steps").insert([
      { post_id: data.id, step_key: "briefing", label: "Briefing", sort_order: 0 },
      { post_id: data.id, step_key: "copy", label: "Texto / copy", sort_order: 1 },
      { post_id: data.id, step_key: "design", label: "Design", sort_order: 2 },
      { post_id: data.id, step_key: "revisao", label: "Revisão da equipe", sort_order: 3 },
      { post_id: data.id, step_key: "aprovacao", label: "Aprovação da gestão", sort_order: 4 },
      { post_id: data.id, step_key: "publicacao", label: "Publicação", sort_order: 5 },
    ]);
    setCreatedId(data.id);
    return data.id as string;
  }

  async function save(extra: Partial<EditorialPost> = {}) {
    setSaving(true);
    const payload = {
      publish_date: form.publish_date,
      channel: form.channel,
      format: form.format,
      theme: form.theme,
      content: form.content,
      cta: form.cta || null,
      campaign_stage: form.campaign_stage,
      post_type: form.post_type,
      assignee_id: form.assignee_id || null,
      briefing: form.briefing || null,
      copy_text: form.copy_text || null,
      design_notes: form.design_notes || null,
      ...extra,
    };

    const id = createdId ?? current?.id;
    if (!id) {
      const newId = await ensureSaved();
      await supabase.from("editorial_posts").update(payload).eq("id", newId);
    } else {
      await supabase.from("editorial_posts").update(payload).eq("id", id);
    }
    setSaving(false);
    onSaved();
  }

  async function onFiles(list: FileList | null) {
    if (!list?.length || !canEdit) return;
    setUploading(true);
    setUploadError(null);
    try {
      const postId = await ensureSaved();
      for (const file of Array.from(list)) {
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `posts/${postId}/${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("designs").upload(path, file, {
          upsert: true,
          contentType: file.type,
        });
        if (error) throw error;
        const { data } = supabase.storage.from("designs").getPublicUrl(path);
        const { error: insertError } = await supabase
          .from("editorial_post_files")
          .insert({
            post_id: postId,
            url: data.publicUrl,
            storage_path: path,
            file_name: file.name,
          });
        if (insertError) throw insertError;
      }
      await loadFiles(postId);
      await supabase
        .from("production_steps")
        .update({ done: true, done_at: new Date().toISOString() })
        .eq("post_id", postId)
        .eq("step_key", "design");
      onSaved();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Falha no envio da arte.");
    } finally {
      setUploading(false);
    }
  }

  async function removeFile(file: PostFile) {
    if (!canEdit) return;
    await supabase.from("editorial_post_files").delete().eq("id", file.id);
    if (file.storage_path) {
      await supabase.storage.from("designs").remove([file.storage_path]);
    }
    setFiles((prev) => prev.filter((item) => item.id !== file.id));
    onSaved();
  }

  async function toggleStep(step: ProductionStep) {
    if (!canEdit) return;
    const done = !step.done;
    await supabase
      .from("production_steps")
      .update({ done, done_at: done ? new Date().toISOString() : null })
      .eq("id", step.id);
    if (current && done && current.status === "rascunho") {
      await supabase.from("editorial_posts").update({ status: "em_producao" }).eq("id", current.id);
    }
    onSaved();
  }

  async function requestApproval() {
    if (!(createdId ?? current?.id)) return;
    await save({
      status: "aguardando_aprovacao",
      approval_comment: comment || null,
    });
  }

  async function approve() {
    if (!postId || !isGestao) return;
    await supabase
      .from("production_steps")
      .update({ done: true, done_at: new Date().toISOString() })
      .eq("post_id", postId)
      .eq("step_key", "aprovacao");
    await save({
      status: "aprovado",
      approved_by: ROLE_LABEL.gestao,
      approved_at: new Date().toISOString(),
      approval_comment: comment || "Aprovado para produção / publicação.",
    });
  }

  async function requestChanges() {
    if (!current || !isGestao) return;
    await supabase
      .from("production_steps")
      .update({ done: false, done_at: null })
      .eq("post_id", current.id)
      .eq("step_key", "aprovacao");
    await save({
      status: "alteracao_solicitada",
      approved_by: null,
      approved_at: null,
      approval_comment: comment || "Gestão pediu alteração antes de produzir.",
    });
  }

  async function markPublished() {
    if (!current) return;
    await supabase
      .from("production_steps")
      .update({ done: true, done_at: new Date().toISOString() })
      .eq("post_id", current.id)
      .eq("step_key", "publicacao");
    await save({ status: "publicado" });
  }

  async function removePost() {
    if (!current || !isGestao) return;
    if (!window.confirm("Excluir esta publicação do calendário?")) return;
    await supabase.from("editorial_posts").delete().eq("id", current.id);
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-deep/40">
      <button className="h-full flex-1" aria-label="Fechar" onClick={onClose} />
      <aside className="h-full w-full max-w-xl overflow-y-auto bg-pearl shadow-card">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-black/5 bg-pearl/95 px-5 py-4 backdrop-blur">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-aqua">
              {isNew ? "Nova publicação" : formatDateLong(form.publish_date)}
            </p>
            <h2 className="font-display text-2xl leading-tight">
              {form.theme || "Sem título"}
            </h2>
            {!isNew && current && (
              <div className="mt-2">
                <StatusBadge status={current.status} />
              </div>
            )}
          </div>
          <GhostButton onClick={onClose}>Fechar</GhostButton>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="rounded-2xl border border-black/5 bg-white p-4">
            <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-mist">
              Arte da publicação
            </p>
            {files.length > 0 ? (
              <div className="mb-3 grid grid-cols-2 gap-2">
                {files.map((file) => (
                  <div key={file.id} className="relative overflow-hidden rounded-2xl bg-foam">
                    <button
                      type="button"
                      className="block w-full"
                      onClick={() => setViewer(file)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={file.url} alt={file.file_name ?? "Arte"} className="h-36 w-full object-cover" />
                    </button>
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
            ) : (
              <p className="mb-3 rounded-xl bg-foam px-3 py-4 text-center text-sm text-mist">
                Nenhuma arte enviada ainda. A gestão precisa ver a imagem para aprovar.
              </p>
            )}
            <Field label="Adicionar arte">
              <input
                type="file"
                multiple
                accept="image/*"
                disabled={!canEdit}
                className="block w-full text-sm"
                onChange={(e) => {
                  void onFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <p className="mt-1 text-xs text-mist">
                Clique na imagem para abrir em tamanho grande. Pode enviar várias.
              </p>
              {uploading && <p className="text-sm text-aqua">Enviando arte…</p>}
              {uploadError && <p className="text-sm text-clay">{uploadError}</p>}
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Data">
              <input
                type="date"
                className={inputClass}
                value={form.publish_date}
                disabled={!canEdit}
                onChange={(e) => set("publish_date", e.target.value)}
              />
            </Field>
            <Field label="Canal">
              <select
                className={inputClass}
                value={form.channel}
                disabled={!canEdit}
                onChange={(e) => set("channel", e.target.value)}
              >
                {CHANNELS.map((c) => (
                  <option key={c} value={c}>
                    {CHANNEL_LABEL[c]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Formato">
              <input
                className={inputClass}
                value={form.format}
                disabled={!canEdit}
                onChange={(e) => set("format", e.target.value)}
              />
            </Field>
            <Field label="Etapa da campanha">
              <select
                className={inputClass}
                value={form.campaign_stage}
                disabled={!canEdit}
                onChange={(e) => set("campaign_stage", e.target.value)}
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {STAGE_LABEL[s]}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Tema">
            <input
              className={inputClass}
              value={form.theme}
              disabled={!canEdit}
              onChange={(e) => set("theme", e.target.value)}
            />
          </Field>
          <Field label="Conteúdo / direcionamento">
            <textarea
              rows={3}
              className={inputClass}
              value={form.content}
              disabled={!canEdit}
              onChange={(e) => set("content", e.target.value)}
            />
          </Field>
          <Field label="CTA / interação">
            <input
              className={inputClass}
              value={form.cta}
              disabled={!canEdit}
              onChange={(e) => set("cta", e.target.value)}
            />
          </Field>
          <Field label="Responsável">
            <select
              className={inputClass}
              value={form.assignee_id}
              disabled={!canEdit}
              onChange={(e) => set("assignee_id", e.target.value)}
            >
              <option value="">Sem responsável</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} · {m.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Briefing">
            <textarea
              rows={3}
              className={inputClass}
              value={form.briefing}
              disabled={!canEdit}
              onChange={(e) => set("briefing", e.target.value)}
            />
          </Field>
          <Field label="Texto / copy">
            <textarea
              rows={3}
              className={inputClass}
              value={form.copy_text}
              disabled={!hasRole("gestao", "marketing", "redacao")}
              onChange={(e) => set("copy_text", e.target.value)}
            />
          </Field>
          <Field label="Notas de design">
            <textarea
              rows={3}
              className={inputClass}
              value={form.design_notes}
              disabled={!hasRole("gestao", "design", "marketing")}
              onChange={(e) => set("design_notes", e.target.value)}
            />
          </Field>

          {(postId) && (
            <div className="rounded-2xl border border-black/5 bg-white p-4">
              <p className="mb-3 text-[11px] uppercase tracking-[0.16em] text-mist">
                Etapas de produção
              </p>
              <ol className="space-y-2">
                {orderedSteps.map((step) => (
                  <li key={step.id}>
                    <button
                      type="button"
                      onClick={() => toggleStep(step)}
                      className="flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left hover:bg-foam/60"
                    >
                      <span
                        className={`grid h-5 w-5 place-items-center rounded-full border text-[10px] ${
                          step.done
                            ? "border-aqua bg-aqua text-white"
                            : "border-mist/40 text-transparent"
                        }`}
                      >
                        ✓
                      </span>
                      <span className={step.done ? "text-mist line-through" : ""}>
                        {step.label}
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {current?.approval_comment && (
            <p className="rounded-xl bg-white px-3 py-2 text-sm text-mist">
              Último recado da gestão: {current.approval_comment}
            </p>
          )}

          <Field label="Recado para a gestão / equipe">
            <textarea
              rows={2}
              className={inputClass}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ex.: artes prontas no Drive, falta só o OK."
            />
          </Field>

          {!canEdit && (
            <p className="rounded-xl bg-[#f7ead0] px-4 py-2 text-sm text-[#7a5a12]">
              Entre com o e-mail cadastrado na equipe para salvar, enviar para
              OK ou aprovar.{" "}
              <a href="/login" className="underline">
                Entrar
              </a>
            </p>
          )}

          <div className="flex flex-wrap gap-2 border-t border-black/5 pt-4">
            <PrimaryButton disabled={!canEdit || saving} onClick={() => save()}>
              {saving ? "Salvando…" : "Salvar alterações"}
            </PrimaryButton>
            {!isNew &&
              canSendApproval &&
              current &&
              current.status !== "publicado" &&
              current.status !== "aguardando_aprovacao" && (
                <GhostButton onClick={requestApproval}>Enviar para OK da gestão</GhostButton>
              )}
            {isGestao && (current?.status === "aguardando_aprovacao" || form.status === "aguardando_aprovacao") && (
              <>
                <PrimaryButton onClick={approve}>Aprovar arte e publicação</PrimaryButton>
                <GhostButton onClick={requestChanges}>Pedir alteração</GhostButton>
              </>
            )}
            {current &&
              (current.status === "aprovado" || current.status === "publicado") &&
              canEdit && (
                <GhostButton onClick={markPublished}>Marcar como publicado</GhostButton>
              )}
            {isGestao && current && (
              <button
                type="button"
                onClick={removePost}
                className="ml-auto text-sm text-clay hover:underline"
              >
                Excluir
              </button>
            )}
          </div>
        </div>
      </aside>
      {viewer && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-deep/80 p-4">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Fechar arte"
            onClick={() => setViewer(null)}
          />
          <div className="relative z-10 max-h-[90vh] w-full max-w-3xl overflow-auto rounded-3xl bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={viewer.url} alt={viewer.file_name ?? "Arte"} className="mx-auto max-h-[80vh] w-auto max-w-full object-contain" />
            <div className="mt-3 flex justify-end gap-2">
              <a href={viewer.url} target="_blank" rel="noreferrer" className="rounded-full border border-black/10 px-4 py-2 text-sm">
                Abrir original
              </a>
              <GhostButton onClick={() => setViewer(null)}>Fechar</GhostButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
