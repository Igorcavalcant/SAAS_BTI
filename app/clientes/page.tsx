import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { cadastrarCliente } from "./actions";

const mensagensErro: Record<string, string> = {
  permissao: "Você não tem permissão para cadastrar clientes.",
  dados: "Confira nome, e-mail, CPF/CNPJ e ID do usuário.",
  duplicado: "Esse CPF/CNPJ ou usuário já está vinculado a um cliente.",
  usuario: "O ID informado não corresponde a um usuário existente.",
  salvar: "Não foi possível salvar. Confira a tabela e suas permissões.",
};

export default async function ClientesPage({
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

  if (erroAdmin || !admin) {
    return (
      <main className="min-h-screen bg-[#faf9f5] p-8 text-slate-900">
        <Link href="/" className="text-blue-700 hover:underline">
          ← Voltar ao painel
        </Link>
        <p role="alert" className="mt-6">
          {erroAdmin
            ? "Não foi possível verificar sua permissão."
            : "Esta página é exclusiva do administrador."}
        </p>
      </main>
    );
  }

  const { data: clientes, error } = await supabase
    .from("clientes")
    .select("id, nome, email, telefone, usuario_id")
    .order("nome");

  const codigoErro =
    typeof parametros.erro === "string" ? parametros.erro : "";

  const classeInput =
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
          <h1 className="mt-2 text-3xl font-semibold">Clientes</h1>
          <p className="mt-2 text-sm text-slate-600">
            Cadastre os clientes dos seus projetos e serviços.
          </p>
        </header>

        {codigoErro && (
          <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-red-700">
            {mensagensErro[codigoErro] ?? mensagensErro.salvar}
          </p>
        )}

        {parametros.sucesso === "1" && (
          <p role="status" className="mt-5 rounded-xl bg-green-50 p-4 text-green-800">
            Cliente cadastrado com sucesso!
          </p>
        )}

        <section className="mt-6 rounded-2xl border border-[#ddd9d0] bg-white p-6">
          <h2 className="text-xl font-semibold">Novo cliente</h2>

          <form
            action={cadastrarCliente}
            className="mt-5 grid gap-4 sm:grid-cols-2"
          >
            <div>
              <label htmlFor="nome" className="text-sm font-medium">
                Nome ou razão social
              </label>
              <input
                id="nome"
                name="nome"
                required
                minLength={2}
                maxLength={150}
                className={classeInput}
              />
            </div>

            <div>
              <label htmlFor="email" className="text-sm font-medium">
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                maxLength={254}
                className={classeInput}
              />
            </div>

            <div>
              <label htmlFor="cpf_cnpj" className="text-sm font-medium">
                CPF ou CNPJ
              </label>
              <input
                id="cpf_cnpj"
                name="cpf_cnpj"
                required
                maxLength={18}
                placeholder="Com ou sem pontuação"
                className={classeInput}
              />
            </div>

            <div>
              <label htmlFor="telefone" className="text-sm font-medium">
                Telefone — opcional
              </label>
              <input
                id="telefone"
                name="telefone"
                type="tel"
                maxLength={20}
                className={classeInput}
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="usuario_id" className="text-sm font-medium">
                ID do usuário de acesso — opcional
              </label>
              <input
                id="usuario_id"
                name="usuario_id"
                maxLength={36}
                placeholder="UUID do usuário no Supabase"
                className={classeInput}
              />
              <p className="mt-2 text-xs text-slate-500">
                Se o cliente já possui login, copie o ID em
                Supabase → Authentication → Users.
                Caso contrário, deixe em branco.
              </p>
            </div>

            <button
              type="submit"
              className="rounded-xl bg-[#1759c7] px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800 sm:col-span-2"
            >
              Cadastrar cliente
            </button>
          </form>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">Clientes cadastrados</h2>

          {error ? (
            <p role="alert" className="mt-4 text-red-700">
              Não foi possível carregar os clientes.
              Confira se o SQL foi executado.
            </p>
          ) : !clientes?.length ? (
            <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-6 text-slate-600">
              Nenhum cliente cadastrado.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {clientes.map((cliente) => (
                <article
                  key={cliente.id}
                  className="rounded-2xl border border-[#ddd9d0] bg-white p-5"
                >
                  <h3 className="font-semibold">{cliente.nome}</h3>
                  <p className="mt-1 break-all text-sm text-slate-600">
                    {cliente.email}
                  </p>
                  {cliente.telefone && (
                    <p className="mt-1 text-sm text-slate-600">
                      Telefone: {cliente.telefone}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-slate-500">
                    {cliente.usuario_id
                      ? "Conta de acesso vinculada."
                      : "Conta de acesso ainda não vinculada."}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}