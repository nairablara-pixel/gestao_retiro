"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers";
import { Field, PrimaryButton, inputClass } from "@/components/ui";

export default function LoginPage() {
  const { sendCode, verifyCode, member } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (member) router.replace("/");
  }, [member, router]);

  async function onEmail(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await sendCode(email);
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar o código.");
    } finally {
      setBusy(false);
    }
  }

  async function onCode(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await verifyCode(email, code);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Código inválido.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md py-10">
      <p className="text-[11px] uppercase tracking-[0.28em] text-aqua">Equipe do retiro</p>
      <h1 className="font-display mt-2 text-4xl">Entrar</h1>
      <p className="mt-3 text-mist">
        Use o e-mail cadastrado na equipe. Só quem entra assim pode enviar para
        aprovação ou dar o OK da gestão.
      </p>

      {step === "email" ? (
        <form onSubmit={onEmail} className="mt-8 space-y-4 rounded-3xl bg-white p-6 shadow-card">
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
          {error && <p className="text-sm text-clay">{error}</p>}
          <PrimaryButton disabled={busy} type="submit">
            {busy ? "Enviando…" : "Enviar código"}
          </PrimaryButton>
        </form>
      ) : (
        <form onSubmit={onCode} className="mt-8 space-y-4 rounded-3xl bg-white p-6 shadow-card">
          <p className="text-sm text-mist">
            Enviamos um código para <strong>{email}</strong>.
          </p>
          <Field label="Código">
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              className={inputClass}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="000000"
            />
          </Field>
          {error && <p className="text-sm text-clay">{error}</p>}
          <PrimaryButton disabled={busy} type="submit">
            {busy ? "Entrando…" : "Confirmar e entrar"}
          </PrimaryButton>
          <button
            type="button"
            className="block text-sm text-aqua underline"
            onClick={() => {
              setStep("email");
              setCode("");
              setError(null);
            }}
          >
            Usar outro e-mail
          </button>
        </form>
      )}
    </div>
  );
}
