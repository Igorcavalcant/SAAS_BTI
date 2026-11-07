"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

export async function cadastrarCliente(formData: FormData) {
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
    redirect("/clientes?erro=permissao");
  }

  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const cpfCnpj = String(formData.get("cpf_cnpj") ?? "")
    .replace(/\D/g, "");
  const telefone = String(formData.get("telefone") ?? "")
    .replace(/\D/g, "");
  const usuarioId = String(formData.get("usuario_id") ?? "").trim();

  const uuidValido =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (
    nome.length < 2 ||
    nome.length > 150 ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !/^(\d{11}|\d{14})$/.test(cpfCnpj) ||
    telefone.length > 20 ||
    (usuarioId && !uuidValido.test(usuarioId))
  ) {
    redirect("/clientes?erro=dados");
  }

  const { error } = await supabase.from("clientes").insert({
    nome,
    email,
    cpf_cnpj: cpfCnpj,
    telefone,
    usuario_id: usuarioId || null,
  });

  if (error) {
    if (error.code === "23505") {
      redirect("/clientes?erro=duplicado");
    }

    if (error.code === "23503") {
      redirect("/clientes?erro=usuario");
    }

    redirect("/clientes?erro=salvar");
  }

  revalidatePath("/clientes");
  redirect("/clientes?sucesso=1");
}