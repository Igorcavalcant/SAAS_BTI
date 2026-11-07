"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "../../lib/supabase/server";

const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function criarChamado(formData: FormData) {
  const supabase = await createClient();

  const { data: { user }, error: erroUsuario } =
    await supabase.auth.getUser();

  if (erroUsuario || !user) redirect("/login");

  const assunto = String(formData.get("assunto") ?? "").trim();

  if (!assunto || assunto.length > 150) {
    redirect("/atendimento?erro=assunto");
  }

  const { data, error } = await supabase
    .from("tickets")
    .insert({
      assunto,
      cliente_id: user.id,
      status: "aberto",
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect("/atendimento?erro=salvar");
  }

  revalidatePath("/atendimento");
  redirect(`/atendimento/${data.id}`);
}

export async function alterarStatus(formData: FormData) {
  const supabase = await createClient();

  const { data: { user }, error: erroUsuario } =
    await supabase.auth.getUser();

  if (erroUsuario || !user) redirect("/login");

  const id = String(formData.get("ticket_id") ?? "");
  const status = String(formData.get("status") ?? "");

  if (
    !uuid.test(id) ||
    !["aberto", "em_andamento", "resolvido"].includes(status)
  ) {
    redirect("/atendimento?erro=dados");
  }

  const { data: admin, error: erroAdmin } = await supabase
    .from("administradores")
    .select("usuario_id")
    .eq("usuario_id", user.id)
    .maybeSingle();

  if (erroAdmin || !admin) {
    redirect(`/atendimento/${id}?erro=permissao`);
  }

  const { data, error } = await supabase
    .from("tickets")
    .update({ status })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    redirect(`/atendimento/${id}?erro=status`);
  }

  revalidatePath("/atendimento");
  revalidatePath(`/atendimento/${id}`);
  redirect(`/atendimento/${id}`);
}
export async function iniciarConversa() {
  const supabase = await createClient();

  const {
    data: { user },
    error: erroUsuario,
  } = await supabase.auth.getUser();

  if (erroUsuario || !user) {
    redirect("/login");
  }

  const { data: existente, error: erroConsulta } = await supabase
    .from("tickets")
    .select("id")
    .eq("cliente_id", user.id)
    .eq("tipo", "conversa")
    .maybeSingle();

  if (erroConsulta) {
    redirect("/atendimento?erro=conversa");
  }

  if (existente) {
    redirect(`/atendimento/${existente.id}`);
  }

  const { data, error } = await supabase
    .from("tickets")
    .insert({
      cliente_id: user.id,
      assunto: "Conversa com o suporte",
      tipo: "conversa",
      status: "aberto",
    })
    .select("id")
    .single();

  if (error?.code === "23505") {
    const { data: conversa } = await supabase
      .from("tickets")
      .select("id")
      .eq("cliente_id", user.id)
      .eq("tipo", "conversa")
      .maybeSingle();

    if (conversa) {
      redirect(`/atendimento/${conversa.id}`);
    }
  }

  if (error || !data) {
    redirect("/atendimento?erro=conversa");
  }

  revalidatePath("/atendimento");
  redirect(`/atendimento/${data.id}`);
}