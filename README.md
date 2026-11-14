# SAAS BTI — Plataforma de Gestão de Serviços de TI

Uma plataforma SaaS desenvolvida para facilitar a gestão de clientes, projetos e atendimentos de profissionais e empresas de tecnologia.

O **SAAS BTI** tem como objetivo centralizar a comunicação entre prestadores de serviços de TI e seus clientes, oferecendo um ambiente organizado, intuitivo e seguro para acompanhar serviços, solicitações e atividades.

---

## 🎯 Objetivo do projeto

Desenvolver uma solução que permita a profissionais de tecnologia e pequenas empresas administrar seus clientes e serviços em um único ambiente, melhorando a organização, a produtividade e a experiência do cliente.

## 🚀 Funcionalidades

### Implementadas

- [x] Sistema de autenticação de usuários.
- [x] Integração com Supabase Auth.
- [x] Painel administrativo protegido.
- [x] Controle de acesso administrativo.
- [x] Estrutura inicial do sistema de atendimento.
- [x] Organização de chamados por status:
  - Aberto.
  - Em andamento.
  - Resolvido.

### Em desenvolvimento

- [x] Gestão completa de projetos.
- [x] Acompanhamento das etapas dos projetos.
- [x] Cadastro e gerenciamento de clientes.
- [x] Chat entre clientes e administradores.
- [x] Envio de imagens e arquivos no atendimento.
- [x] Central de documentação.
- [x] Gestão de pagamentos.

### Planejadas

- [x] Pagamentos únicos e recorrentes.
- [x] Histórico de serviços dos clientes.
- [x] Notificações de atualizações.
- [x] Melhorias de segurança e escalabilidade.

## 🛠️ Tecnologias utilizadas

| Tecnologia    | Utilização                   |
| ------------- | ---------------------------- |
| Next.js       | Desenvolvimento da aplicação |
| Supabase      | Backend e autenticação       |
| Supabase Auth | Gerenciamento de usuários    |
| Git           | Controle de versão           |
| GitHub        | Versionamento e documentação |

## 📂 Estrutura do projeto

O projeto utiliza a arquitetura do Next.js com App Router, organizando as páginas e funcionalidades em módulos.

Principais áreas da aplicação:

- Autenticação e login.
- Painel administrativo.
- Gestão de projetos.
- Atendimento e chamados.
- Documentação.
- Pagamentos.

## ⚙️ Como executar o projeto

**1. Clone o repositório**

```bash
git clone URL_DO_SEU_REPOSITORIO
```

**2. Entre na pasta**

```bash
cd saas-bti
```

**3. Instale as dependências**

```bash
npm install
```

**4. Configure as variáveis de ambiente**

Crie um arquivo `.env.local` na raiz do projeto e configure as credenciais do Supabase conforme os nomes utilizados na aplicação.

Exemplo:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave
```

Nunca compartilhe chaves privadas ou credenciais no GitHub.

**5. Execute o projeto**

```bash
npm run dev
```

Acesse:

```text
http://localhost:3000
```

## 🔐 Segurança

O projeto utiliza autenticação pelo Supabase e proteção de áreas administrativas.

As credenciais e configurações sensíveis devem permanecer em variáveis de ambiente, fora do controle de versão.

## 📈 Próximos passos

O desenvolvimento do SAAS BTI busca evoluir para uma plataforma completa de gestão de serviços de tecnologia, com foco em:

- Experiência do usuário.
- Organização empresarial.
- Comunicação entre clientes e prestadores.
- Automação de processos.
- Gestão financeira.
- Escalabilidade da aplicação.

## 👨‍💻 Desenvolvimento

Projeto desenvolvido como iniciativa própria, com foco em desenvolvimento Full Stack, soluções SaaS e aplicação prática de tecnologias modernas.

**SAAS BTI — Tecnologia, organização e soluções em um só lugar.**
