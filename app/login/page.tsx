"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function entrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (carregando) return;

    const dados = new FormData(event.currentTarget);
    const email = String(dados.get("email") ?? "").trim();
    const password = String(dados.get("senha") ?? "");

    setErro("");
    setCarregando(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErro(
          error.code === "email_not_confirmed"
            ? "Confirme seu e-mail antes de entrar."
            : "Não foi possível entrar. Confira o e-mail e a senha."
        );
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setErro(
        "Não foi possível conectar. Confira a internet e a configuração do Supabase."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">
          Entrar no sistema
        </h1>

        <p className="mb-6 text-slate-600">
          Acompanhe seus projetos e solicitações.
        </p>

        <form onSubmit={entrar} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-800"
            >
              E-mail
            </label>

            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="voce@exemplo.com"
              className="mt-1 w-full rounded-lg border border-slate-300 p-3 text-slate-900"
            />
          </div>

          <div>
            <label
              htmlFor="senha"
              className="block text-sm font-medium text-slate-800"
            >
              Senha
            </label>

            <input
              id="senha"
              name="senha"
              type="password"
              autoComplete="current-password"
              required
              className="mt-1 w-full rounded-lg border border-slate-300 p-3 text-slate-900"
            />
          </div>

          {erro && (
            <p role="alert" className="text-sm text-red-600">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="w-full rounded-lg bg-slate-900 p-3 font-semibold text-white disabled:opacity-60"
          >
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}