import { randomUUID } from "node:crypto";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { criarCobranca } from "./actions";
import FaturasCliente from "./faturas-cliente";

const mensagens: Record<string, string> = {
  permissao: "Esta operação é exclusiva do administrador.",
  dados: "Confira os campos. Use valor sem separador de milhar e uma data a partir de hoje.",
  cliente: "Não foi possível localizar o cliente.",
  repetida: "Esta tentativa já foi enviada ou existe uma operação desse cliente aguardando conferência.",
  banco: "Não foi possível registrar a tentativa. Confira se o SQL foi executado.",
  operacao: "Confira o resultado e os detalhes na lista abaixo.",
};

const estados: Record<string, string> = {
  processando: "Processando — não repita",
  criada: "Criada no Asaas",
  erro: "Não concluída",
  revisar: "Conferir no Asaas antes de repetir",
};

export default async function PagamentosPage({
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

  if (erroUsuario || !user) redirect("/login");

  const { data: admin, error: erroAdmin } = await supabase
    .from("administradores")
    .select("usuario_id")
    .eq("usuario_id", user.id)
    .maybeSingle();

  if (erroAdmin || !admin) if (erroAdmin) {
  return (
    <main className="min-h-screen bg-[#faf9f5] p-8 text-slate-900">
      <Link href="/" className="text-blue-700">
        ← Voltar ao painel
      </Link>

      <p role="alert" className="mt-6 text-red-700">
        Não foi possível verificar sua permissão. Tente novamente.
      </p>
    </main>
  );
}

if (!admin) {
  return <FaturasCliente />;
}

  const [resultadoClientes, resultadoCobrancas] = await Promise.all([
    supabase.from("clientes").select("id, nome").order("nome"),
    supabase
      .from("cobrancas_sandbox")
      .select("*")
      .order("criado_em", { ascending: false })
      .limit(50),
  ]);

  const clientes = resultadoClientes.data ?? [];
  const cobrancas = resultadoCobrancas.data ?? [];
  const codigo = typeof parametros.erro === "string" ? parametros.erro : "";

  const nomes = new Map(
    clientes.map((cliente) => [cliente.id, cliente.nome])
  );

  const input =
    "mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm";

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
          <h1 className="mt-2 text-3xl font-semibold">Pagamentos</h1>
          <p className="mt-2 text-sm text-slate-600">
            Ambiente de testes: Asaas Sandbox.
          </p>
          <Link
            href="/clientes"
            className="mt-4 inline-block text-sm font-semibold text-blue-700"
          >
            Cadastrar ou consultar clientes →
          </Link>
        </header>

        {codigo && (
          <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-red-700">
            {mensagens[codigo] ?? "Não foi possível concluir a operação."}
          </p>
        )}

        {parametros.sucesso === "1" && (
          <p role="status" className="mt-5 rounded-xl bg-green-50 p-4 text-green-800">
            Operação criada no Sandbox! Confira o registro abaixo.
          </p>
        )}

        {resultadoClientes.error || resultadoCobrancas.error ? (
          <p role="alert" className="mt-6 text-red-700">
            Não foi possível carregar os dados. Confira se o SQL foi executado.
          </p>
        ) : (
          <>
            <section className="mt-6 rounded-2xl border border-[#ddd9d0] bg-white p-6">
              <h2 className="text-xl font-semibold">Nova cobrança</h2>

              {!clientes.length ? (
                <p className="mt-4 text-slate-600">
                  Cadastre um cliente antes de criar a cobrança.
                </p>
              ) : (
                <form
                  action={criarCobranca}
                  className="mt-5 grid gap-4 sm:grid-cols-2"
                >
                  <input
                    type="hidden"
                    name="operacao_id"
                    value={randomUUID()}
                  />

                  <div className="sm:col-span-2">
                    <label htmlFor="cliente_id">Cliente</label>
                    <select
                      id="cliente_id"
                      name="cliente_id"
                      required
                      defaultValue=""
                      className={input}
                    >
                      <option value="" disabled>Selecione o cliente</option>
                      {clientes.map((cliente) => (
                        <option key={cliente.id} value={cliente.id}>
                          {cliente.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="tipo">Tipo de cobrança</label>
                    <select id="tipo" name="tipo" className={input}>
                      <option value="unico">Pagamento único</option>
                      <option value="mensal">Assinatura mensal</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="forma">Forma de pagamento</label>
                    <select id="forma" name="forma" className={input}>
                      <option value="BOLETO">Boleto</option>
                      <option value="PIX">Pix</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="valor">Valor em reais</label>
                    <input
                      id="valor"
                      name="valor"
                      required
                      inputMode="decimal"
                      placeholder="Ex.: 25,00"
                      maxLength={9}
                      className={input}
                    />
                  </div>

                  <div>
                    <label htmlFor="vencimento">
                      Vencimento / primeiro vencimento
                    </label>
                    <input
                      id="vencimento"
                      name="vencimento"
                      type="date"
                      required
                      className={input}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="descricao">Serviço ou nome do plano</label>
                    <input
                      id="descricao"
                      name="descricao"
                      required
                      maxLength={500}
                      placeholder="Ex.: Manutenção mensal do site"
                      className={input}
                    />
                  </div>

                  <p className="text-sm text-slate-600 sm:col-span-2">
                    Na assinatura, o valor informado será cobrado mensalmente,
                    até a assinatura ser encerrada.
                  </p>

                  <button
                    type="submit"
                    className="rounded-xl bg-[#1759c7] px-5 py-3 font-semibold text-white sm:col-span-2"
                  >
                    Criar no Sandbox
                  </button>
                </form>
              )}
            </section>

            <section className="mt-8">
              <h2 className="text-xl font-semibold">Últimas 50 operações</h2>
              <p className="mt-2 text-sm text-slate-600">
                “Criada” confirma a criação da operação, não o pagamento.
              </p>

              {!cobrancas.length && (
                <p className="mt-4 text-slate-600">
                  Nenhuma operação cadastrada.
                </p>
              )}

              <div className="mt-4 space-y-3">
                {cobrancas.map((cobranca) => (
                  <article
                    key={cobranca.id}
                    className="rounded-2xl border border-[#ddd9d0] bg-white p-5"
                  >
                    <h3 className="font-semibold">
                      {nomes.get(cobranca.cliente_id) ?? "Cliente"} —{" "}
                      {cobranca.descricao}
                    </h3>

                    <p className="mt-2 text-sm text-slate-600">
                      {Number(cobranca.valor).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                      {cobranca.tipo === "mensal" ? " / mês" : " • pagamento único"}
                      {" • "}{cobranca.forma}
                    </p>

                    <p className="mt-2 text-sm">
                      {estados[cobranca.estado] ?? cobranca.estado}
                    </p>

                    {cobranca.detalhe && (
                      <p className="mt-2 text-sm text-red-700">
                        {cobranca.detalhe}
                      </p>
                    )}

                    {cobranca.asaas_id && (
                      <p className="mt-2 break-all text-xs text-slate-500">
                        ID no Asaas: {cobranca.asaas_id}
                      </p>
                    )}

                    {cobranca.fatura_url ? (
                      <a
                        href={cobranca.fatura_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-block font-semibold text-blue-700"
                      >
                        Abrir fatura de teste →
                      </a>
                    ) : cobranca.estado === "criada" ? (
                      <p className="mt-3 text-sm text-slate-600">
                        Consulte a fatura no painel do Asaas Sandbox.
                        Ela pode ainda não estar disponível.
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}