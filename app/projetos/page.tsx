import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "../../lib/supabase/server";

const statusDisponiveis = {
  contratado: "Contratado",
  em_andamento: "Em andamento",
  entregue: "Entregue",
  encerrado: "Encerrado",
};

const mensagens: Record<string, string> = {
  dados: "Confira os campos. Informe um nome e um ID de cliente válido.",
  permissao: "Você não tem permissão para cadastrar projetos.",
  cliente: "Cliente não encontrado. Copie o ID em Authentication → Users.",
  salvar: "Não foi possível salvar o projeto. Confira os dados e as permissões.",
};

async function cadastrarProjeto(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
    error: erroUsuario,
  } = await supabase.auth.getUser();

  if (erroUsuario || !user) {
    redirect("/login");
  }

  const { data: administrador, error: erroPermissao } = await supabase
    .from("administradores")
    .select("usuario_id")
    .eq("usuario_id", user.id)
    .maybeSingle();

  if (erroPermissao || !administrador) {
    redirect("/projetos?erro=permissao");
  }

  const nome = String(formData.get("nome") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();
  const clienteId = String(formData.get("cliente_id") ?? "").trim();
  const prazo = String(formData.get("prazo") ?? "").trim();
  const status = String(formData.get("status") ?? "");

  const uuidValido =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  const prazoValido =
    !prazo ||
    (/^\d{4}-\d{2}-\d{2}$/.test(prazo) &&
      Number.isFinite(Date.parse(prazo)) &&
      new Date(prazo).toISOString().slice(0, 10) === prazo);

  if (
    !nome ||
    nome.length > 150 ||
    descricao.length > 5000 ||
    !uuidValido.test(clienteId) ||
    !Object.hasOwn(statusDisponiveis, status) ||
    !prazoValido
  ) {
    redirect("/projetos?erro=dados#novo-projeto");
  }

  const { error } = await supabase.from("projetos").insert({
    nome,
    descricao,
    cliente_id: clienteId,
    status,
    prazo: prazo || null,
  });

  if (error) {
    const motivo = error.code === "23503" ? "cliente" : "salvar";
    redirect(`/projetos?erro=${motivo}#novo-projeto`);
  }

  revalidatePath("/projetos");
  redirect("/projetos?sucesso=1");
}

