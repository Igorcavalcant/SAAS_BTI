"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

const extensoes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export default function Chat({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const formulario = useRef<HTMLFormElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const intervalo = window.setInterval(() => {
      if (document.visibilityState === "visible" && !enviando) {
        router.refresh();
      }
    }, 10000);

    return () => window.clearInterval(intervalo);
  }, [router, enviando]);

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (enviando) return;

    const dados = new FormData(event.currentTarget);
    const texto = String(dados.get("texto") ?? "").trim();
    const entrada = dados.get("arquivo");
    const arquivo =
      entrada instanceof File && entrada.size > 0 ? entrada : null;

    setErro("");

    if (!texto && !arquivo) {
      setErro("Escreva uma mensagem ou selecione uma imagem.");
      return;
    }

    if (texto.length > 5000) {
      setErro("A mensagem pode ter até 5.000 caracteres.");
      return;
    }

    if (
      arquivo &&
      (!extensoes[arquivo.type] || arquivo.size > 5 * 1024 * 1024)
    ) {
      setErro("Use JPG, PNG, WebP ou GIF de até 5 MB.");
      return;
    }

    setEnviando(true);

    const supabase = createClient();
    let caminho: string | null = null;
    let uploadConcluido = false;
    let mensagemSalva = false;

    try {
      const { data: { user }, error: erroUsuario } =
        await supabase.auth.getUser();

      if (erroUsuario || !user) {
        setErro("Sua sessão expirou. Entre novamente.");
        return;
      }

      const mensagemId = crypto.randomUUID();

      if (arquivo) {
        caminho =
          `${ticketId}/${user.id}/${mensagemId}.${extensoes[arquivo.type]}`;

        const { error } = await supabase.storage
          .from("atendimento-anexos")
          .upload(caminho, arquivo, {
            contentType: arquivo.type,
            upsert: false,
          });

        if (error) {
          setErro("Não foi possível enviar o anexo. Confira o bucket e as permissões.");
          return;
        }

        uploadConcluido = true;
      }

      const { error } = await supabase.from("mensagens").insert({
        id: mensagemId,
        ticket_id: ticketId,
        autor_id: user.id,
        texto,
        arquivo_path: caminho,
      });

      if (error) {
        setErro("Não foi possível salvar a mensagem. Tente novamente.");
        return;
      }

      mensagemSalva = true;
      formulario.current?.reset();
      router.refresh();
    } catch {
      setErro("Falha de conexão. Tente novamente.");
    } finally {
      if (uploadConcluido && !mensagemSalva && caminho) {
        try {
          await supabase.storage
            .from("atendimento-anexos")
            .remove([caminho]);
        } catch {
          // O envio não foi concluído; mantém a mensagem de erro.
        }
      }

      setEnviando(false);
    }
  }

  return (
    <form ref={formulario} onSubmit={enviar} className="mt-6 space-y-4 border-t border-[#ddd7cb] pt-6">
      <div>
        <label htmlFor="texto" className="text-sm font-semibold">
          Sua mensagem
        </label>
        <textarea
          id="texto"
          name="texto"
          rows={3}
          maxLength={5000}
          disabled={enviando}
          placeholder="Escreva aqui..."
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm disabled:opacity-60"
        />
      </div>

      <div>
        <label htmlFor="arquivo" className="block text-sm font-medium">
          Foto ou GIF — até 5 MB
        </label>
        <input
          id="arquivo"
          name="arquivo"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          disabled={enviando}
          className="mt-2 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[#e7eaf4] file:px-4 file:py-2 file:text-[#203d76]"
        />
      </div>

      {erro && (
        <p role="alert" className="text-sm text-red-700">
          {erro}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="rounded-xl bg-[#1759c7] px-6 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
      >
        {enviando ? "Enviando..." : "Enviar mensagem"}
      </button>

      <p className="text-xs text-slate-500">
        A conversa é atualizada automaticamente a cada 10 segundos.
      </p>
    </form>
  );
}