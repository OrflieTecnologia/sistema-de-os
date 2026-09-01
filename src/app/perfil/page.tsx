import { requireAuth } from '@/lib/auth'
import { Navbar } from '@/components/Navbar'
import { PerfilForm } from '@/components/perfil/perfil-form'

export const dynamic = 'force-dynamic'

export default async function PerfilPage() {
  const currentUser = await requireAuth()

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-200">
      {/* Navbar Corporativa Global */}
      <Navbar user={currentUser} />

      {/* Background Subtle Gradient Blobs em Laranja */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-500/10 dark:bg-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      {/* Conteúdo */}
      <main className="w-full max-w-3xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        <PerfilForm user={currentUser} />

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
