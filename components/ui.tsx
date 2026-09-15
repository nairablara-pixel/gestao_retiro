import type { PostStatus } from "@/lib/types";
import { POST_STATUS_LABEL, POST_STATUS_TONE } from "@/lib/labels";

export function StatusBadge({ status }: { status: PostStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ${POST_STATUS_TONE[status]}`}
    >
      {POST_STATUS_LABEL[status]}
    </span>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-mist">
        {label}
      </span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none ring-gold/40 focus:ring-2";

export function PrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-full bg-tide px-4 py-2 text-sm font-medium text-white hover:bg-deep disabled:opacity-40 ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-full border border-black/10 bg-white px-4 py-2 text-sm hover:bg-foam ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}
