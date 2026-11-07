import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { salvarDocumento } from "./actions";

const mensagensErro: Record<string, string> = {
  permissao: "Você não tem permissão para editar documentos.",
  dados: "Confira o projeto, o título e o conteúdo.",
  projeto: "O projeto não foi encontrado.",
  salvar: "Não foi possível salvar o documento. Tente novamente.",
};

export default async function DocumentacaoPage({
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

  const ehAdmin = !erroAdmin && Boolean(admin);

  const { data: projetos, error: erroProjetos } = await supabase
    .from("projetos")
    .select("id, nome")
    .order("nome");

  const { data: documentos, error: erroDocumentos } = await supabase
    .from("documentos")
    .select("id, projeto_id, titulo, conteudo, atualizado_em")
    .order("atualizado_em", { ascending: false });

  const nomesProjetos = new Map(
    (projetos ?? []).map((projeto) => [projeto.id, projeto.nome])
  );

  const mensagemErro =
    typeof parametros.erro === "string"
      ? mensagensErro[parametros.erro]
      : undefined;

  const campo =
    "mt-2 w-full rounded-xl border border-[#ddd7cb] bg-white p-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100";

  return (
    <main className="min-h-screen bg-[#faf9f5] px-5 py-8 text-[#171b26] sm:px-8">
      <div className="mx-auto max-w-[1000px]">
        <Link
          href="/"
          className="text-sm font-medium text-blue-800 hover:underline"
        >
          ← Voltar ao painel
        </Link>

        <header className="mt-6 flex flex-wrap items-center justify-between gap-5 rounded-[20px] border border-[#ddd9d0] bg-gradient-to-r from-[#f8f2e4] to-[#e9ebf7] p-7 shadow-sm">
          <div>
            <p className="text-sm font-semibold text-[#203d76]">
              BTI • Plataforma SaaS
            </p>

            <h1 className="mt-2 text-3xl font-semibold">
              Documentação
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Informações, briefings e orientações dos seus projetos.
            </p>
          </div>

          {ehAdmin && !erroProjetos && Boolean(projetos?.length) && (
            <a
              href="#novo-documento"
              className="rounded-xl bg-[#1759c7] px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800"
            >
              + Novo documento
            </a>
          )}
        </header>

        {parametros.sucesso === "1" && (
          <p
            role="status"
            className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"
          >
            Documento salvo com sucesso!
          </p>
        )}

        {mensagemErro && (
          <p
            role="alert"
            className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700"
          >
            {mensagemErro}
          </p>
        )}

        {(erroAdmin || erroProjetos || erroDocumentos) && (
          <p
            role="alert"
            className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700"
          >
            Não foi possível carregar todos os dados.
            Confira as tabelas e permissões no Supabase.
          </p>
        )}

        <section className="mt-8">
          <h2 className="text-xl font-semibold">
            Documentos dos projetos
          </h2>

          {!erroDocumentos && !documentos?.length && (
            <div className="mt-5 rounded-2xl border border-dashed border-[#ddd7cb] bg-white/60 p-10 text-center">
              <h3 className="font-semibold">
                Nenhum documento cadastrado
              </h3>

              <p className="mt-2 text-sm text-slate-600">
                {ehAdmin
                  ? "Selecione um projeto no formulário abaixo para começar."
                  : "A documentação aparecerá quando for disponibilizada."}
              </p>
            </div>
          )}

          <div className="mt-5 space-y-5">
            {documentos?.map((documento) => (
              <article
                key={documento.id}
                className="rounded-[18px] border border-[#ddd7cb] bg-[#fcfbf7] p-6 shadow-sm"
              >
                <span className="inline-block rounded-full bg-[#acd3d1] px-3 py-1 text-xs font-medium text-[#244347]">
                  {nomesProjetos.get(documento.projeto_id) ?? "Projeto"}
                </span>

                <h3 className="mt-4 break-words text-xl font-semibold">
                  {documento.titulo}
                </h3>

                <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
                  {documento.conteudo}
                </p>

                <p className="mt-5 text-xs text-slate-500">
                  Atualizado em{" "}
                  {new Date(documento.atualizado_em).toLocaleString("pt-BR", {
                    timeZone: "America/Manaus",
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </p>

                {ehAdmin && (
                  <details className="mt-5 border-t border-[#e6dfd3] pt-4">
                    <summary className="cursor-pointer text-sm font-semibold text-blue-700">
                      Editar documento
                    </summary>

                    <form
                      key={documento.atualizado_em}
                      action={salvarDocumento}
                      className="mt-4 space-y-4"
                    >
                      <input
                        type="hidden"
                        name="id"
                        value={documento.id}
                      />
                      <input
                        type="hidden"
                        name="projeto_id"
                        value={documento.projeto_id}
                      />

                      <div>
                        <label
                          htmlFor={`titulo-${documento.id}`}
                          className="text-sm font-medium"
                        >
                          Título
                        </label>
                        <input
                          id={`titulo-${documento.id}`}
                          name="titulo"
                          required
                          maxLength={150}
                          defaultValue={documento.titulo}
                          className={campo}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`conteudo-${documento.id}`}
                          className="text-sm font-medium"
                        >
                          Conteúdo
                        </label>
                        <textarea
                          id={`conteudo-${documento.id}`}
                          name="conteudo"
                          required
                          rows={8}
                          maxLength={20000}
                          defaultValue={documento.conteudo}
                          className={campo}
                        />
                      </div>

                      <button
                        type="submit"
                        className="rounded-xl bg-[#1759c7] px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800"
                      >
                        Salvar alterações
                      </button>
                    </form>
                  </details>
                )}
              </article>
            ))}
          </div>
        </section>

        {ehAdmin && !erroProjetos && (
          projetos?.length ? (
            <section
              id="novo-documento"
              className="mt-8 scroll-mt-6 rounded-[20px] border border-[#ddd7cb] bg-white/70 p-6 sm:p-8"
            >
              <h2 className="text-xl font-semibold">
                Novo documento
              </h2>

              <form action={salvarDocumento} className="mt-6 space-y-5">
                <div>
                  <label htmlFor="projeto" className="text-sm font-medium">
                    Projeto
                  </label>
                  <select
                    id="projeto"
                    name="projeto_id"
                    required
                    defaultValue=""
                    className={campo}
                  >
                    <option value="" disabled>
                      Selecione um projeto
                    </option>

                    {projetos.map((projeto) => (
                      <option key={projeto.id} value={projeto.id}>
                        {projeto.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="titulo" className="text-sm font-medium">
                    Título
                  </label>
                  <input
                    id="titulo"
                    name="titulo"
                    required
                    maxLength={150}
                    placeholder="Ex.: Briefing, orientações ou escopo"
                    className={campo}
                  />
                </div>

                <div>
                  <label htmlFor="conteudo" className="text-sm font-medium">
                    Conteúdo
                  </label>
                  <textarea
                    id="conteudo"
                    name="conteudo"
                    required
                    rows={8}
                    maxLength={20000}
                    placeholder="Descreva as informações do projeto..."
                    className={campo}
                  />
                </div>

                <button
                  type="submit"
                  className="rounded-xl bg-[#1759c7] px-6 py-3 text-sm font-semibold text-white hover:bg-blue-800"
                >
                  Salvar documento
                </button>
              </form>
            </section>
          ) : (
            <p className="mt-6 rounded-xl bg-[#eee8d9] p-5 text-sm">
              Cadastre um projeto antes de adicionar documentação.{" "}
              <Link href="/projetos" className="font-semibold text-blue-800 hover:underline">
                Ir para Projetos →
              </Link>
            </p>
          )
        )}
      </div>
    </main>
  );
}