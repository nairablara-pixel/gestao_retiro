"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRole } from "./providers";
import { ROLE_LABEL, VIEW_ROLES } from "@/lib/labels";

const NAV = [
  { href: "/", label: "Painel" },
  { href: "/calendario", label: "Calendário" },
  { href: "/pecas", label: "Peças" },
  { href: "/equipe", label: "Equipe" },
  { href: "/aprovacoes", label: "Aprovações" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { role, setRole } = useRole();

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="relative overflow-hidden bg-deep text-foam lg:min-h-screen">
        <div className="pointer-events-none absolute -left-16 top-24 h-56 w-56 rounded-full bg-aqua/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 bottom-10 h-40 w-40 rounded-full bg-gold/20 blur-3xl" />
        <div className="relative flex items-center justify-between px-5 py-5 lg:block lg:px-6 lg:py-8">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-gold">
              Santa Maria · 14.11
            </p>
            <p className="font-display mt-1 text-2xl leading-none text-pearl">
              Sobre as Águas
            </p>
            <p className="mt-2 hidden max-w-[16rem] text-sm text-foam/70 lg:block">
              Gestão de marketing do retiro de mulheres.
            </p>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:gap-1 lg:px-4">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm transition lg:rounded-xl ${
                  active
                    ? "bg-pearl text-deep"
                    : "text-foam/80 hover:bg-white/10"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden px-6 pb-8 lg:block">
          <p className="mb-2 text-[11px] uppercase tracking-[0.22em] text-foam/50">
            Entrar como
          </p>
          <div className="space-y-1.5">
            {VIEW_ROLES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                className={`block w-full rounded-xl px-3 py-2 text-left text-sm ${
                  role === r.id
                    ? "bg-aqua text-white"
                    : "bg-white/5 text-foam/80 hover:bg-white/10"
                }`}
              >
                <span className="block font-medium">{ROLE_LABEL[r.id]}</span>
                <span className="block text-[11px] opacity-80">{r.hint}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <div className="wave-line h-10 border-b border-black/5 lg:h-14" />
        <div className="flex items-center justify-between gap-3 border-b border-black/5 bg-pearl/70 px-4 py-3 lg:hidden">
          <p className="text-sm text-mist">Você está como</p>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as typeof role)}
            className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm"
          >
            {VIEW_ROLES.map((r) => (
              <option key={r.id} value={r.id}>
                {ROLE_LABEL[r.id]}
              </option>
            ))}
          </select>
        </div>
        <main className="px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
