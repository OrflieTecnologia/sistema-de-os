import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSessionUser } from '@/lib/auth'
import { listarDepartamentos } from '@/app/actions'
import { CadastroForm } from '@/components/auth/cadastro-form'
import { OrfliaLogo } from '@/components/OrfliaLogo'

export const dynamic = 'force-dynamic'

export default async function CadastroPage() {
  const user = await getSessionUser()
  if (user) {
    redirect('/')
  }

  const departamentos = await listarDepartamentos()

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950 text-zinc-100 relative overflow-hidden">
      {/* Background Glow Blobs */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-lg space-y-6">
        {/* Header Branding com OrfliaLogo */}
        <div className="text-center space-y-2 flex flex-col items-center">
          <OrfliaLogo size="lg" showBadge={false} />
          <p className="text-xs sm:text-sm text-zinc-400">
            Cadastro de Novo Colaborador
          </p>
        </div>

        {/* Card do Formulário */}
        <div className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="border-b border-zinc-800/80 pb-4">
            <h2 className="text-lg font-bold text-white">Criar Nova Conta</h2>
            <p className="text-xs text-zinc-400">Cadastre-se para abrir e acompanhar ordens de serviço internas</p>
          </div>

          <CadastroForm departamentos={departamentos.filter((d) => d.ativo)} />

          <div className="pt-2 text-center text-xs text-zinc-400">
            Já possui uma conta cadastrada?{' '}
            <Link
              href="/login"
              className="text-orange-500 hover:text-orange-400 font-semibold underline-offset-4 hover:underline transition-colors"
            >
              Fazer login
            </Link>
          </div>
        </div>

        {/* Rodapé */}
        <p className="text-center text-[11px] text-zinc-500">
          Orflia Enterprise &copy; {new Date().getFullYear()} — Plataforma de Chamados Internos
        </p>
      </div>
    </div>
  )
}
