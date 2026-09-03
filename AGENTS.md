# Contexto do Projeto: Orflie - Sistema de Gestão de Ordens de Serviço Internas (OS)

## 📌 Visão Geral
Sistema corporativo fullstack para abertura, acompanhamento e gerenciamento de Ordens de Serviço (OS) **Internas entre Departamentos da empresa (Orflie)**, com autenticação completa (Login/Cadastro com hash `bcryptjs`), controle de acesso baseado em papéis (**RBAC: Administrador vs Membro Comum**), Navbar corporativa global com navegação contextual ampla, atribuição dinâmica de responsáveis técnicos por setor, painel de métricas operacionais, controle de setores, gráficos em tempo real, módulo analítico de produtividade com exportação em **CSV (UTF-8 com BOM para Excel)** e **PDF corporativo oficial**, sob a identidade visual Dark & Laranja (#F97316).

---

## 🛠️ Stack Tecnológica & Padrões
- **Framework:** Next.js 16 (App Router, Server Components e Server Actions)
- **Linguagem:** TypeScript (strict mode)
- **Estilização:** Tailwind CSS v4 (Identidade Visual Dark & Laranja Corporativo em `zinc-950` / `neutral-900` / `orange-500` / `amber-500`)
- **Autenticação & Sessão:** Fluxo completo com telas de `/login` e `/cadastro`, hash de senhas via `bcryptjs` e persistência de sessão em cookies seguros (`orflie_session` em `src/lib/auth.ts` e `src/app/auth/actions.ts`)
- **Navegação Global:** Navbar corporativa (`src/components/Navbar.tsx`) com branding Orflie, abas contextuais (*Minhas OS*, *Painel do Setor*, *Relatórios*, *Administração*), Dark/Light mode toggle, avatar com iniciais e logout funcional.
- **Temas:** `next-themes` (Tema escuro padrão com alternância fluida)
- **Ícones:** `lucide-react`
- **Gráficos & Visualização:** `recharts` (Gráficos de Demandas por Departamento Destino e Volume por Prioridade)
- **Banco de Dados:** PostgreSQL hospedado no Supabase
- **ORM:** Prisma ORM 5.x (`prisma/schema.prisma` e `src/lib/prisma.ts`)
- **Exportações:** CSV nativo UTF-8 com BOM (compatibilidade com Excel) e PDF/Impressão corporativa estilizada via `@media print`.
- **Deploy Alvo:** Vercel

---

## 🏛️ Modelo de Domínio (Prisma)
- **`Usuario`**:
  - `id`: Identificador único (cuid)
  - `nome`, `email` (@unique), `senha` (hash bcrypt)
  - `role`: `ADMIN` ou `MEMBRO`
  - `departamentoId`: Vínculo com o setor de lotação
  - Relações: `departamento`, `ordensSolicitadas`, `ordensAtendidas` e `relatoriosGerados`
- **`Departamento`**:
  - `id`: Identificador único (cuid)
  - `nome`: Nome do setor corporativo (único — Ex: Comercial, Diretoria, Financeiro, Marketing, Operações, RH, TI)
  - `ativo`: Flag booleano para disponibilidade de recebimento de chamados
  - Relações: `usuarios`, `ordensOrigem`, `ordensDestino` e `relatorios`
- **`OrdemServico`**:
  - `id`, `codigo`: Identificador único e código amigável (`OS-XXXXXX-XXX`)
  - `titulo`, `descricao`: Informações detalhadas do chamado
  - `solicitanteId`: Colaborador autenticado que abriu o chamado
  - `responsavelId`: Colaborador ou técnico atendendo (opcional, atribuído dinamicamente)
  - `departamentoOrigemId`: Setor solicitante
  - `departamentoDestinoId`: Setor responsável pelo atendimento
  - `status`: `ABERTA`, `EM_ANDAMENTO`, `AGUARDANDO_RESPOSTA`, `CONCLUIDA`, `CANCELADA`
  - `prioridade`: `BAIXA`, `MEDIA`, `ALTA`, `URGENTE`
- **`Relatorio`**:
  - `id`, `codigo`: Identificador único (`REL-YYYYMMDD-XXXXX`)
  - `titulo`, `tipo` (`MINHAS_OS`, `SETOR`, `GERAL`)
  - `departamentoId`: Vínculo com o setor do relatório (opcional)
  - `autorId`: Usuário que gerou o relatório
  - `totalOS`, `abertas`, `emAndamento`, `concluidas`, `canceladas`, `dadosJson`
  - `criadoEm`: Data/hora de emissão

---

## 📂 Estrutura de Diretórios
- `src/app/`: Páginas, layouts e Server Actions
  - `login/page.tsx`: Tela de autenticação com glassmorphism
  - `cadastro/page.tsx`: Tela de cadastro de novos colaboradores com vínculo departamental
  - `page.tsx`: Dashboard principal com visualização contextual (`minhas`, `setor`, `relatorios`)
  - `minhas-os/page.tsx`, `painel-setor/page.tsx`, `relatorios/page.tsx`: Subrotas canônicas
  - `departamentos/page.tsx`: Gestão de departamentos (restrita a `ADMIN`)
  - `actions.ts`: Server Actions para Ordens de Serviço, Departamentos, Usuários e Relatórios
  - `auth/actions.ts`: Server Actions para Login, Cadastro e Logout
- `src/lib/`: Instâncias singleton (`prisma.ts`), autenticação (`auth.ts`) e hooks utilitários (`use-mounted.ts`)
- `src/components/`: Componentes modulares
  - `Navbar.tsx`: Navbar corporativa global com branding Orflie ampliado, abas centrais e perfil
  - `OrfliaLogo.tsx`: Logo oficial com alternância de tema Dark/Light
  - `dashboard/`:
    - `header.tsx`: Cabeçalho contextual com botão de Nova OS e botão de Gerar Relatório
    - `metrics-cards.tsx`: KPIs operacionais
    - `charts-section.tsx`: Gráficos analíticos Recharts
    - `os-modal.tsx`: Modal com carregamento dinâmico de técnicos por setor de destino
    - `os-list-container.tsx`: Listagem com busca textual, fluxo `[Origem ➔ Destino]`, coluna de responsável e filtros avançados
    - `relatorio-produtividade.tsx`: Painel analítico de produtividade com exportação CSV e PDF oficial
    - `relatorios-list.tsx`: Histórico de relatórios gerados com visualizador modal e exclusão
  - `departamentos/`:
    - `departamentos-manager.tsx`: Painel de administração de setores
- `prisma/`: Definições do schema e scripts de seed automatizados (`seed.ts`)

---

## 📋 Regras de Desenvolvimento para o Agente
1. **TypeScript Estrito:** Sempre tipar parâmetros, retornos de funções e Server Actions. Evitar o uso de `any`.
2. **Server-First:** Priorizar Server Components para renderização e Server Actions com `revalidatePath` para mutações de dados.
3. **Persistência Segura:** Utilizar sempre a instância singleton `prisma` de `@/lib/prisma`.
4. **Tratamento de Erros:** Retornar feedback claro para formulários e chamadas assíncronas.
5. **Comandos Prisma:** Utilizar sempre a CLI local (`./node_modules/.bin/prisma` ou `npx prisma`) sem dependências conflitantes.

---

## 🗺️ Roadmap de Implementação (Fases)

### Fase 1: Core CRUD de OS Internas (Concluída)
- [x] Criação e listagem de Ordens de Serviço Internas com setor de Origem e Destino.
- [x] Atualização dinâmica do status da OS (`ABERTA`, `EM_ANDAMENTO`, `AGUARDANDO_RESPOSTA`, `CONCLUIDA`, `CANCELADA`).
- [x] Modal interativo de abertura rápida de chamados corporativos.
- [x] Exclusão segura de chamados com confirmação.

### Fase 2: Gestão de Departamentos & Fluxo Interdepartamental (Concluída)
- [x] Criação e listagem de Departamentos corporativos.
- [x] Alternância do status Ativo/Desativado dos setores via Server Actions.
- [x] Contadores de volumetria de chamados vinculados por setor (Origem/Destino).
- [x] Página dedicada de administração em `/departamentos` com proteção de rota para `ADMIN`.

### Fase 3: Filtros, Buscas e Visualização (Concluída)
- [x] Filtro por status com contadores em tempo real.
- [x] Filtro por Departamento (Destino/Origem) e Prioridade.
- [x] Busca instantânea por título, solicitante, departamento, código ou descrição.
- [x] Alternância entre visualização em Tabela detalhada e Grade de Cards.

### Fase 4: Métricas e Dashboard Administrativo (Concluída)
- [x] Cards de métricas operacionais internas (Total, Abertos, Em Atendimento, Concluídos & Eficiência).
- [x] Gráficos visuais Recharts (Demandas por Setor Destino e Volume por Prioridade).
- [x] Identidade visual Dark & Laranja Corporativo com suporte a alternância de temas.

### Fase 5: Autenticação Completa, Nova Navbar e RBAC (Concluída)
- [x] Modelo `Usuario` no Prisma vinculado a `Departamento` e `OrdemServico` (`solicitanteId`, `responsavelId`).
- [x] Telas de `/login` e `/cadastro` com validações e hash `bcryptjs`.
- [x] Proteção de rotas com redirecionamento de usuários não autenticados.
- [x] Navbar corporativa global **Orflie** com abas contextuais (*Minhas OS*, *Painel do Setor*, *Relatórios*, *Administração*).
- [x] Avatar do usuário, badge com nome do Departamento, Dark/Light Mode e Logout funcional.

### Fase 6: Atribuição de Técnicos, Escopo Estrito e Relatórios Avançados (Concluída)
- [x] Escopo isolado em "Minhas OS" (somente abertas pelo usuário logado) e "Painel do Setor" (demandas destinadas ao setor do usuário).
- [x] Atribuição dinâmica de Responsável Técnico no modal com carregamento dos colaboradores do setor de destino.
- [x] Módulo analítico de Produtividade por Prestador com cálculo de tempo médio de atendimento e resolução.
- [x] Exportação de relatórios em CSV (UTF-8 com BOM para Excel) e PDF/Impressão corporativa oficial.

### Fase 7: Gestão Administrativa de Usuários & RBAC Dinâmico (Concluída)
- [x] Painel de Controle de Usuários na aba `/departamentos` exclusivo para `ADMIN`.
- [x] Alternância dinâmica de permissões de acesso (**ADMIN** vs **MEMBRO**) via Server Action protegida com feedback em tempo real.
- [x] Busca instantânea, filtros por papel/departamento, barra de rolagem estilizada e paginação em ambas as tabelas (Usuários e Departamentos).

### Fase 8: Rastreabilidade de Responsáveis, Detalhamento de OS & Relatórios Enriquecidos (Concluída)
- [x] **Auto-atribuição ao concluir:** Ao marcar uma OS como `CONCLUIDA`, o `responsavelId` é atribuído automaticamente ao usuário logado que executou a ação, registrando quem efetivamente realizou o atendimento (`atualizarStatusOS` em `src/app/actions.ts`). **Exceção:** OS que já possuem responsável atribuído mantêm o responsável original (não sobrescreve).
- [x] **Modal de detalhes da OS:** Ao clicar no card (ou no botão de detalhes 👁 na tabela) abre-se um modal com os detalhes completos da ordem — código, título, descrição integral, status, prioridade, solicitante, responsável, fluxo origem ➔ destino, data de abertura e tempo de resolução (`os-list-container.tsx`).
- [x] **Relatórios enriquecidos (PDF/CSV):** A exportação em PDF e CSV agora inclui um resumo de produtividade por responsável — (a) total de OS realizadas, (b) quem realizou cada OS (responsável técnico) e (c) o tempo médio de conclusão (da abertura à conclusão), além do tempo de resolução por OS no detalhamento (`relatorio-produtividade.tsx`).

### Fase 9: Identidade da Navbar, Perfil do Colaborador & Responsividade Mobile (Concluída)
- [x] **Ajuste de marca na Navbar:** O rótulo ao lado da logo foi alterado de `OS INTERNAS` para `O.S INTERNAS` (ponto entre o "O" e o "S") em `src/components/OrfliaLogo.tsx`.
- [x] **Página de Perfil do Colaborador:** A área do nome/avatar na Navbar virou um link para a página `/perfil` (`src/app/perfil/page.tsx` + `src/components/perfil/perfil-form.tsx`), onde o colaborador edita nome, e-mail e senha, e escolhe/remove uma **foto de perfil**.
  - Campo `fotoUrl` (String opcional) adicionado ao modelo `Usuario` (`prisma/schema.prisma`), exposto em `SessionUser` (`src/lib/auth.ts`); a foto é armazenada em **base64** e a Navbar exibe o avatar quando houver, com fallback nas iniciais.
  - **Editor de recorte/redimensionamento** (`src/components/perfil/avatar-cropper.tsx`): ao escolher a imagem abre um modal com arraste (posicionar) e zoom; ao aplicar, gera um recorte quadrado redimensionado (320×320 JPEG), mantendo a foto leve no banco. Limite de upload de **5MB** no arquivo original.
  - Server Action `atualizarPerfil` (`src/app/actions.ts`) com validação de e-mail único, senha mínima e limite de segurança de tamanho da imagem, com `revalidatePath`.
- [x] **Responsividade Mobile / Telas Pequenas:** Navbar com **menu hambúrguer colapsável** no mobile/tablet (`md:hidden`), altura adaptativa e ocultação progressiva de elementos; dashboard, cards, tabelas (rolagem horizontal), modais e relatórios revisados para telas pequenas com grids `grid-cols-1` na base.

### Fase 10: Troca de Setor de Colaboradores no Painel Admin (Concluída)
- [x] **Alteração de setor pelo Admin:** Na aba `/departamentos` (Controle de Usuários & Acessos), a coluna "Setor / Departamento" virou um **seletor editável** — o administrador troca o setor de qualquer colaborador na hora (`src/components/departamentos/departamentos-manager.tsx`). Server Action `alterarSetorUsuario` (`src/app/actions.ts`) protegida por `requireAdmin`, com validação do setor de destino e `revalidatePath`.

### Fase 11: Proteção de Exclusão de OS Concluídas (Concluída)
- [x] **Excluir indisponível em OS concluídas:** O botão de excluir some (na tabela e nos cards) quando a OS está `CONCLUIDA`, mantendo o botão "Ver Detalhes" (`src/components/dashboard/os-list-container.tsx`). Reforço no servidor: `excluirOrdemServico` (`src/app/actions.ts`) recusa apagar OS concluída, preservando o histórico e a integridade dos relatórios de produtividade.

### Fase 12: Controle de Quem Altera o Status da OS (Concluída)
- [x] **Só o setor de destino altera o status:** O seletor de status fica **bloqueado (com cadeado e tooltip)** para o dono/solicitante — apenas colaboradores do setor de destino (`departamentoDestinoId`) podem alterar. Além disso, **OS concluída trava o status para todos**. Aplicado na tabela e nos cards (`src/components/dashboard/os-list-container.tsx`, que recebe `currentUserDeptId` via `src/app/page.tsx`). Reforço no servidor: `atualizarStatusOS` (`src/app/actions.ts`) recusa a alteração se o usuário não for do setor de destino ou se a OS já estiver concluída.

### Fase 13: Paginação das Listagens (Concluída)
- [x] **Paginação na lista de OS:** As listagens de "Minhas OS" e "Painel do Setor" agora paginam (9 por página, tabela e cards), com controles anterior/próxima e contador "Mostrando X de Y" (`src/components/dashboard/os-list-container.tsx`). Volta à página 1 ao mudar filtros/busca.
- [x] **Paginação nos relatórios:** A tabela de produtividade por prestador na tela de Relatórios pagina (8 por página) com os mesmos controles (`src/components/dashboard/relatorio-produtividade.tsx`); o documento de impressão/PDF continua listando todos os itens. O reset de página usa o padrão do React de ajuste de estado em render (sem `useEffect`).

### Fase 15: Restrição de Exclusão de OS (Dono ou Admin) (Concluída)
- [x] **Só o dono ou um ADMIN podem excluir:** O botão de excluir só aparece para o solicitante que abriu a OS ou para um Administrador — some para os demais (inclusive colegas do setor de destino no Painel do Setor), evitando exclusões indevidas (`src/components/dashboard/os-list-container.tsx`, recebe `currentUserId` via `src/app/page.tsx`). Reforço no servidor: `excluirOrdemServico` (`src/app/actions.ts`) recusa a exclusão se o usuário não for o dono nem ADMIN (além da regra de OS concluída já existente).

### Fase 14: Comentários e Anexos (Prints) nas OS (Concluída)
- [x] **Novos modelos:** `AnexoOS` (imagens em base64 já comprimidas) e `ComentarioOS` (texto + autor), ambos com relação `Cascade` para `OrdemServico` (`prisma/schema.prisma`).
- [x] **Anexos na criação:** O modal de Nova OS ganhou um campo de **prints/imagens com preview** (até 6, redimensionadas/comprimidas no cliente via `src/lib/image-utils.ts`), enviadas como base64 e salvas como `AnexoOS` (`src/components/dashboard/os-modal.tsx`, `criarOrdemServico`).
- [x] **Thread de comentários + galeria na tela de detalhes:** O modal de detalhes da OS (`os-list-container.tsx`) carrega comentários e anexos sob demanda (`obterDetalhesOS`), permite **adicionar comentários e novos prints** e removê-los. Server Actions: `adicionarComentario`, `adicionarAnexoOS`, `excluirComentario`, `excluirAnexoOS` (`src/app/actions.ts`), com limites de tamanho/quantidade. As imagens ficam em tabela separada para não pesar as listagens.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
