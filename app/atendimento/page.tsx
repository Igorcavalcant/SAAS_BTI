import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { iniciarConversa } from "./actions";

const nomesStatus: Record<string, string> = {
  aberto: "Aberto",
  em_andamento: "Em andamento",
  resolvido: "Resolvido",
};

export default async function AtendimentoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const parametros = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
    error: erroUsuario,
  } = await supabase.auth.getUser();

  if (erroUsuario || !user) {
    redirect("/login");
  }

  const { data: admin, error: erroAdmin } = await supabase
    .from("administradores")
    .select("usuario_id")
    .eq("usuario_id", user.id)
    .maybeSingle();

  const ehAdmin = !erroAdmin && Boolean(admin);

  const { data: registros, error: erroRegistros } = await supabase
    .from("tickets")
    .select("id, assunto, tipo, status, cliente_id, criado_em")
    .order("criado_em", { ascending: false });

  const conversas =
    registros?.filter((registro) => registro.tipo === "conversa") ?? [];

  const chamados =
    registros?.filter((registro) => registro.tipo === "chamado") ?? [];

  return (
    <main className="min-h-screen bg-[#faf9f5] px-5 py-8 text-[#171b26]">
      <div className="mx-auto max-w-[1000px]">
        <Link
          href="/"
          className="text-sm text-blue-800 hover:underline"
        >
          ← Voltar ao painel
        </Link>

        <header className="mt-6 rounded-[20px] border border-[#ddd9d0] bg-gradient-to-r from-[#f8f2e4] to-[#e9ebf7] p-7 shadow-sm">
          <p className="text-sm font-semibold text-[#203d76]">
            BTI • Plataforma SaaS
          </p>

          <h1 className="mt-2 text-3xl font-semibold">
            Atendimento
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            {ehAdmin
              ? "Converse com seus clientes e abra chamados quando necessário."
              : "Fale com o suporte e acompanhe suas solicitações."}
          </p>
        </header>

        {parametros.erro && (
          <p
            role="alert"
            className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700"
          >
            Não foi possível concluir a operação. Confira se a
            atualização do banco foi executada e tente novamente.
          </p>
        )}

        {erroAdmin && (
          <p
            role="alert"
            className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700"
          >
            Não foi possível verificar sua permissão administrativa.
          </p>
        )}

        {!ehAdmin && !erroAdmin && (
          <section className="mt-7 rounded-2xl border border-[#ddd7cb] bg-white/70 p-6">
            <h2 className="text-xl font-semibold">
              Precisa de ajuda?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Converse com o suporte e envie mensagens, fotos ou GIFs.
              Não é necessário abrir um chamado para entrar em contato.
            </p>

            <form action={iniciarConversa} className="mt-5">
              <button
                type="submit"
                className="rounded-xl bg-[#1759c7] px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800"
              >
                Conversar com o suporte
              </button>
            </form>
          </section>
        )}

        {erroRegistros ? (
          <p
            role="alert"
            className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700"
          >
            Não foi possível carregar o atendimento. Confira se a
            coluna tipo foi adicionada à tabela tickets no Supabase.
          </p>
        ) : (
          <>
            <section className="mt-8">
              <h2 className="text-xl font-semibold">
                {ehAdmin ? "Conversas dos clientes" : "Minha conversa"}
              </h2>

              {conversas.length === 0 ? (
                <p className="mt-4 rounded-2xl border border-dashed border-[#ddd7cb] p-8 text-center text-sm text-slate-600">
                  {ehAdmin
                    ? "As conversas aparecerão quando os clientes entrarem em contato."
                    : "Clique em Conversar com o suporte para iniciar sua conversa."}
                </p>
              ) : (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {conversas.map((conversa) => (
                    <Link
                      key={conversa.id}
                      href={`/atendimento/${conversa.id}`}
                      className="block rounded-2xl border border-[#ddd7cb] bg-[#fcfbf7] p-5 shadow-sm transition hover:border-blue-400"
                    >
                      <h3 className="font-semibold">
                        {ehAdmin
                          ? "Conversa com o cliente"
                          : "Conversa com o suporte"}
                      </h3>

                      {ehAdmin && (
                        <p className="mt-2 break-all text-xs text-slate-500">
                          Cliente: {conversa.cliente_id}
                        </p>
                      )}

                      <p className="mt-2 text-xs text-slate-500">
                        Iniciada em{" "}
                        {new Date(conversa.criado_em).toLocaleDateString(
                          "pt-BR",
                          { timeZone: "America/Manaus" }
                        )}
                      </p>

                      <p className="mt-4 text-sm font-medium text-blue-700">
                        Abrir conversa →
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="mt-8">
              <h2 className="text-xl font-semibold">
                {ehAdmin
                  ? "Chamados em acompanhamento"
                  : "Meus chamados"}
              </h2>

              {chamados.length === 0 ? (
                <p className="mt-4 rounded-2xl border border-dashed border-[#ddd7cb] p-8 text-center text-sm text-slate-600">
                  Nenhum chamado cadastrado.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {chamados.map((chamado) => (
                    <Link
                      key={chamado.id}
                      href={`/atendimento/${chamado.id}`}
                      className="block rounded-2xl border border-[#ddd7cb] bg-[#fcfbf7] p-5 shadow-sm transition hover:border-blue-400"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="break-words font-semibold">
                          {chamado.assunto}
                        </h3>

                        <span className="rounded-full bg-[#acd3d1] px-3 py-1 text-xs">
                          {nomesStatus[chamado.status] ?? chamado.status}
                        </span>
                      </div>

                      <p className="mt-2 text-xs text-slate-500">
                        Aberto em{" "}
                        {new Date(chamado.criado_em).toLocaleDateString(
                          "pt-BR",
                          { timeZone: "America/Manaus" }
                        )}
                      </p>

                      {ehAdmin && (
                        <p className="mt-2 break-all text-xs text-slate-500">
                          Cliente: {chamado.cliente_id}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}