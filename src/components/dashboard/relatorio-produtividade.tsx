'use client'

import { useState, useTransition, useEffect, useCallback, useMemo } from 'react'
import {
  obterDadosRelatorioProdutividade,
  RelatorioProdutividadeDTO,
  UsuarioDTO,
} from '@/app/actions'
import { SessionUser } from '@/lib/auth'
import {
  Printer,
  Download,
  RefreshCw,
  Loader2,
  User,
  UserCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

interface RelatorioProdutividadeProps {
  currentUser: SessionUser
  todosUsuarios: UsuarioDTO[]
}

export function RelatorioProdutividade({
  currentUser,
  todosUsuarios,
}: RelatorioProdutividadeProps) {
  const currentMonthStr = new Date().toISOString().slice(0, 7) // "YYYY-MM"
  const [mesAno, setMesAno] = useState<string>(currentMonthStr)
  const [responsavelId, setResponsavelId] = useState<string>('TODOS')
  const [statusFiltro, setStatusFiltro] = useState<string>('TODOS')
  const [prioridadeFiltro, setPrioridadeFiltro] = useState<string>('TODAS')

  const [relatorio, setRelatorio] = useState<RelatorioProdutividadeDTO | null>(null)
  const [isPending, startTransition] = useTransition()
  const [itensPage, setItensPage] = useState(1)
  const itensPorPagina = 8

  // Filtra apenas membros do departamento do usuário logado
  const membrosDoSetor = useMemo(() => {
    return todosUsuarios.filter((u) => u.departamentoId === currentUser.departamentoId)
  }, [todosUsuarios, currentUser.departamentoId])

  // Paginação da tabela de produtividade por prestador
  const itens = useMemo(() => relatorio?.itens ?? [], [relatorio])
  const totalItensPages = Math.max(1, Math.ceil(itens.length / itensPorPagina))
  const safeItensPage = Math.min(itensPage, totalItensPages)
  const itensPaginados = useMemo(() => {
    const start = (safeItensPage - 1) * itensPorPagina
    return itens.slice(start, start + itensPorPagina)
  }, [itens, safeItensPage])

  // Volta à primeira página quando um novo relatório é carregado
  // (padrão do React de ajustar estado durante o render, sem useEffect)
  const [prevRelatorio, setPrevRelatorio] = useState(relatorio)
  if (relatorio !== prevRelatorio) {
    setPrevRelatorio(relatorio)
    setItensPage(1)
  }

  // Carrega relatório filtrado estritamente para o setor do usuário logado
  const carregarRelatorio = useCallback(() => {
    startTransition(async () => {
      const data = await obterDadosRelatorioProdutividade({
        mesAno,
        departamentoId: currentUser.departamentoId,
        responsavelId,
        status: statusFiltro,
        prioridade: prioridadeFiltro,
      })
      setRelatorio(data)
    })
  }, [mesAno, currentUser.departamentoId, responsavelId, statusFiltro, prioridadeFiltro])

  useEffect(() => {
    carregarRelatorio()
  }, [carregarRelatorio])

  // Exportação CSV compatível com Excel (UTF-8 com BOM)
  const exportarCSV = () => {
    if (!relatorio || relatorio.ordensDetalhe.length === 0) {
      alert('Não há dados disponíveis para exportação no período e filtros selecionados.')
      return
    }

    const escape = (str: string) => `"${(str || '').replace(/"/g, '""')}"`

    // ---------------------------------------------------------------------
    // SEÇÃO 1 — RESUMO DE PRODUTIVIDADE
    // Quantas OS foram feitas, quem fez cada uma e o tempo médio de execução.
    // ---------------------------------------------------------------------
    const resumoLinhas: string[] = []
    resumoLinhas.push(escape('RESUMO DE PRODUTIVIDADE'))
    resumoLinhas.push([escape('Período'), escape(relatorio.periodo)].join(';'))
    resumoLinhas.push([escape('Departamento'), escape(relatorio.departamentoNome)].join(';'))
    resumoLinhas.push([escape('Total de OS'), escape(String(relatorio.totalOS))].join(';'))
    resumoLinhas.push([escape('OS Concluídas'), escape(String(relatorio.totalConcluidas))].join(';'))
    resumoLinhas.push([escape('Taxa de Resolução'), escape(`${relatorio.taxaResolucao}%`)].join(';'))
    resumoLinhas.push(
      [escape('Tempo Médio de Resolução (Geral)'), escape(relatorio.tempoMedioGeralFormatado)].join(';')
    )
    resumoLinhas.push('')

    // Produtividade por responsável: quem fez, quantas OS e o tempo médio
    const produtividadeHeader = [
      'Responsável Técnico',
      'Setor Responsável',
      'Total de OS',
      'OS Concluídas',
      'Tempo Médio de Resolução',
    ]
    resumoLinhas.push(produtividadeHeader.join(';'))
    relatorio.itens.forEach((item) => {
      resumoLinhas.push(
        [
          escape(item.responsavelNome),
          escape(item.departamentoNome),
          escape(String(item.totalOS)),
          escape(String(item.concluidas)),
          escape(item.tempoMedioFormatado),
        ].join(';')
      )
    })
    resumoLinhas.push('')
    resumoLinhas.push('')

    // ---------------------------------------------------------------------
    // SEÇÃO 2 — DETALHAMENTO DAS ORDENS DE SERVIÇO
    // ---------------------------------------------------------------------
    const headers = [
      'Código',
      'Título',
      'Solicitante',
      'Setor Origem',
      'Setor Destino',
      'Responsável Técnico',
      'Prioridade',
      'Status',
      'Data Abertura',
      'Data Conclusão/Atualização',
      'Tempo de Resolução',
    ]

    const rows = relatorio.ordensDetalhe.map((os) => {
      const tempoResolucao =
        os.status === 'CONCLUIDA' ? formatarDuracao(os.criadoEm, os.atualizadoEm) : '-'
      return [
        escape(os.codigo),
        escape(os.titulo),
        escape(os.solicitante.nome),
        escape(os.departamentoOrigem.nome),
        escape(os.departamentoDestino.nome),
        escape(os.responsavel?.nome || 'Fila Geral'),
        escape(os.prioridade),
        escape(os.status),
        escape(new Date(os.criadoEm).toLocaleString('pt-BR')),
        escape(new Date(os.atualizadoEm).toLocaleString('pt-BR')),
        escape(tempoResolucao),
      ].join(';')
    })

    const detalheLinhas = [
      escape('DETALHAMENTO DAS ORDENS DE SERVIÇO'),
      headers.join(';'),
      ...rows,
    ]

    const csvContent ='\uFEFF' + [...resumoLinhas, ...detalheLinhas].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute(
      'download',
      `Relatorio_Produtividade_${currentUser.departamentoNome.replace(/\s+/g, '_')}_${mesAno}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Disparo direto da impressão nativa do Windows (sem modal)
  const handleGerarPDFDireto = () => {
    if (!relatorio || relatorio.totalOS === 0) {
      alert('Gere o relatório primeiro com os filtros desejados antes de imprimir.')
      return
    }
    window.print()
  }

  const formatarDataHora = (iso: string) => {
    try {
      const d = new Date(iso)
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d)
    } catch {
      return iso
    }
  }

  // Duração entre a abertura e a conclusão da OS, em formato amigável
  const formatarDuracao = (inicioIso: string, fimIso: string) => {
    try {
      const diffMs = new Date(fimIso).getTime() - new Date(inicioIso).getTime()
      if (diffMs <= 0) return 'menos de 1 min'
      const minutos = Math.floor(diffMs / (1000 * 60))
      const dias = Math.floor(minutos / (60 * 24))
      const horas = Math.floor((minutos % (60 * 24)) / 60)
      const mins = minutos % 60
      const partes: string[] = []
      if (dias > 0) partes.push(`${dias}d`)
      if (horas > 0) partes.push(`${horas}h`)
      if (mins > 0 && dias === 0) partes.push(`${mins}min`)
      return partes.length > 0 ? partes.join(' ') : 'menos de 1 min'
    } catch {
      return '-'
    }
  }

  const nomePrestadorSelecionado = useMemo(() => {
    if (responsavelId === 'TODOS') return 'Todos os Prestadores do Setor'
    if (responsavelId === 'SEM_RESPONSAVEL') return 'Fila Geral (Sem Responsável)'
    const u = todosUsuarios.find((user) => user.id === responsavelId)
    return u ? u.nome : 'Colaborador Específico'
  }, [responsavelId, todosUsuarios])

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* ESTILOS DE IMPRESSÃO OFICIAL PARA A4 / PDF (NÃO QUEBRA A PÁGINA) */}
      {/* ========================================================================= */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          html,
          body {
            background-color: #ffffff !important;
            background: #ffffff !important;
            color: #09090b !important;
            height: auto !important;
            overflow: visible !important;
            font-size: 12px !important;
          }
          /* Oculta toda a aplicação */
          body * {
            visibility: hidden !important;
          }
          /* Exibe exclusivamente o documento oficial de relatório */
          #documento-oficial-relatorio,
          #documento-oficial-relatorio * {
            visibility: visible !important;
          }
          #documento-oficial-relatorio {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #09090b !important;
            display: block !important;
            page-break-after: avoid !important;
            break-inside: avoid !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* ========================================================================= */}
      {/* CARD PRINCIPAL DO RELATÓRIO DE PRODUTIVIDADE (TELA) */}
      {/* ========================================================================= */}
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/90 dark:border-zinc-800/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 no-print">
        {/* Header do Card */}
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">
              Relatório de Produtividade ({currentUser.departamentoNome})
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
              Setor {currentUser.departamentoNome}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Métricas de atendimento das demandas direcionadas para a sua equipe. Escolha o seu usuário para emitir apenas as suas ordens cumpridas ou consolide todo o setor.
          </p>
        </div>

        {/* Filtros em Linha: Mês, Prestador, Status, Prioridade e Botões (SEM DROPDOWN DE DEPARTAMENTO) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 p-5 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-700/70 items-end">
          {/* Mês / Período */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
              Mês / Período
            </label>
            <input
              type="month"
              value={mesAno}
              onChange={(e) => setMesAno(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all cursor-pointer"
            />
          </div>

          {/* Prestador / Colaborador do Setor */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
              <span className="flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-orange-500" />
                Prestador / Técnico
              </span>
            </label>
            <select
              value={responsavelId}
              onChange={(e) => setResponsavelId(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all cursor-pointer"
            >
              <option value="TODOS">👥 Todo o Setor ({currentUser.departamentoNome})</option>
              <option value={currentUser.id}>⭐ Apenas Minhas OS ({currentUser.nome})</option>
              <option value="SEM_RESPONSAVEL">Fila Geral (Sem Resp. Atribuído)</option>
              {membrosDoSetor
                .filter((u) => u.id !== currentUser.id)
                .map((u) => (
                  <option key={`rel-user-${u.id}`} value={u.id}>
                    👤 {u.nome}
                  </option>
                ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
              Status
            </label>
            <select
              value={statusFiltro}
              onChange={(e) => setStatusFiltro(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all cursor-pointer"
            >
              <option value="TODOS">Todos os Status</option>
              <option value="CONCLUIDA">Concluídas</option>
              <option value="EM_ANDAMENTO">Em Atendimento</option>
              <option value="ABERTA">Abertas</option>
              <option value="CANCELADA">Canceladas</option>
            </select>
          </div>

          {/* Prioridade */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
              Prioridade
            </label>
            <select
              value={prioridadeFiltro}
              onChange={(e) => setPrioridadeFiltro(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all cursor-pointer"
            >
              <option value="TODAS">Todas</option>
              <option value="BAIXA">🟢 Baixa</option>
              <option value="MEDIA">🟡 Média</option>
              <option value="ALTA">🟠 Alta</option>
              <option value="URGENTE">🔴 Urgente</option>
            </select>
          </div>

          {/* Botões de Ação: Gerar, CSV, PDF Direto */}
          <div className="flex flex-wrap items-center gap-2 justify-end">
            <button
              type="button"
              onClick={carregarRelatorio}
              disabled={isPending}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-orange-600/20 active:scale-98 transition-all cursor-pointer"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span>Gerar</span>
            </button>

            <button
              type="button"
              onClick={exportarCSV}
              disabled={isPending || !relatorio || relatorio.totalOS === 0}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs sm:text-sm font-bold transition-all cursor-pointer disabled:opacity-50"
              title="Exportar dados em formato CSV (UTF-8 com BOM para Excel)"
            >
              <Download className="w-4 h-4 text-orange-500" />
              <span>CSV</span>
            </button>

            <button
              type="button"
              onClick={handleGerarPDFDireto}
              disabled={isPending || !relatorio || relatorio.totalOS === 0}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
              title="Imprimir / Salvar PDF diretamente"
            >
              <Printer className="w-4 h-4 text-orange-500" />
              <span>Gerar PDF</span>
            </button>
          </div>
        </div>

        {/* Resumo de Indicadores */}
        {relatorio && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold block">
                Total de Demandas
              </span>
              <strong className="text-2xl font-black text-zinc-900 dark:text-white mt-1 block">
                {relatorio.totalOS}
              </strong>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60">
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold block">
                OS Concluídas
              </span>
              <strong className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
                {relatorio.totalConcluidas}
              </strong>
            </div>

            <div className="p-4 rounded-2xl bg-orange-50/80 dark:bg-orange-950/40 border border-orange-200/60 dark:border-orange-800/60">
              <span className="text-xs text-orange-600 dark:text-orange-400 font-semibold block">
                Taxa de Resolução
              </span>
              <strong className="text-2xl font-black text-orange-600 dark:text-orange-400 mt-1 block">
                {relatorio.taxaResolucao}%
              </strong>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/60">
              <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold block">
                Tempo Médio de Resolução
              </span>
              <strong className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1 block">
                {relatorio.tempoMedioGeralFormatado}
              </strong>
            </div>
          </div>
        )}

        {/* Tabela de Produtividade por Prestador */}
        {relatorio && (
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 bg-zinc-50/70 dark:bg-zinc-900/70">
                  <th className="py-3.5 px-5">Prestador / Responsável</th>
                  <th className="py-3.5 px-4">Setor Responsável</th>
                  <th className="py-3.5 px-4 text-center">Total de OS</th>
                  <th className="py-3.5 px-4 text-center">OS Concluídas</th>
                  <th className="py-3.5 px-4 text-right">Tempo Médio de Resolução</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60 text-xs sm:text-sm">
                {relatorio.itens.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-400">
                      Nenhum dado registrado para os filtros selecionados no setor {currentUser.departamentoNome}.
                    </td>
                  </tr>
                ) : (
                  itensPaginados.map((item, idx) => (
                    <tr
                      key={`item-${item.responsavelId || idx}`}
                      className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-5 font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <User className="w-4 h-4 text-orange-500" />
                        <span>{item.responsavelNome}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-md font-semibold text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                          {item.departamentoNome}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-zinc-700 dark:text-zinc-300">
                        {item.totalOS}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                        {item.concluidas}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-orange-600 dark:text-orange-400">
                        {item.tempoMedioFormatado}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação da tabela de produtividade */}
        {relatorio && itens.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 text-xs text-zinc-500 dark:text-zinc-400">
            <span>
              Mostrando <strong>{itensPaginados.length}</strong> de <strong>{itens.length}</strong> prestadores
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setItensPage((p) => Math.max(1, p - 1))}
                disabled={safeItensPage <= 1}
                className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                title="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-zinc-700 dark:text-zinc-300 px-2">
                Página {safeItensPage} de {totalItensPages}
              </span>
              <button
                type="button"
                onClick={() => setItensPage((p) => Math.min(totalItensPages, p + 1))}
                disabled={safeItensPage >= totalItensPages}
                className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                title="Próxima página"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* DOCUMENTO OFICIAL PARA IMPRESSÃO / PDF (LOGO TEMA BRANCO, 1 PÁGINA PERFEITA) */}
      {/* ========================================================================= */}
      {relatorio && (
        <div id="documento-oficial-relatorio" className="hidden print:block bg-white text-zinc-950 font-sans p-0 m-0 w-full">
          {/* Header Corporativo com Logo Orflia Tema Claro (Branco) */}
          <div className="flex items-center justify-between border-b-2 border-zinc-200 pb-4 mb-5">
            <div className="flex items-center gap-3">
              {/* Logo do tema branco: "orfl" em cinza e "ia" em laranja */}
              <div className="text-3xl font-sans tracking-tight leading-none">
                <span className="text-zinc-400 font-medium">orfl</span>
                <span className="text-orange-600 font-bold">ia</span>
              </div>
              <div className="h-6 w-px bg-zinc-300 mx-1" />
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Sistema de Ordem de Serviço
              </span>
            </div>
            <div className="text-right text-[11px] text-zinc-500 space-y-0.5 leading-tight">
              <p className="font-bold text-zinc-800">Relatório de Produtividade · Ordens de Serviço Orflie</p>
              <p>Gerado em: {formatarDataHora(relatorio.geradoEm)}</p>
            </div>
          </div>

          {/* Título Principal */}
          <div className="mb-4">
            <h1 className="text-2xl font-black text-zinc-900 tracking-tight">
              Relatório de Produtividade
            </h1>
          </div>

          {/* Bloco de Metadados / Resumo */}
          <div className="bg-zinc-50 border border-zinc-300 rounded-xl p-4 grid grid-cols-4 gap-4 text-xs mb-6">
            <div>
              <span className="text-zinc-500 font-bold block uppercase text-[10px]">Período</span>
              <strong className="text-zinc-900 text-sm font-bold">{relatorio.periodo}</strong>
            </div>
            <div>
              <span className="text-zinc-500 font-bold block uppercase text-[10px]">Departamento</span>
              <strong className="text-zinc-900 text-sm font-bold">{currentUser.departamentoNome}</strong>
            </div>
            <div>
              <span className="text-zinc-500 font-bold block uppercase text-[10px]">Filtro Prestador</span>
              <strong className="text-zinc-900 text-sm font-bold">{nomePrestadorSelecionado}</strong>
            </div>
            <div>
              <span className="text-zinc-500 font-bold block uppercase text-[10px]">OS Concluídas / Taxa</span>
              <strong className="text-emerald-700 text-sm font-bold">
                {relatorio.totalConcluidas} ({relatorio.taxaResolucao}%)
              </strong>
            </div>
          </div>

          {/* Tabela de Prestadores Zebrada e Limpa */}
          <div className="border border-zinc-300 rounded-lg overflow-hidden mb-6">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-100 border-b border-zinc-300 font-bold text-zinc-800">
                  <th className="py-2.5 px-4 border-r border-zinc-300">Prestador (quem fez)</th>
                  <th className="py-2.5 px-4 border-r border-zinc-300 text-center">Total de OS</th>
                  <th className="py-2.5 px-4 border-r border-zinc-300 text-center">OS concluídas</th>
                  <th className="py-2.5 px-4 text-right">Tempo médio de resolução</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-zinc-900">
                {relatorio.itens.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-zinc-500">
                      Nenhum registro de produtividade no período para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  relatorio.itens.map((item, idx) => (
                    <tr key={`print-row-${idx}`} className={idx % 2 === 1 ? 'bg-zinc-50' : 'bg-white'}>
                      <td className="py-2.5 px-4 border-r border-zinc-200 font-semibold text-zinc-900">
                        {item.responsavelNome}
                      </td>
                      <td className="py-2.5 px-4 border-r border-zinc-200 text-center font-bold text-zinc-900">
                        {item.totalOS}
                      </td>
                      <td className="py-2.5 px-4 border-r border-zinc-200 text-center font-bold text-zinc-900">
                        {item.concluidas}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-zinc-950">
                        {item.tempoMedioFormatado}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Rodapé Oficial da Impressão */}
          <div className="pt-6 border-t border-zinc-300 flex items-center justify-between text-[10px] text-zinc-500">
            <span>Orflie Enterprise — Relatório Oficial Emitido Automaticamente</span>
            <span>Página 1 / 1</span>
          </div>
        </div>
      )}
    </div>
  )
}
