"use client";

import { useState } from "react";
import { PostDrawer } from "@/components/post-drawer";
import { useRole } from "@/components/providers";
import { StatusBadge } from "@/components/ui";
import { useRetiroData } from "@/lib/use-data";
import { CHANNEL_LABEL, DELIVERABLE_STATUS_LABEL, formatDate } from "@/lib/labels";
import type { EditorialPost } from "@/lib/types";
import { supabase } from "@/lib/supabase";

export default function AprovacoesPage() {
  const { posts, steps, members, deliverables, loading, error, refresh } = useRetiroData();
  const { role } = useRole();
  const [open, setOpen] = useState<EditorialPost | null>(null);
  const isGestao = role === "gestao";

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

  return (
    <div className="space-y-8">
      <header>
        <p className="text-[11px] uppercase tracking-[0.2em] text-aqua">
          Gestão principal
        </p>
        <h1 className="font-display text-4xl">Aprovações</h1>
        <p className="mt-2 max-w-xl text-mist">
          Nada vai para produção sem este OK — postagens, telão, lembrancinhas,
          press kit, cadernetas e flyers.
        </p>
        {!isGestao && (
          <p className="mt-3 rounded-xl bg-[#f7ead0] px-4 py-2 text-sm text-[#7a5a12]">
            Você está como {role}. Troque para Gestão principal no menu para aprovar.
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
        <h2 className="font-display mb-3 text-2xl">Peças e materiais</h2>
        {pecaQueue.length === 0 ? (
          <p className="rounded-3xl bg-white p-6 text-mist shadow-card">
            Nenhuma peça esperando OK agora.
          </p>
        ) : (
          <div className="grid gap-3">
            {pecaQueue.map((item) => (
              <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-white p-5 shadow-card">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-mist">{item.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-mist">{DELIVERABLE_STATUS_LABEL[item.status]}</span>
                  {isGestao && (
                    <button
                      type="button"
                      onClick={() => approvePeca(item.id)}
                      className="rounded-full bg-tide px-4 py-2 text-sm text-white"
                    >
                      Aprovar
                    </button>
                  )}
                </div>
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
          role={role}
          onClose={() => setOpen(null)}
          onSaved={refresh}
        />
      )}
    </div>
  );
}