export default async function ProjetosPage({
  searchParams,
}: {
  searchParams: Promise<{
    erro?: string | string[];
    sucesso?: string | string[];
  }>;
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

  const { data: administrador, error: erroPermissao } = await supabase
    .from("administradores")
    .select("usuario_id")
    .eq("usuario_id", user.id)
    .maybeSingle();

  const ehAdministrador = !erroPermissao && Boolean(administrador);

  const { data: projetos, error: erroProjetos } = await supabase
    .from("projetos")
    .select("id, nome, descricao, cliente_id, status, prazo")
    .order("criado_em", { ascending: false });

  const mensagemErro =
    typeof parametros.erro === "string"
      ? mensagens[parametros.erro]
      : undefined;

  const campo =
    "mt-2 w-full rounded-xl border border-[#ddd7cb] bg-white p-3 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

  return (
    <main className="min-h-screen bg-[#faf9f5] px-5 py-8 text-[#171b26] sm:px-8">
      <div className="mx-auto max-w-[1000px]">
        <Link
          href="/"
          className="text-sm font-medium text-[#254b85] hover:underline"
        >
          ← Voltar ao painel
        </Link>

        <header className="mt-6 flex flex-wrap items-center justify-between gap-5 rounded-[20px] border border-[#ddd9d0] bg-gradient-to-r from-[#f8f2e4] to-[#e9ebf7] p-6 shadow-sm sm:p-8">
          <div>
            <p className="text-sm font-semibold text-[#203d76]">
              BTI • Plataforma SaaS
            </p>

            <h1 className="mt-2 text-3xl font-semibold">
              Projetos
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              {ehAdministrador
                ? "Cadastre e acompanhe os projetos dos seus clientes."
                : "Acompanhe seus projetos, prazos e entregas."}
            </p>
          </div>

          {ehAdministrador && (
            <a
              href="#novo-projeto"
              className="rounded-xl bg-[#1759c7] px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800"
            >
              + Novo projeto
            </a>
          )}
        </header>

        {parametros.sucesso === "1" && (
          <p
            role="status"
            className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
          >
            Projeto cadastrado com sucesso!
          </p>
        )}

        {mensagemErro && (
          <p
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            {mensagemErro}
          </p>
        )}

        {erroPermissao && (
          <p role="alert" className="mt-6 text-sm text-red-700">
            Não foi possível verificar sua permissão administrativa.
            Confira a tabela administradores e as regras de acesso.
          </p>
        )}

        <section aria-labelledby="lista-projetos" className="mt-8">
          <h2 id="lista-projetos" className="text-xl font-semibold">
            {ehAdministrador ? "Todos os projetos" : "Meus projetos"}
          </h2>

          {erroProjetos ? (
            <p
              role="alert"
              className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700"
            >
              Não foi possível carregar os projetos.
              Confira se a tabela projetos foi criada no Supabase.
            </p>
          ) : projetos && projetos.length > 0 ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {projetos.map((projeto) => (
                <article
                  key={projeto.id}
                  className="rounded-[18px] border border-[#ddd7cb] bg-[#fcfbf7] p-6 shadow-sm"
                >
                  <span className="inline-block rounded-full bg-[#acd3d1] px-3 py-1 text-xs font-medium text-[#244347]">
                    {statusDisponiveis[
                      projeto.status as keyof typeof statusDisponiveis
                    ] ?? projeto.status}
                  </span>

                  <h3 className="mt-4 break-words text-xl font-semibold">
                    {projeto.nome}
                  </h3>

                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                    {projeto.descricao || "Sem descrição."}
                  </p>

                  <p className="mt-5 text-sm font-medium">
                    Prazo:{" "}
                    {projeto.prazo
                      ? projeto.prazo.split("-").reverse().join("/")
                      : "Não definido"}
                  </p>

                  {ehAdministrador && (
                    <p className="mt-2 break-all text-xs text-slate-500">
                      ID do cliente: {projeto.cliente_id}
                    </p>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-[18px] border border-dashed border-[#d6cebf] bg-white/60 p-10 text-center">
              <h3 className="font-semibold">
                Nenhum projeto cadastrado
              </h3>

              <p className="mt-2 text-sm text-slate-600">
                {ehAdministrador
                  ? "Use o formulário abaixo para cadastrar o primeiro."
                  : "Seus projetos aparecerão aqui quando forem cadastrados."}
              </p>
            </div>
          )}
        </section>

        {ehAdministrador && (
          <section
            id="novo-projeto"
            aria-labelledby="titulo-cadastro"
            className="mt-8 scroll-mt-6 rounded-[20px] border border-[#ddd7cb] bg-[#fcfbf7] p-6 shadow-sm sm:p-8"
          >
            <h2 id="titulo-cadastro" className="text-xl font-semibold">
              Novo projeto
            </h2>

            <form action={cadastrarProjeto} className="mt-6 space-y-5">
              <div>
                <label htmlFor="nome" className="text-sm font-medium">
                  Nome do projeto
                </label>
                <input
                  id="nome"
                  name="nome"
                  required
                  maxLength={150}
                  placeholder="Ex.: Site da Barbearia"
                  className={campo}
                />
              </div>

              <div>
                <label htmlFor="descricao" className="text-sm font-medium">
                  Descrição
                </label>
                <textarea
                  id="descricao"
                  name="descricao"
                  rows={4}
                  maxLength={5000}
                  placeholder="Descreva o serviço e as entregas combinadas."
                  className={campo}
                />
              </div>

              <div>
                <label htmlFor="cliente_id" className="text-sm font-medium">
                  ID do cliente
                </label>
                <input
                  id="cliente_id"
                  name="cliente_id"
                  required
                  placeholder="Cole o UUID do usuário"
                  className={campo}
                />
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Copie o ID do usuário em Supabase → Authentication → Users.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="status" className="text-sm font-medium">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    defaultValue="contratado"
                    className={campo}
                  >
                    {Object.entries(statusDisponiveis).map(([valor, nome]) => (
                      <option key={valor} value={valor}>
                        {nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="prazo" className="text-sm font-medium">
                    Prazo
                  </label>
                  <input
                    id="prazo"
                    name="prazo"
                    type="date"
                    className={campo}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="rounded-xl bg-[#1759c7] px-6 py-3 text-sm font-semibold text-white hover:bg-blue-800"
              >
                Salvar projeto
              </button>
            </form>
          </section>
        )}
      </div>
    </main>
  );
}