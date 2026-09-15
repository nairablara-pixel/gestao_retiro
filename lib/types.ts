export type Role = "gestao" | "marketing" | "design" | "redacao" | "audiovisual";

export type PostStatus =
  | "rascunho"
  | "briefing"
  | "em_producao"
  | "aguardando_aprovacao"
  | "aprovado"
  | "publicado"
  | "alteracao_solicitada";

export type DeliverableStatus =
  | "nao_iniciado"
  | "briefing"
  | "producao"
  | "aguardando_aprovacao"
  | "aprovado"
  | "postado"
  | "concluido";

export type DeliverableFile = {
  id: string;
  deliverable_id: string;
  url: string;
  storage_path: string | null;
  file_name: string | null;
};

export type TeamMember = {
  id: string;
  name: string;
  role: Role;
  title: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  color: string;
  has_password?: boolean;
  roles?: Role[];
};

export type Deliverable = {
  id: string;
  title: string;
  category: string;
  description: string | null;
  status: DeliverableStatus;
  assignee_id: string | null;
  due_date: string | null;
  quantity: string | null;
  notes: string | null;
  preview_url: string | null;
  files?: DeliverableFile[];
};

export type EditorialPost = {
  id: string;
  publish_date: string;
  channel: string;
  format: string;
  theme: string;
  content: string;
  cta: string | null;
  campaign_stage: string;
  post_type: "regular" | "marco";
  status: PostStatus;
  assignee_id: string | null;
  briefing: string | null;
  copy_text: string | null;
  design_notes: string | null;
  approval_comment: string | null;
  approved_by: string | null;
  approved_at: string | null;
  sort_order: number;
};

export type ProductionStep = {
  id: string;
  post_id: string;
  step_key: string;
  label: string;
  done: boolean;
  done_at: string | null;
  sort_order: number;
};

export type EventSettings = {
  id: number;
  name: string;
  theme: string;
  verse_ref: string;
  verse_text: string;
  tagline: string;
  event_date: string;
  start_time: string;
  end_time: string;
  venue: string;
  city: string;
  inscription_count: number;
  instagram_handle: string | null;
};
