import { listarOrdensServico, listarDepartamentos, listarTodosUsuarios } from './actions'
import { requireAuth } from '@/lib/auth'
import { Navbar } from '@/components/Navbar'
import { Header } from '@/components/dashboard/header'
import { MetricsCards } from '@/components/dashboard/metrics-cards'
import { OsListContainer } from '@/components/dashboard/os-list-container'
import { RelatorioProdutividade } from '@/components/dashboard/relatorio-produtividade'

export const dynamic = 'force-dynamic'

interface HomePageProps {
  searchParams: Promise<{
    view?: 'minhas' | 'setor' | 'relatorios'
  }>
}

export default async function Home({ searchParams }: HomePageProps) {
  // Autenticação obrigatória: redireciona para /login se não autenticado
  const currentUser = await requireAuth()
  const resolvedParams = await searchParams
  const currentView = resolvedParams.view || 'minhas'

  // Consultas contextuais paralelas
  const [ordens, departamentos, todosUsuarios] = await Promise.all([
    currentView === 'relatorios'
      ? Promise.resolve([])
      : listarOrdensServico({
          view: currentView,
          userId: currentUser.id,
          departamentoId: currentUser.departamentoId,
        }),
    listarDepartamentos(),
    currentView === 'relatorios' ? listarTodosUsuarios() : Promise.resolve([]),
  ])

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-200">
      {/* Navbar Corporativa Global Fixa no Topo */}
      <Navbar user={currentUser} />

      {/* Background Subtle Gradient Blobs em Laranja */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-500/10 dark:bg-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      {/* Layout Full Width que ocupa toda a largura da tela */}
      <main className="w-full px-4 sm:px-8 lg:px-14 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Header da View com Ações e Botão Nova OS */}
        <Header
          totalOS={ordens.length}
          departamentos={departamentos}
          currentUser={currentUser}
          currentView={currentView}
        />

        {/* Visualização de Relatórios: Módulo Focado de Produtividade com CSV e PDF */}
        {currentView === 'relatorios' ? (
          <div className="space-y-8">
            <RelatorioProdutividade
              currentUser={currentUser}
              todosUsuarios={todosUsuarios}
            />
          </div>
        ) : (
          /* Visualização Operacional (Minhas OS ou Painel do Setor) */
          <div className="space-y-6 sm:space-y-8">
            {/* Métricas e KPIs Operacionais */}
            <MetricsCards
              ordens={ordens}
              departamentos={departamentos}
              role={currentUser.role}
              userName={currentUser.nome}
            />

            {/* Listagem Interativa de Chamados */}
            <OsListContainer
              ordens={ordens}
              departamentos={departamentos}
              role={currentUser.role}
              currentUserName={currentUser.nome}
              currentUserId={currentUser.id}
              currentUserDeptId={currentUser.departamentoId}
            />
          </div>
        )}

        {/* Rodapé Corporativo */}
        <footer className="pt-8 pb-10 border-t border-zinc-200 dark:border-zinc-800/80 text-center text-xs text-zinc-500 dark:text-zinc-400">
          <p>
            Orflia &copy; {new Date().getFullYear()} — Plataforma Corporativa de Ordens de Serviço Internas.
          </p>
        </footer>
      </main>
    </div>
  )
}