"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers";
import { Field, PrimaryButton, inputClass } from "@/components/ui";

export default function LoginPage() {
  const { login, member } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (member) router.replace("/");
  }, [member, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível entrar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md py-10">
      <p className="text-[11px] uppercase tracking-[0.28em] text-aqua">Equipe do retiro</p>
      <h1 className="font-display mt-2 text-4xl">Entrar</h1>
      <p className="mt-3 text-mist">
        Use o e-mail cadastrado na equipe e a senha definida no cadastro. Não
        enviamos mais código por e-mail.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-3xl bg-white p-6 shadow-card">
        <Field label="E-mail da equipe">
          <input
            type="email"
            required
            autoComplete="email"
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu.nome@email.com"
          />
        </Field>
        <Field label="Senha">
          <input
            type="password"
            required
            minLength={6}
            autoComplete="current-password"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        {error && <p className="text-sm text-clay">{error}</p>}
        <PrimaryButton disabled={busy} type="submit">
          {busy ? "Entrando…" : "Entrar"}
        </PrimaryButton>
        <p className="text-sm text-mist">
          Ainda não tem senha? Abra{" "}
          <Link href="/equipe" className="text-aqua underline">
            Equipe
          </Link>
          , clique no seu nome e defina uma senha (mínimo 6 caracteres).
        </p>
      </form>
    </div>
  );
}
