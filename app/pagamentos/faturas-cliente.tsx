import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

function linkSeguro(valor: string | null): string | null {
  if (!valor) return null;

  try {
    const url = new URL(valor);

    if (
      url.protocol === "https:" &&
      (url.hostname === "asaas.com" ||
        url.hostname.endsWith(".asaas.com"))
    ) {
      return url.href;
    }
  } catch {
    // Não apresenta links inválidos.
  }

  return null;
}

export default async function FaturasCliente() {
  const supabase = await createClient();

  const {
    data: { user },
    error: erroUsuario,
  } = await supabase.auth.getUser();

  if (erroUsuario || !user) redirect("/login");

  const { data: cliente, error: erroCliente } = await supabase
    .from("clientes")
    .select("id, nome")
    .eq("usuario_id", user.id)
    .maybeSingle();

  const resultado = cliente
    ? await supabase
        .from("cobrancas_sandbox")
        .select("id, tipo, descricao, valor, vencimento, estado, fatura_url")
        .eq("cliente_id", cliente.id)
        .order("criado_em", { ascending: false })
        .limit(50)
    : null;

  const estados: Record<string, string> = {
    criada: "Cobrança ou assinatura criada",
    processando: "Preparando cobrança",
    revisar: "Em conferência pelo suporte",
    erro: "Cobrança não concluída",
  };

  return (
    <main className="min-h-screen bg-[#faf9f5] px-5 py-8 text-[#171b26]">
      <div className="mx-auto max-w-[1000px]">
        <Link href="/" className="text-sm text-blue-800 hover:underline">
          ← Voltar ao painel
        </Link>

        <header className="mt-6 rounded-2xl border border-[#ddd9d0] bg-white p-7">
          <p className="text-sm font-semibold text-[#203d76]">
            BTI • Plataforma SaaS
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Meus pagamentos</h1>
          <p className="mt-2 text-sm text-slate-600">
            {cliente
              ? `${cliente.nome}, confira suas cobranças e assinaturas.`
              : "Acompanhe suas cobranças e assinaturas."}
          </p>
        </header>

        <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          Ambiente de testes. As faturas do Sandbox não movimentam dinheiro real.
        </p>

        {erroCliente || resultado?.error ? (
          <p role="alert" className="mt-6 text-red-700">
            Não foi possível carregar seus pagamentos. Tente novamente.
          </p>
        ) : !cliente ? (
          <section className="mt-6 rounded-2xl border border-[#ddd9d0] bg-white p-6">
            <h2 className="text-xl font-semibold">Cadastro não vinculado</h2>
            <p className="mt-3 text-slate-600">
              Sua conta ainda não foi vinculada ao cadastro de cliente.
              Entre em contato com o suporte.
            </p>
            <Link
              href="/atendimento"
              className="mt-4 inline-block font-semibold text-blue-700"
            >
              Abrir atendimento →
            </Link>
          </section>
        ) : !resultado?.data?.length ? (
          <p className="mt-6 rounded-xl border border-dashed border-slate-300 p-6 text-slate-600">
            Você ainda não possui cobranças cadastradas.
          </p>
        ) : (
          <section className="mt-6 space-y-4">
            {resultado.data.map((cobranca) => {
              const fatura = linkSeguro(cobranca.fatura_url);

              return (
                <article
                  key={cobranca.id}
                  className="rounded-2xl border border-[#ddd9d0] bg-white p-6"
                >
                  <h2 className="text-lg font-semibold">
                    {cobranca.descricao}
                  </h2>

                  <p className="mt-2 text-xl font-semibold">
                    {Number(cobranca.valor).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                    {cobranca.tipo === "mensal" ? " / mês" : ""}
                  </p>

                  <p className="mt-2 text-sm text-slate-600">
                    {cobranca.tipo === "mensal"
                      ? "Primeiro vencimento"
                      : "Vencimento"}
                    : {cobranca.vencimento.split("-").reverse().join("/")}
                  </p>

                  <p className="mt-2 text-sm text-slate-600">
                    {estados[cobranca.estado] ?? "Em acompanhamento"}
                  </p>

                  {cobranca.estado === "criada" && (
                    <p className="mt-2 text-xs text-slate-500">
                      A confirmação do pagamento ainda não está sincronizada
                      com esta página.
                    </p>
                  )}

                  {fatura ? (
                    <a
                      href={fatura}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-block rounded-xl bg-[#1759c7] px-5 py-3 text-sm font-semibold text-white"
                    >
                      Abrir fatura de teste
                    </a>
                  ) : cobranca.estado === "criada" ? (
                    <p className="mt-4 text-sm text-slate-600">
                      A fatura ainda não está disponível nesta página.
                      Consulte o suporte.
                    </p>
                  ) : null}
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
