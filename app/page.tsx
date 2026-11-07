import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../lib/supabase/server";

async function sair() {
  "use server";

  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error("Não foi possível sair. Tente novamente.");
  }

  redirect("/login");
}

function Icone({ tipo }: { tipo: string }) {
  const classe = "h-12 w-12 shrink-0";

  if (tipo === "projetos") {
    return (
      <svg className={classe} viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <path
          d="M5 12a3 3 0 0 1 3-3h10l5 5h17a3 3 0 0 1 3 3v21H5V12Z"
          fill="#8CA6B3"
          stroke="#293948"
          strokeWidth="1.5"
        />
        <path
          d="M9 19h30v19H9V19Z"
          fill="#E0E4F2"
          stroke="#293948"
          strokeWidth="1.5"
        />
        <path
          d="M14 24h30l-7 16H5l9-16Z"
          fill="#F2EBD7"
          stroke="#293948"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (tipo === "atendimento") {
    return (
      <svg className={classe} viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <path
          d="M7 25v-5a17 17 0 0 1 34 0v5"
          stroke="#293948"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <rect x="3" y="21" width="9" height="16" rx="4" fill="#B8B4D8" stroke="#293948" strokeWidth="1.5" />
        <rect x="36" y="21" width="9" height="16" rx="4" fill="#A3CDCD" stroke="#293948" strokeWidth="1.5" />
        <path d="M35 35c0 6-4 8-11 8" stroke="#293948" strokeWidth="1.5" />
        <rect x="19" y="40" width="9" height="5" rx="2.5" fill="#293948" />
        <path
          d="M24 13c-7 0-12 4-12 11 0 4 2 7 5 9l-1 5 6-3h2c7 0 12-4 12-11s-5-11-12-11Z"
          fill="#F1E8C9"
          stroke="#293948"
          strokeWidth="1.5"
        />
        <circle cx="19" cy="24" r="1" fill="#293948" />
        <circle cx="24" cy="24" r="1" fill="#293948" />
        <circle cx="29" cy="24" r="1" fill="#293948" />
      </svg>
    );
  }

  if (tipo === "documentacao") {
    return (
      <svg className={classe} viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <path d="M15 4h17l6 7v28H15V4Z" fill="#E9E5D9" stroke="#293948" strokeWidth="1.5" />
        <path d="M10 8h17l6 7v28H10V8Z" fill="#A3CDCD" stroke="#293948" strokeWidth="1.5" />
        <path d="M5 13h17l6 7v25H5V13Z" fill="#BDC6E7" stroke="#293948" strokeWidth="1.5" />
        <path
          d="M22 13v8h6M10 27h13M10 32h13M10 37h10"
          stroke="#293948"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path d="M34 17h5M34 27h5M34 37h5" stroke="#293948" />
        <circle cx="42" cy="17" r="2" fill="#A3CDCD" stroke="#293948" />
        <circle cx="42" cy="27" r="2" fill="#A3CDCD" stroke="#293948" />
        <circle cx="42" cy="37" r="2" fill="#A3CDCD" stroke="#293948" />
      </svg>
    );
  }

  return (
    <svg className={classe} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path
        d="M6 4l4 2 4-2 4 2 4-2 4 2 4-2v37l-4-2-4 2-4-2-4 2-4-2-4 2V4Z"
        fill="#F2E8CF"
        stroke="#293948"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M11 13h14M11 18h14M11 23h9"
        stroke="#293948"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <rect x="20" y="27" width="25" height="17" rx="3" fill="#A3CDCD" stroke="#293948" strokeWidth="1.5" />
      <path d="M20 32h25" stroke="#293948" strokeWidth="3" />
      <path d="M25 39h7" stroke="#293948" strokeLinecap="round" />
      <circle cx="39" cy="39" r="2" fill="#F2E8CF" />
    </svg>
  );
}

const modulos = [
  {
    tipo: "projetos",
    titulo: "Projetos",
    descricao: "Acompanhe etapas, prazos e entregas.",
    href: "/projetos",
  },
  {
    tipo: "atendimento",
    titulo: "Atendimento",
    descricao: "Organize chamados e solicitações.",
    href: "/atendimento",
  },
  {
    tipo: "documentacao",
    titulo: "Documentação",
    descricao: "Reúna arquivos e informações dos projetos.",
    href: "/documentacao",
  },
  {
    tipo: "pagamentos",
    titulo: "Pagamentos",
    descricao: "Consulte assinaturas e cobranças.",
    href: "/pagamentos",
  },
];

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#faf9f5] px-5 py-7 font-sans text-[#171b26] sm:px-8 sm:py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-0 -z-10 h-[500px] w-[500px] rounded-full bg-[#f5eedc]/40 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 top-0 -z-10 h-[500px] w-[500px] rounded-full bg-[#e5e8f5]/40 blur-3xl"
      />

      <svg
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-48 -z-10 h-[560px] w-[1100px] -translate-x-1/2 opacity-45"
        viewBox="0 0 1100 560"
        fill="none"
      >
        <g stroke="#d8ccb8" strokeWidth="1">
          <path d="M20 360C220 650 500 0 850 70s170 100 230 130" />
          <path d="M35 385C270 620 460 30 820 85s170 55 250 150" />
          <path d="M40 410C250 650 530 5 810 105s210 40 260 170" />
          <path d="M30 340C280 610 470 70 850 120s150 60 220 90" />
          <path d="M60 430C310 620 470 10 900 45" />
        </g>
      </svg>

      <div className="mx-auto w-full max-w-[880px]">
        <header className="flex flex-wrap items-center justify-between gap-6 rounded-[20px] border border-[#ddd9d0] bg-gradient-to-r from-[#f8f2e4] via-[#f5f3ef] to-[#e9ebf7] px-6 py-6 shadow-[0_12px_22px_-12px_rgba(62,53,36,0.45)] sm:px-7">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <svg
                aria-hidden="true"
                viewBox="0 0 28 32"
                className="h-7 w-6 text-[#203d76]"
                fill="currentColor"
              >
                <path d="M3 3l7-3v28l-7 4V3Zm10 2h4c7 0 11 4 11 10s-4 12-11 12h-4v-7h3c4 0 6-2 6-5s-2-4-6-4h-3V5Z" />
              </svg>

              <p className="text-sm sm:text-base">
                <span className="text-lg font-bold">BTI</span>
                <span className="mx-1">•</span>
                Plataforma SaaS
                <span className="ml-2 text-[#ba955c]">★</span>
              </p>
            </div>

            <h1 className="mt-2 text-[28px] font-medium tracking-tight">
              Meu painel
            </h1>

            <p className="mt-1 break-all text-sm">
              Conectado como {user.email}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div
              aria-hidden="true"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/60 bg-gradient-to-br from-[#b3aaa0] via-[#48575d] to-[#252c38] shadow-md"
            >
              <svg viewBox="0 0 32 32" className="h-9 w-9" fill="none">
                <path d="M4 9l13-5 11 8-4 15-17-4L4 9Z" stroke="#d9cfbd" />
                <path d="M4 9l15 7-12 7L4 9Z" fill="#79a6a5" />
                <path d="M19 16l9-4-4 15-5-11Z" fill="#e1b4a3" />
                <path d="M17 4l2 12L4 9l13-5Z" fill="#746b69" />
                <path d="M7 23l12-7 5 11-17-4Z" fill="#384957" />
              </svg>
            </div>

            <form action={sair}>
              <button
                type="submit"
                className="rounded-xl border border-[#1644a0] bg-gradient-to-b from-[#163e8b] to-[#1761dc] px-6 py-3 text-sm font-medium text-white shadow-[0_6px_14px_rgba(30,89,193,0.3)] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
              >
                Sair
              </button>
            </form>
          </div>
        </header>

        <section className="mt-8 sm:mt-9">
          <h2 className="text-2xl font-medium tracking-tight">
            Bem-vindo ao seu espaço
          </h2>

          <p className="mt-2 text-base">
            Aqui você acompanhará seus projetos e serviços.
          </p>

          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            {modulos.map((modulo) => (
              <article
                key={modulo.tipo}
                className="rounded-[18px] border border-[#ddd7cb] bg-[#fcfbf7]/95 p-6 shadow-[0_12px_20px_-12px_rgba(57,49,35,0.5)]"
              >
                <div className="flex items-center gap-4">
                  <Icone tipo={modulo.tipo} />

                  <h3 className="text-[23px] font-medium tracking-tight">
                    {modulo.href ? (
                      <Link
                        href={modulo.href}
                        className="rounded hover:text-blue-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4"
                      >
                        {modulo.titulo}
                      </Link>
                    ) : (
                      modulo.titulo
                    )}
                  </h3>
                </div>

                <p className="mt-4 text-[15px] leading-6">
                  {modulo.descricao}
                </p>

                <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#acd3d1] px-3 py-1 text-xs font-medium text-[#244347]">
                  Em desenvolvimento
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 rounded-full bg-white/80"
                  />
                </span>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}