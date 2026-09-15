"use client";

import Link from "next/link";
import { useRetiroData } from "@/lib/use-data";
import { CHANNEL_LABEL, DELIVERABLE_STATUS_LABEL, daysUntil, formatDate } from "@/lib/labels";
import { StatusBadge } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { useRole } from "@/components/providers";
import { useState } from "react";

export default function PainelPage() {
  const { settings, posts, deliverables, loading, error, refresh } = useRetiroData();
  const { hasRole } = useRole();
  const [savingCount, setSavingCount] = useState(false);

  if (loading) return <p className="text-mist">Carregando o painel…</p>;
  if (error) return <p className="text-clay">Não foi possível carregar: {error}</p>;
  if (!settings) return null;

  const days = daysUntil(settings.event_date);
  const pending = posts.filter((p) => p.status === "aguardando_aprovacao");
  const next = posts
    .filter((p) => p.post_type === "regular" && p.status !== "publicado")
    .slice(0, 5);
  const pecasPendentes = deliverables.filter((d) => d.status !== "concluido");

  async function updateCount(value: number) {
    setSavingCount(true);
    await supabase.from("event_settings").update({ inscription_count: value }).eq("id", 1);
    setSavingCount(false);
    refresh();
  }

  return (
    <div className="space-y-8">
      <header className="overflow-hidden rounded-3xl bg-deep px-6 py-8 text-pearl shadow-card sm:px-10">
        <p className="text-[11px] uppercase tracking-[0.28em] text-gold">
          {settings.city} · {settings.venue}
        </p>
        <h1 className="font-display mt-3 text-4xl leading-none sm:text-6xl">
          {settings.theme}
        </h1>
        <p className="mt-4 max-w-2xl font-display text-xl italic text-foam/90">
          “{settings.verse_text}”
        </p>
        <p className="mt-2 text-sm text-gold">{settings.verse_ref}</p>
        <div className="mt-8 flex flex-wrap items-end gap-8">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-foam/50">Faltam</p>
            <p className="font-display text-6xl leading-none">{days}</p>
            <p className="text-sm text-foam/70">dias para 14.11.2026</p>
          </div>
          <div className="text-sm text-foam/80">
            <p>
              {settings.start_time} às {settings.end_time}
            </p>
            <p className="mt-1 max-w-sm">{settings.tagline}</p>
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-3xl bg-white p-5 shadow-card">
          <p className="text-[11px] uppercase tracking-[0.16em] text-mist">Inscritas</p>
          <div className="mt-2 flex items-end gap-3">
            <p className="font-display text-4xl">{settings.inscription_count}</p>
            {hasRole("gestao", "marketing") ? (
              <label className="text-xs text-mist">
                atualizar
                <input
                  type="number"
                  min={0}
                  defaultValue={settings.inscription_count}
                  className="ml-2 w-20 rounded-lg border border-black/10 px-2 py-1"
                  onBlur={(e) => updateCount(Number(e.target.value) || 0)}
                />
              </label>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-mist">
            {savingCount ? "Salvando…" : "Marcos: 100 · 200 · 300 · 400+"}
          </p>
        </article>
        <article className="rounded-3xl bg-white p-5 shadow-card">
          <p className="text-[11px] uppercase tracking-[0.16em] text-mist">Aguardando OK</p>
          <p className="font-display mt-2 text-4xl">{pending.length}</p>
          <Link href="/aprovacoes" className="mt-2 inline-block text-sm text-aqua underline">
            Abrir fila de aprovação
          </Link>
        </article>
        <article className="rounded-3xl bg-white p-5 shadow-card">
          <p className="text-[11px] uppercase tracking-[0.16em] text-mist">Designs em aberto</p>
          <p className="font-display mt-2 text-4xl">{pecasPendentes.length}</p>
          <Link href="/designs" className="mt-2 inline-block text-sm text-aqua underline">
            Ver designs e prévias
          </Link>
        </article>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-display text-2xl">Próximas postagens</h2>
          <Link href="/calendario" className="text-sm text-aqua underline">
            Calendário completo
          </Link>
        </div>
        <div className="overflow-hidden rounded-3xl bg-white shadow-card">
          {next.map((post) => (
            <div
              key={post.id}
              className="grid gap-2 border-b border-black/5 px-5 py-4 last:border-0 sm:grid-cols-[90px_1fr_auto] sm:items-center"
            >
              <p className="text-sm font-medium text-tide">{formatDate(post.publish_date)}</p>
              <div>
                <p className="font-medium">{post.theme}</p>
                <p className="text-sm text-mist">
                  {CHANNEL_LABEL[post.channel]} · {post.format}
                </p>
              </div>
              <StatusBadge status={post.status} />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-dashed border-tide/30 bg-white/70 p-6">
        <p className="text-[11px] uppercase tracking-[0.2em] text-aqua">Frase-chave</p>
        <p className="font-display mt-2 text-2xl sm:text-3xl">{settings.tagline}</p>
        <p className="mt-3 max-w-2xl text-sm text-mist">
          Use com discrição nas peças. A gestão precisa dar OK antes de qualquer
          produção — postagem, telão, flyer, caderneta ou lembrancinha.
        </p>
      </section>

      <section>
        <h2 className="font-display mb-3 text-2xl">Designs do evento</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {deliverables.slice(0, 6).map((item) => (
            <article key={item.id} className="rounded-2xl bg-white p-4 shadow-card">
              <p className="font-medium">{item.title}</p>
              <p className="mt-1 text-sm text-mist">
                {DELIVERABLE_STATUS_LABEL[item.status]}
                {item.due_date ? ` · até ${formatDate(item.due_date)}` : ""}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
