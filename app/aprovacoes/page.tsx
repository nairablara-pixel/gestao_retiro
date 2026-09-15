"use client";

import { useState } from "react";
import { PostDrawer } from "@/components/post-drawer";
import { useAuth } from "@/components/providers";
import { StatusBadge } from "@/components/ui";
import { useRetiroData } from "@/lib/use-data";
import { CHANNEL_LABEL, DELIVERABLE_STATUS_LABEL, formatDate } from "@/lib/labels";
import type { EditorialPost } from "@/lib/types";
import { supabase } from "@/lib/supabase";

export default function AprovacoesPage() {
  const { posts, steps, members, deliverables, loading, error, refresh } = useRetiroData();
  const { role, isAdmin, hasRole } = useAuth();
  const [open, setOpen] = useState<EditorialPost | null>(null);
  const isGestao = isAdmin;

  if (loading) return <p className="text-mist">Carregando aprovações…</p>;
  if (error) return <p className="text-clay">{error}</p>;

  const postQueue = posts.filter((p) =>
    ["aguardando_aprovacao", "alteracao_solicitada"].includes(p.status),
  );
  const pecaQueue = deliverables.filter((d) => d.status === "aguardando_aprovacao");

  async function approvePeca(id: string) {
    if (!isGestao) return;
    await supabase.from("deliverables").update({ status: "aprovado" }).eq("id", id);
    refresh();
  }

  async function markPosted(id: string) {
    if (!hasRole("gestao", "marketing", "design")) return;
    await supabase.from("deliverables").update({ status: "postado" }).eq("id", id);
    refresh();
  }

  const approvedQueue = deliverables.filter((d) => d.status === "aprovado");

  return (
    <div className="space-y-8">
      <header>
        <p className="text-[11px] uppercase tracking-[0.2em] text-aqua">
          Gestão principal
        </p>
        <h1 className="font-display text-4xl">Aprovações</h1>
        <p className="mt-2 max-w-xl text-mist">
          Veja todos os arquivos, dê o OK e depois marque como postado.
        </p>
        {!role && (
          <p className="mt-3 rounded-xl bg-[#f7ead0] px-4 py-2 text-sm text-[#7a5a12]">
            Entre com o e-mail cadastrado na equipe para enviar ou aprovar.{" "}
            <a href="/login" className="underline">Entrar</a>
          </p>
        )}
        {role && !isGestao && (
          <p className="mt-3 rounded-xl bg-[#f7ead0] px-4 py-2 text-sm text-[#7a5a12]">
            Quem aprova é a gestão principal. Seu acesso atual não inclui o OK final.
          </p>
        )}
      </header>

      <section>
        <h2 className="font-display mb-3 text-2xl">Postagens</h2>
        {postQueue.length === 0 ? (
          <p className="rounded-3xl bg-white p-6 text-mist shadow-card">
            Nenhuma postagem esperando OK agora.
          </p>
        ) : (
          <div className="overflow-hidden rounded-3xl bg-white shadow-card">
            {postQueue.map((post) => (
              <button
                key={post.id}
                type="button"
                onClick={() => setOpen(post)}
                className="flex w-full flex-wrap items-center justify-between gap-3 border-b border-black/5 px-5 py-4 text-left last:border-0 hover:bg-foam/40"
              >
                <div>
                  <p className="font-medium">{post.theme}</p>
                  <p className="text-sm text-mist">
                    {formatDate(post.publish_date)} · {CHANNEL_LABEL[post.channel]}
                  </p>
                </div>
                <StatusBadge status={post.status} />
              </button>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display mb-3 text-2xl">Designs aguardando OK</h2>
        {pecaQueue.length === 0 ? (
          <p className="rounded-3xl bg-white p-6 text-mist shadow-card">
            Nenhum design esperando OK agora.
          </p>
        ) : (
          <div className="grid gap-3">
            {pecaQueue.map((item) => (
              <article key={item.id} className="rounded-3xl bg-white p-5 shadow-card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-mist">{item.description}</p>
                  </div>
                  <span className="text-sm text-mist">{DELIVERABLE_STATUS_LABEL[item.status]}</span>
                </div>
                {item.files && item.files.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {item.files.map((file) => (
                      <a key={file.id} href={file.url} target="_blank" rel="noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={file.url} alt={file.file_name ?? ""} className="h-24 w-full rounded-xl object-cover" />
                      </a>
                    ))}
                  </div>
                )}
                {isGestao && (
                  <button
                    type="button"
                    onClick={() => approvePeca(item.id)}
                    className="mt-4 rounded-full bg-tide px-4 py-2 text-sm text-white"
                  >
                    Aprovar todos os arquivos
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display mb-3 text-2xl">Aprovados — marcar postado</h2>
        {approvedQueue.length === 0 ? (
          <p className="rounded-3xl bg-white p-6 text-mist shadow-card">
            Nenhum design aprovado esperando publicação.
          </p>
        ) : (
          <div className="grid gap-3">
            {approvedQueue.map((item) => (
              <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-white p-5 shadow-card">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-mist">
                    {item.files?.length ?? 0} arquivo(s) aprovados
                  </p>
                </div>
                {hasRole("gestao", "marketing", "design") && (
                  <button
                    type="button"
                    onClick={() => markPosted(item.id)}
                    className="rounded-full bg-tide px-4 py-2 text-sm text-white"
                  >
                    Marcar como postado
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {open && (
        <PostDrawer
          post={open}
          steps={steps.filter((s) => s.post_id === open.id)}
          members={members}
          onClose={() => setOpen(null)}
          onSaved={refresh}
        />
      )}
    </div>
  );
}
