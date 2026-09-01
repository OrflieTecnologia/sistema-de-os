<div align="center">
  <h1>🏢 Orflie — Sistema de Ordens de Serviço Internas</h1>
  <p><strong>Plataforma corporativa fullstack para gestão, acompanhamento, produtividade e fluxo de chamados interdepartamentais.</strong></p>

  <p>
    <img src="https://img.shields.io/badge/Next.js%2016-App%20Router-black?style=for-the-badge&logo=next.js" alt="Next.js 16" />
    <img src="https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind%20CSS-v4-38bdf8?style=for-the-badge&logo=tailwindcss" alt="Tailwind CSS v4" />
    <img src="https://img.shields.io/badge/Prisma%20ORM-5.x-2D3748?style=for-the-badge&logo=prisma" alt="Prisma ORM" />
    <img src="https://img.shields.io/badge/PostgreSQL-Supabase-336791?style=for-the-badge&logo=postgresql" alt="PostgreSQL" />
  </p>
</div>

---

## 📌 Sobre o Projeto

O **Orflie** é uma solução corporativa completa para centralizar e otimizar a abertura, triagem, atendimento e auditoria de Ordens de Serviço (OS) entre os departamentos de uma empresa (Ex: TI, RH, Comercial, Financeiro, Marketing, Operações e Diretoria).

O sistema oferece controle de permissões por papel (**RBAC: Administrador vs Membro Comum**), métricas em tempo real, painel de produtividade por prestador com exportação em **CSV (compatível nativamente com Excel)** e **impressão direta em layout executivo A4 / PDF**, sob uma identidade visual moderna *Dark & Laranja Corporativo*.

---

## 🚀 Principais Funcionalidades

### 1. 🧭 Fluxo Interdepartamental de OS & Escopo Isolado
- **Minhas OS (`/minhas-os`):** Acompanhamento exclusivo das solicitações criadas pelo colaborador logado para outros setores.
- **Painel do Setor (`/painel-setor`):** Visualização e triagem da fila de demandas destinadas à equipe do departamento do usuário logado, permitindo atualização dinâmica do status (`ABERTA`, `EM_ANDAMENTO`, `AGUARDANDO_RESPOSTA`, `CONCLUIDA`, `CANCELADA`).
- **Abertura Rápida de Chamados:** Modal inteligente com filtragem automática (não permite abrir OS para o próprio setor) e carregamento dinâmico de colaboradores do setor de destino.

### 2. 👤 Atribuição de Responsáveis Técnicos
- Possibilidade de direcionar o chamado para um colaborador específico do setor responsável ou manter na *Fila Geral*.
- Filtros por técnico e status na listagem com alternância entre visualização em **Tabela** e **Cards**.

### 3. 📊 Módulo de Relatórios de Produtividade (CSV & PDF)
- **Painel Analítico (`/relatorios`):** Métricas de tempo médio de atendimento, taxa de resolução e volume de OS por colaborador do setor no mês/período.
- **Exportação CSV:** Arquivo formatado em UTF-8 com BOM (`\uFEFF`), garantindo acentuação perfeita no Microsoft Excel.
- **Impressão Direta em PDF:** Layout corporativo milimétrico para 1 página A4 com logo oficial do tema claro, metadados e tabela de prestadores.

### 4. 🛡️ Gestão Administrativa & RBAC Dinâmico (`/departamentos`)
- **Controle de Usuários:** Alternância de permissões (**ADMIN** 🛡️ vs **MEMBRO** 👤) com 1 clique e proteção contra desativação acidental do último administrador.
- **Gestão de Setores:** Cadastro de novos departamentos, ativação/desativação e monitoramento de volumetria interdepartamental.
- **Filtros e Usabilidade:** Campo de busca em tempo real, filtros por papel/setor, barras de rolagem estilizadas e paginação integrada.

