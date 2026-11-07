/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import { alterarStatus } from "../actions";
import Chat from "../chat";

const nomesStatus: Record<string, string> = {
  aberto: "Aberto",
  em_andamento: "Em andamento",
  resolvido: "Resolvido",
};

export default async function ConversaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const parametros = await searchParams;

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  ) {
    notFound();
  }

  const supabase = await createClient();

  const { data: { user }, error: erroUsuario } =
    await supabase.auth.getUser();

  if (erroUsuario || !user) redirect("/login");

  const { data: ticket, error: erroTicket } = await supabase
    .from("tickets")
    .select("id, assunto, status, cliente_id")
    .eq("id", id)
    .maybeSingle();

  if (erroTicket) {
    throw new Error("Não foi possível carregar o chamado.");
  }

  // RLS também impede acessar um chamado de outro cliente.
  if (!ticket) notFound();

  const { data: admin, error: erroAdmin } = await supabase
    .from("administradores")
    .select("usuario_id")
    .eq("usuario_id", user.id)
    .maybeSingle();

  const ehAdmin = !erroAdmin && Boolean(admin);

  const { data: mensagens, error: erroMensagens } = await supabase
    .from("mensagens")
    .select("id, autor_id, texto, arquivo_path, criado_em")
    .eq("ticket_id", id)
    .order("criado_em", { ascending: true });

  const mensagensComAnexos = await Promise.all(
    (mensagens ?? []).map(async (mensagem) => {
      let url: string | null = null;

      if (mensagem.arquivo_path) {
        const { data, error } = await supabase.storage
          .from("atendimento-anexos")
          .createSignedUrl(mensagem.arquivo_path, 300);

        if (!error) url = data?.signedUrl ?? null;
      }

      return { ...mensagem, url };
    })
  );

  return (
    <main className="min-h-screen bg-[#faf9f5] px-5 py-8 text-[#171b26]">
      <div className="mx-auto max-w-[900px]">
        <Link href="/atendimento" className="text-sm text-blue-800 hover:underline">
          ← Voltar aos chamados
        </Link>

        <header className="mt-6 rounded-[20px] border border-[#ddd9d0] bg-gradient-to-r from-[#f8f2e4] to-[#e9ebf7] p-6 shadow-sm">
          <span className="rounded-full bg-[#acd3d1] px-3 py-1 text-xs">
            {nomesStatus[ticket.status] ?? ticket.status}
          </span>

          <h1 className="mt-4 break-words text-2xl font-semibold">
            {ticket.assunto}
          </h1>

          {ehAdmin && (
            <form action={alterarStatus} className="mt-5 flex flex-wrap gap-3">
              <input type="hidden" name="ticket_id" value={ticket.id} />

              <label htmlFor="status" className="sr-only">
                Status do chamado
              </label>
              <select
                key={ticket.status}
                id="status"
                name="status"
                defaultValue={ticket.status}
                className="rounded-lg border border-slate-300 bg-white p-2 text-sm"
              >
                {Object.entries(nomesStatus).map(([valor, nome]) => (
                  <option key={valor} value={valor}>
                    {nome}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                className="rounded-lg bg-[#203d76] px-4 py-2 text-sm text-white"
              >
                Atualizar status
              </button>
            </form>
          )}

          {parametros.erro && (
            <p role="alert" className="mt-4 text-sm text-red-700">
              Não foi possível atualizar o status. Confira sua permissão.
            </p>
          )}
        </header>

        <section className="mt-6 rounded-[20px] border border-[#ddd7cb] bg-[#fcfbf7] p-5 sm:p-7">
          <h2 className="text-lg font-semibold">Conversa</h2>

          {erroMensagens ? (
            <p role="alert" className="mt-5 text-sm text-red-700">
              Não foi possível carregar as mensagens.
            </p>
          ) : mensagensComAnexos.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">
              Envie a primeira mensagem para iniciar o atendimento.
            </p>
          ) : (
            <div className="mt-6 space-y-4">
              {mensagensComAnexos.map((mensagem) => {
                const minha = mensagem.autor_id === user.id;

                return (
                  <div
                    key={mensagem.id}
                    className={`flex ${minha ? "justify-end" : "justify-start"}`}
                  >
                    <article
                      className={`max-w-[90%] rounded-2xl border p-4 sm:max-w-[75%] ${
                        minha
                          ? "border-[#c6d5ef] bg-[#e5edfa]"
                          : "border-[#ddd7cb] bg-white"
                      }`}
                    >
                      <p className="text-xs font-semibold text-[#203d76]">
                        {minha
                          ? "Você"
                          : mensagem.autor_id === ticket.cliente_id
                            ? "Cliente"
                            : "Atendimento"}
                      </p>

                      {mensagem.texto && (
                        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">
                          {mensagem.texto}
                        </p>
                      )}

                      {mensagem.url && (
                        <a
                          href={mensagem.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 block"
                        >
                          <img
                            src={mensagem.url}
                            alt="Imagem anexada à mensagem"
                            className="max-h-80 max-w-full rounded-xl object-contain"
                          />
                          <span className="mt-2 block text-xs text-blue-700">
                            Abrir imagem
                          </span>
                        </a>
                      )}

                      {mensagem.arquivo_path && !mensagem.url && (
                        <p className="mt-3 text-xs text-red-700">
                          Não foi possível carregar o anexo.
                        </p>
                      )}

                      <p className="mt-3 text-[11px] text-slate-500">
                        {new Date(mensagem.criado_em).toLocaleString("pt-BR", {
                          timeZone: "America/Manaus",
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </p>
                    </article>
                  </div>
                );
              })}
            </div>
          )}

          <Chat ticketId={ticket.id} />
        </section>
      </div>
    </main>
  );
}