'use client'

import { useState, useMemo, useTransition, useRef } from 'react'
import Image from 'next/image'
import {
  OrdemServicoDTO,
  DepartamentoDTO,
  DetalhesOSDTO,
  atualizarStatusOS,
  excluirOrdemServico,
  obterDetalhesOS,
  adicionarComentario,
  adicionarAnexoOS,
  excluirComentario,
  excluirAnexoOS,
} from '@/app/actions'
import { comprimirImagem } from '@/lib/image-utils'
import { UserRole } from '@/lib/auth'
import { STATUS_CONFIG, StatusBadge } from './status-badge'
import { PriorityBadge } from './priority-badge'
import { StatusOS } from '@/lib/prisma'
import {
  Search,
  Filter,
  LayoutGrid,
  List as ListIcon,
  Trash2,
  ChevronDown,
  X,
  Check,
  ArrowRight,
  User,
  UserCheck,
  Eye,
  Calendar,
  Clock,
  Building2,
  FileText,
  Hash,
  Lock,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  ImagePlus,
  Send,
} from 'lucide-react'

interface OsListContainerProps {
  ordens: OrdemServicoDTO[]
  departamentos: DepartamentoDTO[]
  role?: UserRole
  currentUserName?: string
  currentUserDeptId?: string
}

type ViewMode = 'table' | 'grid'