### 5. 🔐 Autenticação Segura & Design Responsivo
- Autenticação completa com hash de senhas via `bcryptjs` e persistência de sessão em cookies seguros (`orflie_session`).
- Alternância de tema **Dark / Light Mode** com `next-themes`.
- Interface full-width moderna, fluida e responsiva para desktop e dispositivos móveis.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| **Framework Fullstack** | Next.js 16 (App Router, Server Components & Server Actions) |
| **Linguagem** | TypeScript (Strict Mode) |
| **Estilização** | Tailwind CSS v4 |
| **Banco de Dados** | PostgreSQL (Supabase) |
| **ORM** | Prisma ORM 5.x |
| **Autenticação** | Sessão via Cookies Seguros com hash `bcryptjs` |
| **Ícones & Temas** | `lucide-react` & `next-themes` |
| **Visualização de Dados** | `recharts` |

---

## 📂 Estrutura de Diretórios

```bash
sistema-os/
├── prisma/
│   ├── schema.prisma        # Modelo de dados (Usuario, Departamento, OrdemServico, Relatorio)
│   └── seed.ts              # Script de população inicial do banco
├── public/
│   └── logos/               # Logos oficiais da Orflia (Dark e Light)
├── src/
│   ├── app/
│   │   ├── actions.ts       # Server Actions de OS, Setores, Usuários e Relatórios
│   │   ├── auth/actions.ts  # Server Actions de Login, Cadastro e Logout
│   │   ├── cadastro/        # Tela de registro de novos colaboradores
│   │   ├── login/           # Tela de autenticação corporativa
│   │   ├── departamentos/   # Painel Administrativo de Usuários (RBAC) e Setores (ADMIN)
│   │   ├── minhas-os/       # Redirecionamento e visão de Minhas Solicitações
│   │   ├── painel-setor/    # Redirecionamento e visão do Painel do Setor
│   │   ├── relatorios/      # Módulo Analítico de Produtividade
│   │   └── page.tsx         # Dashboard central com visualização contextual
│   ├── components/
│   │   ├── Navbar.tsx       # Navbar global com branding Orflie e navegação
│   │   ├── OrfliaLogo.tsx   # Componente de logo adaptável ao tema
│   │   ├── auth/            # Formulários de autenticação
│   │   ├── dashboard/       # Componentes operacionais, modais, badges e relatórios
│   │   └── departamentos/   # Painel de gestão de usuários e setores
│   └── lib/
│       ├── auth.ts          # Utilitários de sessão e RBAC
│       └── prisma.ts        # Instância singleton do Prisma Client
├── .env.example             # Modelo de variáveis de ambiente
└── README.md
```

---

## ⚡ Como Rodar o Projeto Localmente

### 1. Clonar o Repositório
```bash
git clone https://github.com/MarcioJSMJr/sistema-os.git
cd sistema-os
```

### 2. Instalar as Dependências
```bash
npm install
```

### 3. Configurar as Variáveis de Ambiente
Copie o arquivo de exemplo `.env.example` para `.env`:
```bash
cp .env.example .env
```
Preencha as credenciais do seu banco de dados PostgreSQL:
```env
DATABASE_URL="postgresql://usuario:senha@host:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://usuario:senha@host:5432/postgres"
```

### 4. Sincronizar o Banco e Popular Dados Iniciais
```bash
# Cria as tabelas no banco de dados
npx prisma db push

# Popula os departamentos e usuários de teste
npx tsx prisma/seed.ts
```

### 5. Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```
Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

---

## 🔑 Credenciais Padrão de Teste (Seed)

| Perfil | E-mail | Senha | Setor |
|---|---|---|---|
| **Administrador (ADMIN)** 🛡️ | `admin@orflie.com` | `admin123` | Tecnologia da Informação (TI) |
| **Membro Comum (MEMBRO)** 👤 | `mariana@orflie.com` | `membro123` | Comercial |
| **Membro Comum (MEMBRO)** 👤 | `roberto@orflie.com` | `membro123` | Financeiro |

---

## 📄 Licença

Este projeto é desenvolvido para uso corporativo sob a identidade **Orflie**.
Todos os direitos reservados.
