'use client'

import { useState, useTransition } from 'react'
import { RelatorioDTO, excluirRelatorio } from '@/app/actions'
import {
  FileSpreadsheet,
  Trash2,
  Check,
  X,
  Printer,
  Eye,
  User,
  Calendar,
  Sparkles,
} from 'lucide-react'

interface RelatoriosListProps {
  relatorios: RelatorioDTO[]
}

export function RelatoriosList({ relatorios }: RelatoriosListProps) {
  const [selectedReport, setSelectedReport] = useState<RelatorioDTO | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await excluirRelatorio(id)
      setDeleteConfirmId(null)
      if (selectedReport?.id === id) {
        setSelectedReport(null)
      }
    })
  }

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString)
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d)
    } catch {
      return isoString
    }
  }

  const getTipoBadge = (tipo: 'MINHAS_OS' | 'SETOR' | 'GERAL') => {
    switch (tipo) {
      case 'MINHAS_OS':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            Minhas OS
          </span>
        )
      case 'SETOR':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
            Departamental
          </span>
        )
      case 'GERAL':
      default:
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-orange-50 dark:bg-orange-950/80 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
            Geral Corporativo
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Título & Descrição */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2.5">
            <FileSpreadsheet className="w-5 h-5 text-orange-500" />
            Histórico de Relatórios Gerados
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Relatórios salvos gerados a partir do Painel de Minhas OS e Painel do Setor
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
          {relatorios.length} {relatorios.length === 1 ? 'Relatório' : 'Relatórios'}
        </span>
      </div>

      {relatorios.length === 0 ? (
        <div className="py-16 px-4 text-center bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl rounded-3xl border border-zinc-200 dark:border-zinc-800">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 dark:bg-orange-950/80 text-orange-500 flex items-center justify-center mx-auto mb-3 shadow-xs">
            <FileSpreadsheet className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200">
            Nenhum relatório gerado ainda
          </h3>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mt-1">
            Navegue até as abas <strong className="text-zinc-800 dark:text-zinc-200">Minhas OS</strong> ou <strong className="text-zinc-800 dark:text-zinc-200">Painel do Setor</strong> e clique no botão &quot;Gerar Relatório&quot; para registrar um relatório instantâneo.
          </p>
        </div>
      ) : (
        /* Grid de Relatórios */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {relatorios.map((rel) => (
            <div
              key={rel.id}
              className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 p-6 flex flex-col justify-between space-y-5 shadow-xs hover:shadow-lg hover:border-orange-300 dark:hover:border-orange-500/50 transition-all duration-200 group"
            >
              {/* Header do Relatório */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                    {rel.codigo}
                  </span>
                  {getTipoBadge(rel.tipo)}
                </div>
                <h3 className="font-bold text-base text-zinc-900 dark:text-white leading-snug">
                  {rel.titulo}
                </h3>
              </div>

              {/* Métricas do Relatório */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 text-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Total</span>
                  <strong className="text-base font-black text-zinc-900 dark:text-white">{rel.totalOS}</strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Concluídas</span>
                  <strong className="text-base font-black text-emerald-600 dark:text-emerald-400">{rel.concluidas}</strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Taxa</span>
                  <strong className="text-base font-black text-orange-600 dark:text-orange-400">{rel.taxaResolucao}%</strong>
                </div>
              </div>

              {/* Informações do Autor & Data */}
              <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                  <span className="flex items-center gap-1.5 font-medium">
                    <User className="w-3.5 h-3.5 text-orange-500" />
                    {rel.autor.nome}
                  </span>
                  {rel.departamento && (
                    <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                      {rel.departamento.nome}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(rel.criadoEm)}
                  </span>
                </div>
              </div>

              {/* Ações */}
              <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedReport(rel)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-orange-50 dark:bg-orange-950/80 hover:bg-orange-100 dark:hover:bg-orange-900/60 text-orange-700 dark:text-orange-400 text-xs font-bold border border-orange-200 dark:border-orange-800 transition-colors cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>Visualizar</span>
                </button>

                {deleteConfirmId === rel.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleDelete(rel.id)}
                      disabled={isPending}
                      className="p-2 rounded-xl bg-rose-600 text-white hover:bg-rose-500 text-xs font-bold cursor-pointer"
                      title="Confirmar exclusão"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(null)}
                      className="p-2 rounded-xl bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold cursor-pointer"
                      title="Cancelar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(rel.id)}
                    className="p-2 rounded-xl text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="Excluir Relatório"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Detalhes do Relatório / Impressão */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedReport(null)}
          />

          <div className="relative w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden z-10 my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-950/80 border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400">
                      {selectedReport.codigo}
                    </span>
                    <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                      {selectedReport.titulo}
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Gerado em {formatDate(selectedReport.criadoEm)} por {selectedReport.autor.nome}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="w-8 h-8 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Conteúdo do Relatório */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* KPIs de Resumo */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 block font-semibold">Total Analisado</span>
                  <strong className="text-2xl font-black text-zinc-900 dark:text-white mt-1 block">
                    {selectedReport.totalOS}
                  </strong>
                </div>

                <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60">
                  <span className="text-xs text-orange-600 dark:text-orange-400 block font-semibold">Abertas / Triagem</span>
                  <strong className="text-2xl font-black text-orange-600 dark:text-orange-400 mt-1 block">
                    {selectedReport.abertas}
                  </strong>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60">
                  <span className="text-xs text-amber-600 dark:text-amber-400 block font-semibold">Em Atendimento</span>
                  <strong className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
                    {selectedReport.emAndamento}
                  </strong>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 block font-semibold">Concluídas ({selectedReport.taxaResolucao}%)</span>
                  <strong className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
                    {selectedReport.concluidas}
                  </strong>
                </div>
              </div>

              {/* Informações detalhadas */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/60 space-y-2 text-xs">
                <h4 className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-500" />
                  Metadados do Relatório
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-zinc-600 dark:text-zinc-300">
                  <p><strong>Autor:</strong> {selectedReport.autor.nome} ({selectedReport.autor.email})</p>
                  <p><strong>Departamento:</strong> {selectedReport.departamento?.nome || 'Geral'}</p>
                  <p><strong>Tipo:</strong> {selectedReport.tipo}</p>
                  <p><strong>Canceladas:</strong> {selectedReport.canceladas} chamados</p>
                </div>
              </div>

              {/* Ações do Modal: Imprimir */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-orange-600/25 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Relatório</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
