import type { DeliverableStatus, PostStatus, Role } from "./types";

export const STAGE_LABEL: Record<string, string> = {
  curiosidade: "1. Curiosidade",
  identificacao: "2. Identificação",
  decisao: "3. Decisão",
  pertencimento: "4. Pertencimento",
  expectativa: "5. Expectativa",
  experiencia: "6. Experiência",
  marco: "Marcos de inscrição",
};

export const STAGE_BLURB: Record<string, string> = {
  curiosidade: "Há um chamado.",
  identificacao: "Jesus ainda chama mulheres para fora do barco.",
  decisao: "Tenha coragem de sair do barco.",
  pertencimento: "Estamos nos preparando e orando por você.",
  expectativa: "Mantenha os olhos em Jesus.",
  experiencia: "Sobre as Águas — chegou o dia.",
  marco: "Celebrar números como histórias, não como meta.",
};

export const POST_STATUS_LABEL: Record<PostStatus, string> = {
  rascunho: "Rascunho",
  briefing: "Briefing",
  em_producao: "Em produção",
  aguardando_aprovacao: "Aguardando OK",
  aprovado: "Aprovado",
  publicado: "Publicado",
  alteracao_solicitada: "Alteração pedida",
};

export const DELIVERABLE_STATUS_LABEL: Record<DeliverableStatus, string> = {
  nao_iniciado: "Não iniciado",
  briefing: "Briefing",
  producao: "Em produção",
  aguardando_aprovacao: "Aguardando OK",
  aprovado: "Aprovado",
  postado: "Postado",
  concluido: "Concluído",
};

export const CHANNEL_LABEL: Record<string, string> = {
  feed: "Feed",
  stories: "Stories",
  feed_stories: "Feed + Stories",
};

export const CATEGORY_LABEL: Record<string, string> = {
  identidade: "Identidade",
  digital: "Digital",
  flyer: "Impressos",
  press_kit: "Press kit",
  caderneta: "Cadernetas",
  lembrancinha: "Lembrancinhas",
  telao: "Telão",
  ambientacao: "Ambientação",
  equipe: "Equipe",
};

export const ROLE_LABEL: Record<Role, string> = {
  gestao: "Gestão principal",
  marketing: "Marketing",
  design: "Design",
  redacao: "Redação",
  audiovisual: "Audiovisual",
};

export const VIEW_ROLES: { id: Role; hint: string }[] = [
  { id: "gestao", hint: "Aprova produção e edita tudo" },
  { id: "marketing", hint: "Briefing, prazos e envio para OK" },
  { id: "design", hint: "Peças visuais e etapas de arte" },
];

export function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

export function formatDateLong(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "long",
  });
}

export function daysUntil(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const target = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

export const POST_STATUS_TONE: Record<PostStatus, string> = {
  rascunho: "bg-foam text-tide",
  briefing: "bg-[#e8efe4] text-[#3d5a3a]",
  em_producao: "bg-[#e7eef6] text-[#2d4a6f]",
  aguardando_aprovacao: "bg-[#f7ead0] text-[#7a5a12]",
  aprovado: "bg-[#e2f0e4] text-[#2f6b3a]",
  publicado: "bg-tide text-white",
  alteracao_solicitada: "bg-[#f8e4e2] text-clay",
};
