import { OrdemServicoDTO, DepartamentoDTO } from '@/app/actions'
import { UserRole } from '@/lib/auth'
import {
  Layers,
  AlertCircle,
  Clock,
  CheckCircle2,
  Building2,
  ArrowRightLeft,
  UserCheck,
} from 'lucide-react'

interface MetricsCardsProps {
  ordens: OrdemServicoDTO[]
  departamentos: DepartamentoDTO[]
  role?: UserRole
  userName?: string
}

export function MetricsCards({
  ordens,
  departamentos,
  role = 'ADMIN',
  userName,
}: MetricsCardsProps) {
  const totalOS = ordens.length
  const abertas = ordens.filter((os) => os.status === 'ABERTA').length
  const emAndamento = ordens.filter((os) => os.status === 'EM_ANDAMENTO').length
  const aguardandoResposta = ordens.filter((os) => os.status === 'AGUARDANDO_RESPOSTA').length
  const emAtendimentoTotal = emAndamento + aguardandoResposta
  const concluidas = ordens.filter((os) => os.status === 'CONCLUIDA').length
  const canceladas = ordens.filter((os) => os.status === 'CANCELADA').length

  const departamentosAtivos = departamentos.filter((d) => d.ativo).length

  // Setores com chamados ativos
  const setoresComDemandas = new Set(
    ordens
      .filter((os) => os.status !== 'CONCLUIDA' && os.status !== 'CANCELADA')
      .map((os) => os.departamentoDestino.id)
  ).size

  const taxaConclusao = totalOS > 0 ? Math.round((concluidas / totalOS) * 100) : 0
  const taxaAbertas = totalOS > 0 ? Math.round((abertas / totalOS) * 100) : 0
  const taxaEmAtendimento = totalOS > 0 ? Math.round((emAtendimentoTotal / totalOS) * 100) : 0

  const isMember = role === 'MEMBRO'

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {/* Card 1: Total de Chamados / Minhas Solicitações */}
      <div className="relative overflow-hidden bg-white dark:bg-zinc-900/90 rounded-2xl border border-zinc-200 dark:border-zinc-800/90 p-5 shadow-xs hover:shadow-md transition-all duration-200 group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 dark:bg-orange-500/5 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {isMember ? 'Minhas Solicitações' : 'Total de Chamados'}
          </span>
          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/60 border border-orange-200/60 dark:border-orange-800/60 flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-xs">
            <Layers className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {totalOS}
          </span>
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {isMember ? 'pedidos meus' : 'solicitações gerais'}
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800/80 pt-3">
          <span className="flex items-center gap-1">
            {isMember ? (
              <>
                <UserCheck className="w-3.5 h-3.5 text-orange-500" />
                {userName || 'Minha conta'}
              </>
            ) : (
              <>
                <ArrowRightLeft className="w-3.5 h-3.5 text-orange-500" />
                Interdepartamental
              </>
            )}
          </span>
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">
            {canceladas} canceladas
          </span>
        </div>
      </div>

      {/* Card 2: Abertos / Triagem */}
      <div className="relative overflow-hidden bg-white dark:bg-zinc-900/90 rounded-2xl border border-zinc-200 dark:border-zinc-800/90 p-5 shadow-xs hover:shadow-md transition-all duration-200 group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 dark:bg-orange-500/5 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {isMember ? 'Abertas / Em Análise' : 'Abertos / Triagem'}
          </span>
          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/60 border border-orange-200/60 dark:border-orange-800/60 flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-xs">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-orange-600 dark:text-orange-400">
            {abertas}
          </span>
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            ({taxaAbertas}% do total)
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800/80 pt-3">
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
            </span>
            {isMember ? 'Aguardando início' : 'Aguardando setor'}
          </span>
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">
            Fila inicial
          </span>
        </div>
      </div>

      {/* Card 3: Em Atendimento */}
      <div className="relative overflow-hidden bg-white dark:bg-zinc-900/90 rounded-2xl border border-zinc-200 dark:border-zinc-800/90 p-5 shadow-xs hover:shadow-md transition-all duration-200 group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Em Atendimento
          </span>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs">
            <Clock className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
            {emAtendimentoTotal}
          </span>
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            ({taxaEmAtendimento}%)
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800/80 pt-3">
          <span>
            <strong className="text-amber-600 dark:text-amber-400">{emAndamento}</strong> em análise
          </span>
          <span>
            <strong className="text-purple-600 dark:text-purple-400">{aguardandoResposta}</strong> c/ resposta
          </span>
        </div>
      </div>

      {/* Card 4: Concluídas / Resolução */}
      <div className="relative overflow-hidden bg-white dark:bg-zinc-900/90 rounded-2xl border border-zinc-200 dark:border-zinc-800/90 p-5 shadow-xs hover:shadow-md transition-all duration-200 group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {isMember ? 'Concluídas' : 'Concluídos & Eficiência'}
          </span>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            {concluidas}
          </span>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
            {taxaConclusao}% finalizados
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800/80 pt-3">
          <span className="flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-emerald-500" />
            {isMember ? 'Atendimentos:' : 'Setores Ativos:'}
          </span>
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">
            {isMember
              ? `${concluidas} de ${totalOS} atendidos`
              : `${setoresComDemandas}/${departamentosAtivos} c/ demandas`}
          </span>
        </div>
      </div>
    </div>
  )
}
