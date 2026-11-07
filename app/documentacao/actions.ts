"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "../../lib/supabase/server";

const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function salvarDocumento(formData: FormData) {
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
    redirect("/documentacao?erro=permissao");
  }

  const id = String(formData.get("id") ?? "").trim();
  const projetoId = String(formData.get("projeto_id") ?? "").trim();
  const titulo = String(formData.get("titulo") ?? "").trim();
  const conteudo = String(formData.get("conteudo") ?? "").trim();

  if (
    (id && !uuid.test(id)) ||
    !uuid.test(projetoId) ||
    !titulo ||
    titulo.length > 150 ||
    !conteudo ||
    conteudo.length > 20000
  ) {
    redirect("/documentacao?erro=dados");
  }

  const { data: projeto, error: erroProjeto } = await supabase
    .from("projetos")
    .select("id")
    .eq("id", projetoId)
    .maybeSingle();

  if (erroProjeto || !projeto) {
    redirect("/documentacao?erro=projeto");
  }

  if (id) {
    const { data, error } = await supabase
      .from("documentos")
      .update({
        titulo,
        conteudo,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("projeto_id", projetoId)
      .select("id")
      .maybeSingle();

    if (error || !data) {
      redirect("/documentacao?erro=salvar");
    }
  } else {
    const { error } = await supabase.from("documentos").insert({
      projeto_id: projetoId,
      titulo,
      conteudo,
    });

    if (error) redirect("/documentacao?erro=salvar");
  }

  revalidatePath("/documentacao");
  redirect("/documentacao?sucesso=1");
}