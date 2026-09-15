"use client";

import { useMemo, useState } from "react";
import { PostDrawer } from "@/components/post-drawer";
import { GhostButton, PrimaryButton, StatusBadge } from "@/components/ui";
import { useRole } from "@/components/providers";
import { useRetiroData } from "@/lib/use-data";
import {
  CHANNEL_LABEL,
  STAGE_BLURB,
  STAGE_LABEL,
  formatDate,
} from "@/lib/labels";
import type { EditorialPost } from "@/lib/types";

const STAGE_ORDER = [
  "curiosidade",
  "identificacao",
  "decisao",
  "pertencimento",
  "expectativa",
  "experiencia",
  "marco",
];

export default function CalendarioPage() {
  const { posts, steps, members, loading, error, refresh } = useRetiroData();
  const { role } = useRole();
  const [open, setOpen] = useState<EditorialPost | "new" | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("todos");
  const [channel, setChannel] = useState("todos");

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      const q = query.toLowerCase();
      const hit =
        !q ||
        p.theme.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q);
      const st = status === "todos" || p.status === status;
      const ch = channel === "todos" || p.channel === channel;
      return hit && st && ch;
    });
  }, [posts, query, status, channel]);

  const grouped = STAGE_ORDER.map((stage) => ({
    stage,
    items: filtered.filter((p) => p.campaign_stage === stage),
  })).filter((g) => g.items.length);

  if (loading) return <p className="text-mist">Carregando calendário…</p>;
  if (error) return <p className="text-clay">{error}</p>;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-aqua">
            17/09 a 14/11
          </p>
          <h1 className="font-display text-4xl">Calendário editorial</h1>
          <p className="mt-2 max-w-xl text-mist">
            Editável pela equipe. Produção só depois do OK da gestão principal.
          </p>
        </div>
        <PrimaryButton onClick={() => setOpen("new")}>Nova publicação</PrimaryButton>
      </header>

      <div className="flex flex-wrap gap-2">
        <input
          placeholder="Buscar tema ou conteúdo"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-w-[200px] flex-1 rounded-full border border-black/10 bg-white px-4 py-2 text-sm"
        />
        <select
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
          className="rounded-full border border-black/10 bg-white px-3 py-2 text-sm"
        >
          <option value="todos">Todos os canais</option>
          <option value="feed">Feed</option>
          <option value="stories">Stories</option>
          <option value="feed_stories">Feed + Stories</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-full border border-black/10 bg-white px-3 py-2 text-sm"
        >
          <option value="todos">Todos os status</option>
          <option value="rascunho">Rascunho</option>
          <option value="em_producao">Em produção</option>
          <option value="aguardando_aprovacao">Aguardando OK</option>
          <option value="aprovado">Aprovado</option>
          <option value="publicado">Publicado</option>
          <option value="alteracao_solicitada">Alteração pedida</option>
        </select>
        <GhostButton
          onClick={() => {
            setQuery("");
            setStatus("todos");
            setChannel("todos");
          }}
        >
          Limpar
        </GhostButton>
      </div>

      {grouped.map((group) => (
        <section key={group.stage} className="space-y-3">
          <div>
            <h2 className="font-display text-2xl">{STAGE_LABEL[group.stage]}</h2>
            <p className="text-sm text-mist">{STAGE_BLURB[group.stage]}</p>
          </div>
          <div className="overflow-hidden rounded-3xl bg-white shadow-card">
            <div className="hidden grid-cols-[88px_110px_1fr_160px_120px] gap-3 border-b border-black/5 px-5 py-2 text-[11px] uppercase tracking-[0.14em] text-mist md:grid">
              <span>Data</span>
              <span>Canal</span>
              <span>Tema</span>
              <span>Formato</span>
              <span>Status</span>
            </div>
            {group.items.map((post) => (
              <button
                key={post.id}
                type="button"
                onClick={() => setOpen(post)}
                className="grid w-full gap-1 border-b border-black/5 px-5 py-4 text-left last:border-0 hover:bg-foam/40 md:grid-cols-[88px_110px_1fr_160px_120px] md:items-center"
              >
                <span className="text-sm font-medium text-tide">
                  {formatDate(post.publish_date)}
                </span>
                <span className="text-sm">{CHANNEL_LABEL[post.channel]}</span>
                <span>
                  <span className="block font-medium">{post.theme}</span>
                  <span className="block text-sm text-mist line-clamp-1">
                    {post.content}
                  </span>
                </span>
                <span className="text-sm text-mist">{post.format}</span>
                <StatusBadge status={post.status} />
              </button>
            ))}
          </div>
        </section>
      ))}

      {open && (
        <PostDrawer
          post={open}
          steps={
            open === "new" ? [] : steps.filter((s) => s.post_id === open.id)
          }
          members={members}
          role={role}
          onClose={() => setOpen(null)}
          onSaved={refresh}
        />
      )}
    </div>
  );
}
