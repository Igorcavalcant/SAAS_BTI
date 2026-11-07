"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "../../lib/supabase/server";

class ErroAsaas extends Error {
  constructor(
    mensagem: string,
    public resultadoIncerto: boolean
  ) {
    super(mensagem);
  }
}

async function chamarAsaas<T>(
  caminho: string,
  dados?: Record<string, unknown>
): Promise<T> {
  const base = process.env.ASAAS_API_URL?.trim().replace(/\/$/, "");
  const chave = process.env.ASAAS_API_KEY?.trim();

  if (base !== "https://api-sandbox.asaas.com/v3" || !chave) {
    throw new ErroAsaas("Confira a configuração do Sandbox no .env.", false);
  }

  let resposta: Response;

  try {
    resposta = await fetch(`${base}${caminho}`, {
      method: dados ? "POST" : "GET",
      headers: {
        access_token: chave,
        "User-Agent": "SaaS-BTI",
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: dados ? JSON.stringify(dados) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    throw new ErroAsaas(
      "A conexão foi interrompida. Confira a operação no Asaas antes de repetir.",
      true
    );
  }

  if (!resposta.ok) {
    throw new ErroAsaas(
      resposta.status === 400
        ? "Asaas recusou os dados. Confira CPF/CNPJ, valor e vencimento."
        : `Asaas respondeu com HTTP ${resposta.status}.`,
      resposta.status >= 500 || resposta.status === 408
    );
  }

  try {
    return (await resposta.json()) as T;
  } catch {
    throw new ErroAsaas(
      "Asaas respondeu, mas não foi possível interpretar o resultado.",
      true
    );
  }
}

function validarLink(valor?: string): string | null {
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
    // Não exibe links inválidos.
  }

  return null;
}

export async function criarCobranca(formData: FormData) {
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

  if (erroAdmin || !admin) redirect("/pagamentos?erro=permissao");

  const id = String(formData.get("operacao_id") ?? "");
  const clienteId = String(formData.get("cliente_id") ?? "");
  const tipo = String(formData.get("tipo") ?? "");
  const forma = String(formData.get("forma") ?? "");
  const descricao = String(formData.get("descricao") ?? "").trim();
  const vencimento = String(formData.get("vencimento") ?? "");
  const valorTexto = String(formData.get("valor") ?? "").trim();
  const valor = Number(valorTexto.replace(",", "."));

  const uuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  const hoje = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Manaus",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const data = new Date(`${vencimento}T12:00:00Z`);
  const dataValida =
    /^\d{4}-\d{2}-\d{2}$/.test(vencimento) &&
    !Number.isNaN(data.getTime()) &&
    data.toISOString().slice(0, 10) === vencimento;

  if (
    !uuid.test(id) ||
    !uuid.test(clienteId) ||
    !["unico", "mensal"].includes(tipo) ||
    !["PIX", "BOLETO"].includes(forma) ||
    !descricao ||
    descricao.length > 500 ||
    !/^\d{1,6}([.,]\d{1,2})?$/.test(valorTexto) ||
    !Number.isFinite(valor) ||
    valor <= 0 ||
    valor > 100000 ||
    !dataValida ||
    vencimento < hoje
  ) {
    redirect("/pagamentos?erro=dados");
  }

  const { data: cliente, error: erroCliente } = await supabase
    .from("clientes")
    .select("id, nome, email, cpf_cnpj, asaas_sandbox_id")
    .eq("id", clienteId)
    .single();

  if (erroCliente || !cliente) redirect("/pagamentos?erro=cliente");

  // Registra a tentativa antes de chamar o Asaas.
  const { error: erroRegistro } = await supabase
    .from("cobrancas_sandbox")
    .insert({
      id,
      cliente_id: clienteId,
      tipo,
      descricao,
      valor,
      vencimento,
      forma,
    });

  if (erroRegistro) {
    redirect(
      erroRegistro.code === "23505"
        ? "/pagamentos?erro=repetida"
        : "/pagamentos?erro=banco"
    );
  }

  let falhou = false;

  try {
    let pagadorId: string | null = cliente.asaas_sandbox_id;

    if (!pagadorId) {
      const existentes = await chamarAsaas<{
        data: { id: string; cpfCnpj: string }[];
      }>(
        `/customers?externalReference=${encodeURIComponent(cliente.id)}&limit=2`
      );

      if (existentes.data.length > 1) {
        throw new ErroAsaas(
          "Há mais de um cadastro no Asaas com a referência deste cliente.",
          true
        );
      }

      const existente = existentes.data[0];

      if (
        existente &&
        existente.cpfCnpj.replace(/\D/g, "") !== cliente.cpf_cnpj
      ) {
        throw new ErroAsaas(
          "O documento do cadastro no Asaas não corresponde ao cliente.",
          true
        );
      }

      pagadorId = existente?.id ?? null;

      if (!pagadorId) {
        const novo = await chamarAsaas<{ id: string }>("/customers", {
          name: cliente.nome,
          email: cliente.email,
          cpfCnpj: cliente.cpf_cnpj,
          externalReference: cliente.id,
          notificationDisabled: true,
        });

        pagadorId = novo.id;

        if (!pagadorId) {
          throw new ErroAsaas("Não foi possível confirmar o cadastro.", true);
        }
      }

      const { data: vinculado, error: erroVinculo } = await supabase
        .from("clientes")
        .update({ asaas_sandbox_id: pagadorId })
        .eq("id", clienteId)
        .select("id")
        .single();

      if (erroVinculo || !vinculado) {
        throw new ErroAsaas(
          "O pagador foi localizado, mas não foi possível salvar seu vínculo.",
          true
        );
      }
    }

    const dadosComuns = {
      customer: pagadorId,
      billingType: forma,
      value: valor,
      description: descricao,
      externalReference: id,
    };

    const resultado = await chamarAsaas<{
      id: string;
      invoiceUrl?: string;
    }>(
      tipo === "mensal" ? "/subscriptions" : "/payments",
      tipo === "mensal"
        ? {
            ...dadosComuns,
            nextDueDate: vencimento,
            cycle: "MONTHLY",
          }
        : {
            ...dadosComuns,
            dueDate: vencimento,
          }
    );

    if (!resultado.id) {
      throw new ErroAsaas("Não foi possível confirmar a operação.", true);
    }

    const { data: salvo, error: erroSalvar } = await supabase
      .from("cobrancas_sandbox")
      .update({
        estado: "criada",
        asaas_id: resultado.id,
        fatura_url: validarLink(resultado.invoiceUrl),
        detalhe: null,
      })
      .eq("id", id)
      .select("id")
      .single();

    if (erroSalvar || !salvo) {
      throw new ErroAsaas(
        "A operação foi criada no Asaas, mas o registro local precisa de conferência.",
        true
      );
    }

    // A assinatura retorna seu próprio ID.
    // Consultamos separadamente a primeira fatura já gerada.
    if (tipo === "mensal") {
      try {
        const faturas = await chamarAsaas<{
          data: { invoiceUrl?: string }[];
        }>(`/subscriptions/${encodeURIComponent(resultado.id)}/payments`);

        const link = validarLink(faturas.data[0]?.invoiceUrl);

        if (link) {
          await supabase
            .from("cobrancas_sandbox")
            .update({ fatura_url: link })
            .eq("id", id);
        }
      } catch {
        // A assinatura já foi criada.
        // Não repete sua criação caso a consulta da fatura falhe.
      }
    }
  } catch (erro) {
    falhou = true;

    const incerto = !(erro instanceof ErroAsaas) || erro.resultadoIncerto;
    const detalhe =
      erro instanceof ErroAsaas
        ? erro.message
        : "Resultado não confirmado. Confira a operação no Asaas.";

    await supabase
      .from("cobrancas_sandbox")
      .update({
        estado: incerto ? "revisar" : "erro",
        detalhe,
      })
      .eq("id", id);
  }

  revalidatePath("/pagamentos");
  redirect(falhou ? "/pagamentos?erro=operacao" : "/pagamentos?sucesso=1");
}