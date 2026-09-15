"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { EditorialPost, PostStatus, ProductionStep, Role, TeamMember } from "@/lib/types";
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
  role: Role;
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

export function PostDrawer({ post, steps, members, role, onClose, onSaved }: Props) {
  const isNew = post === "new";
  const current = post && post !== "new" ? post : null;
  const [form, setForm] = useState(emptyPost);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const canEdit = role === "gestao" || role === "marketing" || role === "design";
  const isGestao = role === "gestao";

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
    } else {
      setForm(emptyPost);
    }
  }, [current, isNew]);

  const orderedSteps = useMemo(
    () => [...steps].sort((a, b) => a.sort_order - b.sort_order),
    [steps],
  );

  if (!post) return null;

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

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

    if (isNew) {
      const { data, error } = await supabase
        .from("editorial_posts")
        .insert({ ...payload, status: "rascunho", sort_order: 500 })
        .select("id")
        .single();
      if (!error && data) {
        await supabase.from("production_steps").insert([
          { post_id: data.id, step_key: "briefing", label: "Briefing", sort_order: 0 },
          { post_id: data.id, step_key: "copy", label: "Texto / copy", sort_order: 1 },
          { post_id: data.id, step_key: "design", label: "Design", sort_order: 2 },
          { post_id: data.id, step_key: "revisao", label: "Revisão da equipe", sort_order: 3 },
          { post_id: data.id, step_key: "aprovacao", label: "Aprovação da gestão", sort_order: 4 },
          { post_id: data.id, step_key: "publicacao", label: "Publicação", sort_order: 5 },
        ]);
      }
    } else if (current) {
      await supabase.from("editorial_posts").update(payload).eq("id", current.id);
    }
    setSaving(false);
    onSaved();
    if (isNew) onClose();
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
    if (!current) return;
    await save({
      status: "aguardando_aprovacao",
      approval_comment: comment || null,
    });
  }

  async function approve() {
    if (!current || !isGestao) return;
    await supabase
      .from("production_steps")
      .update({ done: true, done_at: new Date().toISOString() })
      .eq("post_id", current.id)
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
              disabled={!(role === "gestao" || role === "marketing" || role === "redacao")}
              onChange={(e) => set("copy_text", e.target.value)}
            />
          </Field>
          <Field label="Notas de design">
            <textarea
              rows={3}
              className={inputClass}
              value={form.design_notes}
              disabled={!(role === "gestao" || role === "design" || role === "marketing")}
              onChange={(e) => set("design_notes", e.target.value)}
            />
          </Field>

          {!isNew && (
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

          <div className="flex flex-wrap gap-2 border-t border-black/5 pt-4">
            <PrimaryButton disabled={!canEdit || saving} onClick={() => save()}>
              {saving ? "Salvando…" : "Salvar alterações"}
            </PrimaryButton>
            {!isNew && (role === "marketing" || role === "design" || isGestao) &&
              current &&
              current.status !== "publicado" &&
              current.status !== "aguardando_aprovacao" && (
                <GhostButton onClick={requestApproval}>Enviar para OK da gestão</GhostButton>
              )}
            {isGestao && current?.status === "aguardando_aprovacao" && (
              <>
                <PrimaryButton onClick={approve}>Aprovar produção</PrimaryButton>
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
    </div>
  );
}
