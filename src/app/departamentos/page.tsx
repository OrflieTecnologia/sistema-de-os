import { requireAdmin } from '@/lib/auth'
import { listarDepartamentos, listarUsuariosParaAdmin } from '@/app/actions'
import { Navbar } from '@/components/Navbar'
import { DepartamentosManager } from '@/components/departamentos/departamentos-manager'

export const dynamic = 'force-dynamic'

export default async function DepartamentosPage() {
  // Proteção de rota exclusiva para ADMIN
  const currentUser = await requireAdmin()
  const [departamentos, usuarios] = await Promise.all([
    listarDepartamentos(),
    listarUsuariosParaAdmin(),
  ])

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-200">
      {/* Navbar Corporativa Global */}
      <Navbar user={currentUser} />

      {/* Background Subtle Gradient Blobs em Laranja */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-500/10 dark:bg-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      {/* Layout Full Width */}
      <main className="w-full px-4 sm:px-8 lg:px-14 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Painel Administrativo de Departamentos e Usuários (RBAC) */}
        <DepartamentosManager
          departamentos={departamentos}
          usuarios={usuarios}
          currentUserId={currentUser.id}
        />

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