export function OsListContainer({
  ordens,
  departamentos,
  currentUserDeptId,
}: OsListContainerProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('TODOS')
  const [selectedPriority, setSelectedPriority] = useState<string>('TODAS')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('TODOS')
  const [selectedTechnician, setSelectedTechnician] = useState<string>('TODOS')
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [isPending, startTransition] = useTransition()
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [detailOS, setDetailOS] = useState<OrdemServicoDTO | null>(null)
  const [detailData, setDetailData] = useState<DetalhesOSDTO | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [novoComentario, setNovoComentario] = useState('')
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const detailFileRef = useRef<HTMLInputElement>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 9

  // Abre o modal de detalhes e carrega comentários + anexos
  const openDetail = (os: OrdemServicoDTO) => {
    setDetailOS(os)
    setDetailData(null)
    setNovoComentario('')
    setDetailLoading(true)
    startTransition(async () => {
      const d = await obterDetalhesOS(os.id)
      setDetailData(d)
      setDetailLoading(false)
    })
  }
  const closeDetail = () => {
    setDetailOS(null)
    setDetailData(null)
    setNovoComentario('')
  }

  const handleAddComentario = () => {
    if (!detailOS) return
    const t = novoComentario.trim()
    if (!t) return
    startTransition(async () => {
      const res = await adicionarComentario(detailOS.id, t)
      if (res.success && res.data) {
        const c = res.data
        setDetailData((prev) =>
          prev ? { ...prev, comentarios: [...prev.comentarios, c] } : { comentarios: [c], anexos: [] }
        )
        setNovoComentario('')
      }
    })
  }

  const handleRemoverComentario = (id: string) => {
    startTransition(async () => {
      const res = await excluirComentario(id)
      if (res.success) {
        setDetailData((prev) =>
          prev ? { ...prev, comentarios: prev.comentarios.filter((c) => c.id !== id) } : prev
        )
      }
    })
  }

  const handleAddAnexoDetalhe = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (detailFileRef.current) detailFileRef.current.value = ''
    if (!detailOS || files.length === 0) return
    const alvo = detailOS
    setDetailLoading(true)
    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue
        const dados = await comprimirImagem(file)
        const res = await adicionarAnexoOS(alvo.id, dados, file.name)
        if (res.success && res.data) {
          const a = res.data
          setDetailData((prev) =>
            prev ? { ...prev, anexos: [...prev.anexos, a] } : { comentarios: [], anexos: [a] }
          )
        }
      }
    } finally {
      setDetailLoading(false)
    }
  }

  const handleRemoverAnexoDetalhe = (id: string) => {
    startTransition(async () => {
      const res = await excluirAnexoOS(id)
      if (res.success) {
        setDetailData((prev) =>
          prev ? { ...prev, anexos: prev.anexos.filter((a) => a.id !== id) } : prev
        )
      }
    })
  }

  // Lista de responsáveis únicos para filtro
  const uniqueTechnicians = useMemo(() => {
    const map = new Map<string, string>()
    ordens.forEach((os) => {
      if (os.responsavelId && os.responsavel?.nome) {
        map.set(os.responsavelId, os.responsavel.nome)
      }
    })
    return Array.from(map.entries()).map(([id, nome]) => ({ id, nome }))
  }, [ordens])

  // Status counts
  const countsByStatus = useMemo(() => {
    const counts: Record<string, number> = {
      TODOS: ordens.length,
      ABERTA: 0,
      EM_ANDAMENTO: 0,
      AGUARDANDO_RESPOSTA: 0,
      CONCLUIDA: 0,
      CANCELADA: 0,
    }
    ordens.forEach((os) => {
      if (counts[os.status] !== undefined) {
        counts[os.status]++
      }
    })
    return counts
  }, [ordens])

  // Filtragem dos chamados
  const filteredOrders = useMemo(() => {
    return ordens.filter((os) => {
      // 1. Busca textual
      const matchesSearch =
        os.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        os.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        os.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        os.solicitante.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (os.responsavel?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        os.departamentoOrigem.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        os.departamentoDestino.nome.toLowerCase().includes(searchTerm.toLowerCase())

      // 2. Status
      const matchesStatus = selectedStatus === 'TODOS' || os.status === selectedStatus

      // 3. Prioridade
      const matchesPriority = selectedPriority === 'TODAS' || os.prioridade === selectedPriority

      // 4. Departamento
      const matchesDepartment =
        selectedDepartment === 'TODOS' ||
        os.departamentoOrigemId === selectedDepartment ||
        os.departamentoDestinoId === selectedDepartment

      // 5. Responsável Técnico
      const matchesTech =
        selectedTechnician === 'TODOS' ||
        (selectedTechnician === 'SEM_RESPONSAVEL' ? !os.responsavelId : os.responsavelId === selectedTechnician)

      return matchesSearch && matchesStatus && matchesPriority && matchesDepartment && matchesTech
    })
  }, [ordens, searchTerm, selectedStatus, selectedPriority, selectedDepartment, selectedTechnician])

  // Paginação da listagem
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedOrders = useMemo(() => {
    const start = (safePage - 1) * itemsPerPage
    return filteredOrders.slice(start, start + itemsPerPage)
  }, [filteredOrders, safePage])

  // Volta para a primeira página sempre que os filtros mudam
  // (padrão do React de ajustar estado durante o render, sem useEffect)
  const filterKey = `${searchTerm}|${selectedStatus}|${selectedPriority}|${selectedDepartment}|${selectedTechnician}`
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey)
    setCurrentPage(1)
  }

  const handleStatusChange = (id: string, newStatus: StatusOS) => {
    startTransition(async () => {
      await atualizarStatusOS(id, newStatus)
    })
  }

  // Regras de edição de status da OS:
  // - OS concluída trava o status para todos.
  // - Apenas o setor de destino (para quem a OS foi direcionada) pode alterar; o dono/solicitante não.
  const getStatusEditInfo = (os: OrdemServicoDTO) => {
    if (os.status === 'CONCLUIDA') {
      return { canEdit: false, reason: 'OS concluída: o status não pode mais ser alterado.' }
    }
    const isDestino = !!currentUserDeptId && currentUserDeptId === os.departamentoDestinoId
    if (!isDestino) {
      return {
        canEdit: false,
        reason: 'Somente o setor de destino pode alterar o status desta OS.',
      }
    }
    return { canEdit: true, reason: 'Alterar status da OS' }
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await excluirOrdemServico(id)
      setDeleteConfirmId(null)
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

  // Duração entre abertura e conclusão/atualização, em formato amigável
  const formatDuration = (inicioIso: string, fimIso: string) => {
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

  return (
    <div className="space-y-5">
      {/* ========================================================================= */}
      {/* BARRA DE FERRAMENTAS & CONTROLES */}
      {/* ========================================================================= */}
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/90 dark:border-zinc-800/90 rounded-3xl p-5 shadow-xs space-y-4">
        {/* Linha 1: Busca e Filtros Dropdown */}
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Busca Textual */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar por código, título, solicitante, responsável, departamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl pl-11 pr-4 py-2.5 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filtros em Linha */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filtro Setores */}
            <div className="relative flex-1 sm:flex-initial min-w-[140px]">
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full appearance-none bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl pl-3.5 pr-9 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all cursor-pointer"
              >
                <option value="TODOS">Setores: Todos</option>
                {departamentos.map((dep) => (
                  <option key={`filter-${dep.id}`} value={dep.id}>
                    {dep.nome}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
            </div>

            {/* Filtro Responsável Técnico */}
            {uniqueTechnicians.length > 0 && (
              <div className="relative flex-1 sm:flex-initial min-w-[150px]">
                <select
                  value={selectedTechnician}
                  onChange={(e) => setSelectedTechnician(e.target.value)}
                  className="w-full appearance-none bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl pl-3.5 pr-9 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all cursor-pointer"
                >
                  <option value="TODOS">Técnico: Todos</option>
                  <option value="SEM_RESPONSAVEL">Fila Geral (Sem Resp.)</option>
                  {uniqueTechnicians.map((tec) => (
                    <option key={`filter-tec-${tec.id}`} value={tec.id}>
                      👤 {tec.nome}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
              </div>
            )}

            {/* Filtro Prioridade */}
            <div className="relative flex-1 sm:flex-initial min-w-[140px]">
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full appearance-none bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl pl-3.5 pr-9 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all cursor-pointer"
              >
                <option value="TODAS">Prioridade: Todas</option>
                <option value="BAIXA">🟢 Baixa</option>
                <option value="MEDIA">🟡 Média</option>
                <option value="ALTA">🟠 Alta</option>
                <option value="URGENTE">🔴 Urgente</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
            </div>

            {/* Alternador de Visualização (Tabela vs Grid) */}
            <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-zinc-700 text-orange-600 dark:text-orange-400 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
                title="Visualização em Tabela"
              >
                <ListIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tabela</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-zinc-700 text-orange-600 dark:text-orange-400 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
                title="Visualização em Cards"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </button>
            </div>
          </div>
        </div>

        {/* Linha 2: Filtro Rápido por Status em Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {Object.keys(countsByStatus).map((statusKey) => {
            const isSelected = selectedStatus === statusKey
            const count = countsByStatus[statusKey]
            const label =
              statusKey === 'TODOS'
                ? 'Todos'
                : STATUS_CONFIG[statusKey as StatusOS]?.label || statusKey

            return (
              <button
                key={`pill-${statusKey}`}
                type="button"
                onClick={() => setSelectedStatus(statusKey)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-orange-500 text-white shadow-xs shadow-orange-500/30'
                    : 'bg-zinc-100/80 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white border border-zinc-200/60 dark:border-zinc-700/60'
                }`}
              >
                <span>{label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LISTAGEM DE CHAMADOS (TABELA / CARDS) */}
      {/* ========================================================================= */}
      {filteredOrders.length === 0 ? (
        <div className="py-20 px-4 text-center bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl rounded-3xl border border-zinc-200 dark:border-zinc-800">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 dark:bg-orange-950/80 text-orange-500 flex items-center justify-center mx-auto mb-3 shadow-xs">
            <Filter className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200">
            Nenhuma ordem de serviço encontrada
          </h3>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mt-1">
            Não há solicitações correspondentes aos filtros selecionados. Tente ajustar os termos de busca ou filtros.
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* VISUALIZAÇÃO EM TABELA */
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 bg-zinc-50/50 dark:bg-zinc-900/50">
                  <th className="py-4 px-5">Código / Título</th>
                  <th className="py-4 px-4">Fluxo de Setores</th>
                  <th className="py-4 px-4">Solicitante</th>
                  <th className="py-4 px-4">Responsável Técnico</th>
                  <th className="py-4 px-4">Prioridade</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Data Abertura</th>
                  <th className="py-4 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60 text-xs sm:text-sm">
                {paginatedOrders.map((os) => {
                  const statusEdit = getStatusEditInfo(os)
                  return (
                    <tr
                      key={os.id}
                      className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors group"
                    >
                      {/* Código e Título */}
                      <td className="py-4 px-5">
                        <div className="space-y-1">
                          <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-orange-50 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60">
                            {os.codigo}
                          </span>
                          <h4 className="font-bold text-zinc-900 dark:text-white leading-snug">
                            {os.titulo}
                          </h4>
                          <p className="text-xs text-zinc-400 line-clamp-1 max-w-xs">
                            {os.descricao}
                          </p>
                        </div>
                      </td>

                      {/* Fluxo de Setores [Origem -> Destino] */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                          <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                            {os.departamentoOrigem.nome}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                          <span className="px-2 py-0.5 rounded bg-orange-50 dark:bg-orange-950/80 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                            {os.departamentoDestino.nome}
                          </span>
                        </div>
                      </td>

                      {/* Solicitante */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-zinc-400" />
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                            {os.solicitante.nome}
                          </span>
                        </div>
                      </td>

                      {/* Responsável Técnico */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {os.responsavel ? (
                          <div className="flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-orange-500" />
                            <span className="font-semibold text-orange-600 dark:text-orange-400">
                              {os.responsavel.nome}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-400 italic">
                            Fila Geral do Setor
                          </span>
                        )}
                      </td>

                      {/* Prioridade */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <PriorityBadge prioridade={os.prioridade} />
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="relative inline-block" title={statusEdit.reason}>
                          <select
                            value={os.status}
                            onChange={(e) => handleStatusChange(os.id, e.target.value as StatusOS)}
                            disabled={isPending || !statusEdit.canEdit}
                            className={`appearance-none font-bold text-xs rounded-xl px-3 py-1.5 pr-7 border transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/30 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 ${
                              statusEdit.canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'
                            }`}
                          >
                            <option value="ABERTA">Aberta</option>
                            <option value="EM_ANDAMENTO">Em Andamento</option>
                            <option value="AGUARDANDO_RESPOSTA">Aguardando Resposta</option>
                            <option value="CONCLUIDA">Concluída</option>
                            <option value="CANCELADA">Cancelada</option>
                          </select>
                          {statusEdit.canEdit ? (
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
                          ) : (
                            <Lock className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-400 pointer-events-none" />
                          )}
                        </div>
                      </td>

                      {/* Data de Abertura */}
                      <td className="py-4 px-4 whitespace-nowrap text-xs text-zinc-500 dark:text-zinc-400">
                        {formatDate(os.criadoEm)}
                      </td>

                      {/* Ações */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        {deleteConfirmId === os.id ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleDelete(os.id)}
                              disabled={isPending}
                              className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-500 text-xs font-bold cursor-pointer"
                              title="Confirmar exclusão"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              className="p-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold cursor-pointer"
                              title="Cancelar"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openDetail(os)}
                              className="p-2 rounded-xl text-zinc-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/40 transition-colors cursor-pointer"
                              title="Ver Detalhes"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {/* Excluir: indisponível para OS concluídas (preserva histórico e relatórios) */}
                            {os.status !== 'CONCLUIDA' && (
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(os.id)}
                                className="p-2 rounded-xl text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                title="Excluir Chamado"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* VISUALIZAÇÃO EM CARDS / GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedOrders.map((os) => {
            const statusEdit = getStatusEditInfo(os)
            return (
            <div
              key={`card-${os.id}`}
              onClick={() => openDetail(os)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  openDetail(os)
                }
              }}
              className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 p-5 flex flex-col justify-between space-y-4 shadow-xs hover:shadow-lg hover:border-orange-300 dark:hover:border-orange-500/50 transition-all duration-200 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/40"
            >
              {/* Header do Card */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                    {os.codigo}
                  </span>
                  <PriorityBadge prioridade={os.prioridade} />
                </div>
                <h4 className="font-bold text-base text-zinc-900 dark:text-white leading-snug">
                  {os.titulo}
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-3">
                  {os.descricao}
                </p>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-500 dark:text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Eye className="w-3 h-3" /> Clique para ver detalhes
                </span>
              </div>

              {/* Fluxo de Setores */}
              <div className="p-3 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-semibold">Origem:</span>
                  <span className="font-bold text-zinc-700 dark:text-zinc-300">
                    {os.departamentoOrigem.nome}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-semibold">Destino:</span>
                  <span className="font-bold text-orange-600 dark:text-orange-400">
                    {os.departamentoDestino.nome}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-200/60 dark:border-zinc-700/60">
                  <span className="text-zinc-400 font-semibold">Responsável:</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">
                    {os.responsavel ? os.responsavel.nome : 'Fila Geral'}
                  </span>
                </div>
              </div>

              {/* Footer do Card com Status e Ações */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div className="relative" onClick={(e) => e.stopPropagation()} title={statusEdit.reason}>
                  <select
                    value={os.status}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleStatusChange(os.id, e.target.value as StatusOS)}
                    disabled={isPending || !statusEdit.canEdit}
                    className={`appearance-none font-bold text-xs rounded-xl px-3 py-1.5 pr-7 border transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/30 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 ${
                      statusEdit.canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'
                    }`}
                  >
                    <option value="ABERTA">Aberta</option>
                    <option value="EM_ANDAMENTO">Em Andamento</option>
                    <option value="AGUARDANDO_RESPOSTA">Aguardando Resposta</option>
                    <option value="CONCLUIDA">Concluída</option>
                    <option value="CANCELADA">Cancelada</option>
                  </select>
                  {statusEdit.canEdit ? (
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
                  ) : (
                    <Lock className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-400 pointer-events-none" />
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-zinc-400" onClick={(e) => e.stopPropagation()}>
                  <span>{formatDate(os.criadoEm)}</span>
                  {/* Excluir: indisponível para OS concluídas (preserva histórico e relatórios) */}
                  {os.status !== 'CONCLUIDA' &&
                    (deleteConfirmId === os.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDelete(os.id)}
                          disabled={isPending}
                          className="p-1 rounded bg-rose-600 text-white hover:bg-rose-500 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                          className="p-1 rounded bg-zinc-200 dark:bg-zinc-700 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(os.id)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ))}
                </div>
              </div>
            </div>
            )
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* PAGINAÇÃO */}
      {/* ========================================================================= */}
      {filteredOrders.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 text-xs text-zinc-500 dark:text-zinc-400">
          <span>
            Mostrando <strong>{paginatedOrders.length}</strong> de <strong>{filteredOrders.length}</strong> ordens de serviço
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              title="Página anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-zinc-700 dark:text-zinc-300 px-2">
              Página {safePage} de {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              title="Próxima página"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE DETALHES DA OS */}
      {/* ========================================================================= */}
      {detailOS && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm"
          onClick={() => closeDetail()}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header do Modal */}
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 p-6 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                    <Hash className="w-3 h-3" />
                    {detailOS.codigo}
                  </span>
                  <StatusBadge status={detailOS.status} />
                  <PriorityBadge prioridade={detailOS.prioridade} />
                </div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white leading-snug pr-4">
                  {detailOS.titulo}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => closeDetail()}
                className="shrink-0 p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corpo do Modal */}
            <div className="p-6 space-y-6">
              {/* Descrição completa */}
              <div className="space-y-2">
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  <FileText className="w-3.5 h-3.5" /> Descrição do Chamado
                </span>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-700/60 rounded-2xl p-4">
                  {detailOS.descricao}
                </p>
              </div>

              {/* Fluxo de Setores */}
              <div className="space-y-2">
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  <Building2 className="w-3.5 h-3.5" /> Fluxo Interdepartamental
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1.5 rounded-xl text-sm font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                    {detailOS.departamentoOrigem.nome}
                  </span>
                  <ArrowRight className="w-4 h-4 text-orange-500 shrink-0" />
                  <span className="px-3 py-1.5 rounded-xl text-sm font-bold bg-orange-50 dark:bg-orange-950/80 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                    {detailOS.departamentoDestino.nome}
                  </span>
                </div>
              </div>

              {/* Pessoas envolvidas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60 space-y-1">
                  <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    <User className="w-3.5 h-3.5" /> Solicitante
                  </span>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">{detailOS.solicitante.nome}</p>
                  <p className="text-xs text-zinc-400">{detailOS.solicitante.email}</p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60 space-y-1">
                  <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    <UserCheck className="w-3.5 h-3.5 text-orange-500" /> Responsável Técnico
                  </span>
                  {detailOS.responsavel ? (
                    <>
                      <p className="text-sm font-bold text-orange-600 dark:text-orange-400">{detailOS.responsavel.nome}</p>
                      <p className="text-xs text-zinc-400">{detailOS.responsavel.email}</p>
                    </>
                  ) : (
                    <p className="text-sm font-semibold text-zinc-400 italic">Fila Geral do Setor (sem atribuição)</p>
                  )}
                </div>
              </div>

              {/* Datas e tempo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60 space-y-1">
                  <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    <Calendar className="w-3.5 h-3.5" /> Data de Abertura
                  </span>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">{formatDate(detailOS.criadoEm)}</p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60 space-y-1">
                  <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    <Clock className="w-3.5 h-3.5" />
                    {detailOS.status === 'CONCLUIDA' ? 'Tempo de Resolução' : 'Última Atualização'}
                  </span>
                  {detailOS.status === 'CONCLUIDA' ? (
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {formatDuration(detailOS.criadoEm, detailOS.atualizadoEm)}
                      <span className="text-xs font-normal text-zinc-400"> (em {formatDate(detailOS.atualizadoEm)})</span>
                    </p>
                  ) : (
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">{formatDate(detailOS.atualizadoEm)}</p>
                  )}
                </div>
              </div>

              {/* Anexos / Prints */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    <ImagePlus className="w-3.5 h-3.5" /> Anexos / Prints
                  </span>
                  <button
                    type="button"
                    onClick={() => detailFileRef.current?.click()}
                    disabled={isPending || detailLoading}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-950 transition-colors cursor-pointer disabled:opacity-60"
                  >
                    <ImagePlus className="w-3.5 h-3.5" /> Adicionar
                  </button>
                  <input
                    ref={detailFileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleAddAnexoDetalhe}
                    className="hidden"
                  />
                </div>
                {detailLoading && !detailData ? (
                  <p className="text-xs text-zinc-400">Carregando anexos...</p>
                ) : detailData && detailData.anexos.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {detailData.anexos.map((a) => (
                      <div key={a.id} className="relative group">
                        <button
                          type="button"
                          onClick={() => setLightboxSrc(a.dados)}
                          className="block cursor-zoom-in"
                          title="Ampliar imagem"
                        >
                          <Image
                            src={a.dados}
                            alt={a.nome || 'anexo'}
                            width={96}
                            height={96}
                            unoptimized
                            className="rounded-xl object-cover border border-zinc-200 dark:border-zinc-700"
                            style={{ width: 96, height: 96 }}
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoverAnexoDetalhe(a.id)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-sm hover:bg-rose-500 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remover imagem"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 italic">Nenhuma imagem anexada.</p>
                )}
              </div>

              {/* Comentários */}
              <div className="space-y-3">
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  <MessageSquare className="w-3.5 h-3.5" /> Comentários
                  {detailData && detailData.comentarios.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-black">
                      {detailData.comentarios.length}
                    </span>
                  )}
                </span>

                {detailLoading && !detailData ? (
                  <p className="text-xs text-zinc-400">Carregando comentários...</p>
                ) : detailData && detailData.comentarios.length > 0 ? (
                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {detailData.comentarios.map((c) => (
                      <div
                        key={c.id}
                        className="p-3 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-zinc-900 dark:text-white">{c.autor.nome}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-zinc-400">{formatDate(c.criadoEm)}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoverComentario(c.id)}
                              className="text-zinc-300 dark:text-zinc-600 hover:text-rose-500 dark:hover:text-rose-400 cursor-pointer"
                              title="Excluir comentário"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-1 whitespace-pre-wrap">{c.texto}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 italic">Nenhum comentário ainda. Seja o primeiro a comentar.</p>
                )}

                {/* Adicionar comentário */}
                <div className="flex items-end gap-2">
                  <textarea
                    value={novoComentario}
                    onChange={(e) => setNovoComentario(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault()
                        handleAddComentario()
                      }
                    }}
                    rows={2}
                    placeholder="Escreva um comentário... (Ctrl+Enter para enviar)"
                    className="flex-1 bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl px-3.5 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all resize-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddComentario}
                    disabled={isPending || !novoComentario.trim()}
                    className="inline-flex items-center justify-center px-4 py-2.5 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold shadow-md shadow-orange-600/20 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                    title="Enviar comentário"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LIGHTBOX DE IMAGEM (ampliar anexo sem abrir nova aba) */}
      {/* ========================================================================= */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-sm"
          onClick={() => setLightboxSrc(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxSrc(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
          <Image
            src={lightboxSrc}
            alt="Anexo ampliado"
            width={1600}
            height={1200}
            unoptimized
            onClick={(e) => e.stopPropagation()}
            className="rounded-xl shadow-2xl"
            style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '90vh' }}
          />
        </div>
      )}
    </div>
  )
}
