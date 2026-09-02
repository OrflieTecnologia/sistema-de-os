'use client'

import { useState, useTransition, useRef, useMemo } from 'react'
import {
  DepartamentoDTO,
  UsuarioAdminDTO,
  criarDepartamento,
  alternarStatusDepartamento,
  alternarRoleUsuario,
  alterarSetorUsuario,
} from '@/app/actions'
import {
  Building2,
  PlusCircle,
  Loader2,
  CheckCircle,
  AlertCircle,
  Check,
  Layers,
  Users,
  Shield,
  ShieldAlert,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  UserCheck,
  Filter,
  ChevronDown,
} from 'lucide-react'

interface DepartamentosManagerProps {
  departamentos: DepartamentoDTO[]
  usuarios: UsuarioAdminDTO[]
  currentUserId: string
}

export function DepartamentosManager({
  departamentos,
  usuarios,
  currentUserId,
}: DepartamentosManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  )
  const formRef = useRef<HTMLFormElement>(null)

  // ----------------------------------------------------
  // Estados para Gestão de Usuários
  // ----------------------------------------------------
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState<'TODOS' | 'ADMIN' | 'MEMBRO'>('TODOS')
  const [userDepFilter, setUserDepFilter] = useState<string>('TODOS')
  const [userPage, setUserPage] = useState(1)
  const usersPerPage = 6

  // ----------------------------------------------------
  // Estados para Gestão de Departamentos
  // ----------------------------------------------------
  const [depSearchTerm, setDepSearchTerm] = useState('')
  const [depStatusFilter, setDepStatusFilter] = useState<'TODOS' | 'ATIVOS' | 'DESATIVADOS'>('TODOS')
  const [depPage, setDepPage] = useState(1)
  const depsPerPage = 6

  // Iniciais do nome
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ')
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  // ----------------------------------------------------
  // Métricas do Topo
  // ----------------------------------------------------
  const ativosCount = departamentos.filter((d) => d.ativo).length
  const totalDemandas = departamentos.reduce((acc, d) => acc + (d.totalDestino || 0), 0)
  const totalAdmins = usuarios.filter((u) => u.role === 'ADMIN').length
  const totalMembros = usuarios.filter((u) => u.role === 'MEMBRO').length

  // ----------------------------------------------------
  // Ações de Departamentos
  // ----------------------------------------------------
  async function handleCreate(formData: FormData) {
    setFeedback(null)
    startTransition(async () => {
      const res = await criarDepartamento(formData)
      if (res.success) {
        setFeedback({ type: 'success', message: res.message || 'Departamento cadastrado com sucesso!' })
        formRef.current?.reset()
        setTimeout(() => setFeedback(null), 3000)
      } else {
        setFeedback({ type: 'error', message: res.message || 'Erro ao cadastrar departamento.' })
      }
    })
  }

  const handleToggleStatus = (id: string, currentStatus: boolean) => {
    startTransition(async () => {
      const res = await alternarStatusDepartamento(id, !currentStatus)
      if (res.success) {
        setFeedback({ type: 'success', message: res.message || 'Status do departamento alterado com sucesso!' })
        setTimeout(() => setFeedback(null), 3000)
      } else {
        setFeedback({ type: 'error', message: res.message || 'Erro ao alterar status.' })
      }
    })
  }

  // ----------------------------------------------------
  // Ações de Usuários (RBAC)
  // ----------------------------------------------------
  const handleRoleChange = (usuarioId: string, newRole: 'ADMIN' | 'MEMBRO') => {
    startTransition(async () => {
      const res = await alternarRoleUsuario(usuarioId, newRole)
      if (res.success) {
        setFeedback({ type: 'success', message: res.message || 'Papel do usuário atualizado!' })
        setTimeout(() => setFeedback(null), 3500)
      } else {
        setFeedback({ type: 'error', message: res.message || 'Erro ao alterar permissão.' })
      }
    })
  }

  const handleDepChange = (usuarioId: string, newDepId: string, currentDepId: string) => {
    if (!newDepId || newDepId === currentDepId) return
    startTransition(async () => {
      const res = await alterarSetorUsuario(usuarioId, newDepId)
      if (res.success) {
        setFeedback({ type: 'success', message: res.message || 'Setor do colaborador atualizado!' })
        setTimeout(() => setFeedback(null), 3500)
      } else {
        setFeedback({ type: 'error', message: res.message || 'Erro ao alterar o setor.' })
      }
    })
  }

  // ----------------------------------------------------
  // Filtros e Paginação de Usuários
  // ----------------------------------------------------
  const filteredUsers = useMemo(() => {
    return usuarios.filter((user) => {
      const matchesSearch =
        user.nome.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.departamento.nome.toLowerCase().includes(userSearchTerm.toLowerCase())

      const matchesRole = userRoleFilter === 'TODOS' || user.role === userRoleFilter
      const matchesDep = userDepFilter === 'TODOS' || user.departamentoId === userDepFilter

      return matchesSearch && matchesRole && matchesDep
    })
  }, [usuarios, userSearchTerm, userRoleFilter, userDepFilter])

  const totalUserPages = Math.ceil(filteredUsers.length / usersPerPage) || 1
  const paginatedUsers = useMemo(() => {
    const start = (userPage - 1) * usersPerPage
    return filteredUsers.slice(start, start + usersPerPage)
  }, [filteredUsers, userPage, usersPerPage])

  // ----------------------------------------------------
  // Filtros e Paginação de Departamentos
  // ----------------------------------------------------
  const filteredDepartments = useMemo(() => {
    return departamentos.filter((dep) => {
      const matchesSearch = dep.nome.toLowerCase().includes(depSearchTerm.toLowerCase())
      const matchesStatus =
        depStatusFilter === 'TODOS' ||
        (depStatusFilter === 'ATIVOS' && dep.ativo) ||
        (depStatusFilter === 'DESATIVADOS' && !dep.ativo)

      return matchesSearch && matchesStatus
    })
  }, [departamentos, depSearchTerm, depStatusFilter])

  const totalDepPages = Math.ceil(filteredDepartments.length / depsPerPage) || 1
  const paginatedDeps = useMemo(() => {
    const start = (depPage - 1) * depsPerPage
    return filteredDepartments.slice(start, start + depsPerPage)
  }, [filteredDepartments, depPage, depsPerPage])

  return (
    <div className="space-y-8">
      {/* ========================================================================= */}
      {/* 1. TOP METRICS DO PAINEL DE ADMINISTRAÇÃO */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Setores Totais */}
        <div className="bg-white dark:bg-zinc-900/90 rounded-2xl border border-zinc-200 dark:border-zinc-800/90 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Total de Setores
            </span>
            <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <Building2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">
              {departamentos.length}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">departamentos</span>
          </div>
        </div>

        {/* Setores Ativos */}
        <div className="bg-white dark:bg-zinc-900/90 rounded-2xl border border-zinc-200 dark:border-zinc-800/90 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Setores Ativos
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Check className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {ativosCount}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">aptos a receber chamados</span>
          </div>
        </div>

        {/* Total de Usuários / Admins vs Membros */}
        <div className="bg-white dark:bg-zinc-900/90 rounded-2xl border border-zinc-200 dark:border-zinc-800/90 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Colaboradores
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Users className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">
              {usuarios.length}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              ({totalAdmins} admins / {totalMembros} membros)
            </span>
          </div>
        </div>

        {/* Volume Interdepartamental */}
        <div className="bg-white dark:bg-zinc-900/90 rounded-2xl border border-zinc-200 dark:border-zinc-800/90 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Volume de Chamados
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Layers className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">
              {totalDemandas}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">ordens registradas</span>
          </div>
        </div>
      </div>

      {/* Feedback Alert Global */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-semibold animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/70 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ÁREA DE GESTÃO DE USUÁRIOS E PERMISSÕES (RBAC: ADMIN VS MEMBRO) */}
      {/* ========================================================================= */}
      <div className="bg-white/90 dark:bg-zinc-900/90 rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-xs overflow-hidden space-y-4 p-6">
        {/* Header da Seção de Usuários */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-black text-zinc-900 dark:text-white">
                Controle de Usuários & Acessos (RBAC)
              </h3>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Gerencie permissões de acesso do sistema, alternando entre Administrador e Membro Comum
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800 self-start sm:self-auto">
            {usuarios.length} usuários cadastrados
          </span>
        </div>

        {/* Barra de Filtros e Busca de Usuários */}
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Busca Textual */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar usuário por nome, e-mail ou departamento..."
              value={userSearchTerm}
              onChange={(e) => {
                setUserSearchTerm(e.target.value)
                setUserPage(1)
              }}
              className="w-full bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl pl-10 pr-9 py-2 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
            />
            {userSearchTerm && (
              <button
                type="button"
                onClick={() => {
                  setUserSearchTerm('')
                  setUserPage(1)
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filtros em Linha: Papel e Setor */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filtro por Papel */}
            <select
              value={userRoleFilter}
              onChange={(e) => {
                setUserRoleFilter(e.target.value as 'TODOS' | 'ADMIN' | 'MEMBRO')
                setUserPage(1)
              }}
              className="bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl px-3.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all cursor-pointer"
            >
              <option value="TODOS">Papel: Todos</option>
              <option value="ADMIN">🛡️ Apenas Administradores (ADMIN)</option>
              <option value="MEMBRO">👤 Apenas Membros (MEMBRO)</option>
            </select>

            {/* Filtro por Departamento */}
            <select
              value={userDepFilter}
              onChange={(e) => {
                setUserDepFilter(e.target.value)
                setUserPage(1)
              }}
              className="bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl px-3.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all cursor-pointer"
            >
              <option value="TODOS">Setor: Todos</option>
              {departamentos.map((d) => (
                <option key={`user-filter-dep-${d.id}`} value={d.id}>
                  {d.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabela de Usuários com Barra de Rolagem */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto max-h-[440px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead className="sticky top-0 z-10 bg-zinc-100/95 dark:bg-zinc-800/95 backdrop-blur-md">
                <tr className="border-b border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 uppercase text-[11px] font-bold tracking-wider">
                  <th className="py-3.5 px-5">Colaborador</th>
                  <th className="py-3.5 px-4">Setor / Departamento</th>
                  <th className="py-3.5 px-4 text-center">Papel Atual</th>
                  <th className="py-3.5 px-6 text-right">Alterar Acesso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60 bg-white/50 dark:bg-zinc-900/50">
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-zinc-400">
                      <Filter className="w-8 h-8 mx-auto mb-2 text-zinc-300 dark:text-zinc-600" />
                      Nenhum colaborador encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => {
                    const isSelf = user.id === currentUserId
                    const isAdmin = user.role === 'ADMIN'

                    return (
                      <tr
                        key={user.id}
                        className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                      >
                        {/* Colaborador (Avatar + Nome + Email) */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-xs border ${
                                isAdmin
                                  ? 'bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-800'
                                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700'
                              }`}
                            >
                              {getInitials(user.nome)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 font-bold text-zinc-900 dark:text-white">
                                <span>{user.nome}</span>
                                {isSelf && (
                                  <span className="text-[10px] font-extrabold px-2 py-0.2 rounded-md bg-orange-50 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                                    Você
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-zinc-400 font-normal">
                                {user.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Setor (editável) */}
                        <td className="py-4 px-4">
                          <div className="relative inline-block">
                            <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
                            <select
                              value={user.departamentoId}
                              onChange={(e) => handleDepChange(user.id, e.target.value, user.departamentoId)}
                              disabled={isPending}
                              title="Alterar setor do colaborador"
                              className="appearance-none pl-8 pr-8 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:border-orange-400 dark:hover:border-orange-500/60 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {departamentos.map((d) => (
                                <option key={`user-${user.id}-dep-${d.id}`} value={d.id}>
                                  {d.nome}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
                          </div>
                        </td>

                        {/* Papel Atual Badge */}
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                              isAdmin
                                ? 'bg-orange-50 dark:bg-orange-950/80 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                            }`}
                          >
                            {isAdmin ? (
                              <>
                                <Shield className="w-3.5 h-3.5 text-orange-500" />
                                ADMIN
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3.5 h-3.5 text-zinc-400" />
                                MEMBRO
                              </>
                            )}
                          </span>
                        </td>

                        {/* Ação de Troca de Papel */}
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleRoleChange(user.id, isAdmin ? 'MEMBRO' : 'ADMIN')}
                            disabled={isPending}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs border ${
                              isAdmin
                                ? 'bg-zinc-100 dark:bg-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-zinc-700 dark:text-zinc-300 hover:text-rose-600 dark:hover:text-rose-400 border-zinc-300 dark:border-zinc-700 hover:border-rose-300'
                                : 'bg-orange-50 dark:bg-orange-950/80 hover:bg-orange-600 text-orange-700 dark:text-orange-400 hover:text-white border-orange-200 dark:border-orange-800 hover:border-orange-600'
                            }`}
                            title={
                              isAdmin
                                ? 'Rebaixar para Membro Comum'
                                : 'Promover a Administrador Geral'
                            }
                          >
                            {isAdmin ? (
                              <>
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Tornar Membro</span>
                              </>
                            ) : (
                              <>
                                <Shield className="w-3.5 h-3.5" />
                                <span>Tornar Admin</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Paginação de Usuários */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span>
            Mostrando <strong>{paginatedUsers.length}</strong> de <strong>{filteredUsers.length}</strong> usuários
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setUserPage((p) => Math.max(1, p - 1))}
              disabled={userPage <= 1}
              className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-zinc-700 dark:text-zinc-300 px-2">
              Página {userPage} de {totalUserPages}
            </span>
            <button
              type="button"
              onClick={() => setUserPage((p) => Math.min(totalUserPages, p + 1))}
              disabled={userPage >= totalUserPages}
              className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. ÁREA DE GESTÃO DE DEPARTAMENTOS (CADASTRO + LISTAGEM COM BUSCA/PAGINAÇÃO) */}
      {/* ========================================================================= */}
      <div className="space-y-6">
        {/* Card de Cadastro Rápido de Setor */}
        <div className="bg-white/90 dark:bg-zinc-900/90 rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 p-5 sm:p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-orange-500" />
              Cadastrar Novo Departamento
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Adicione novos setores corporativos da empresa para direcionamento e abertura de chamados
            </p>
          </div>

          <form ref={formRef} action={handleCreate} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              name="nome"
              required
              placeholder="Nome do Departamento (Ex: Jurídico, Logística, Atendimento...)"
              className="flex-1 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
            />
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-orange-600/20 hover:shadow-orange-600/30 active:scale-98 transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>Salvar Setor</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Tabela de Gestão de Departamentos com Busca e Paginação */}
        <div className="bg-white/90 dark:bg-zinc-900/90 rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-xs overflow-hidden p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-orange-500" />
                Setores Cadastrados
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Controle de status e volumetria de ordens de serviço por departamento
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 self-start sm:self-auto">
              {departamentos.length} departamentos
            </span>
          </div>

          {/* Busca e Filtro de Departamentos */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar setor por nome..."
                value={depSearchTerm}
                onChange={(e) => {
                  setDepSearchTerm(e.target.value)
                  setDepPage(1)
                }}
                className="w-full bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl pl-10 pr-9 py-2 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
              />
              {depSearchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setDepSearchTerm('')
                    setDepPage(1)
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <select
              value={depStatusFilter}
              onChange={(e) => {
                setDepStatusFilter(e.target.value as 'TODOS' | 'ATIVOS' | 'DESATIVADOS')
                setDepPage(1)
              }}
              className="bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl px-3.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all cursor-pointer"
            >
              <option value="TODOS">Status: Todos</option>
              <option value="ATIVOS">🟢 Apenas Ativos</option>
              <option value="DESATIVADOS">⚪ Apenas Desativados</option>
            </select>
          </div>

          {/* Tabela com Scroll Suave */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="overflow-x-auto max-h-[440px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead className="sticky top-0 z-10 bg-zinc-100/95 dark:bg-zinc-800/95 backdrop-blur-md">
                  <tr className="border-b border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 uppercase text-[11px] font-bold tracking-wider">
                    <th className="py-3.5 px-6">Departamento</th>
                    <th className="py-3.5 px-4 text-center">Chamados Recebidos (Destino)</th>
                    <th className="py-3.5 px-4 text-center">Chamados Solicitados (Origem)</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-6 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60 bg-white/50 dark:bg-zinc-900/50">
                  {paginatedDeps.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-zinc-400">
                        Nenhum departamento encontrado.
                      </td>
                    </tr>
                  ) : (
                    paginatedDeps.map((dep) => (
                      <tr
                        key={dep.id}
                        className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/60 border border-orange-200/60 dark:border-orange-800/60 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-xs">
                              {dep.nome.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="font-semibold text-zinc-900 dark:text-white text-sm">
                              {dep.nome}
                            </span>
                          </div>
                        </td>

                        <td className="py-4 px-4 text-center">
                          <span className="inline-flex items-center gap-1 font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/80 px-2.5 py-0.5 rounded-full border border-orange-200 dark:border-orange-800/80 text-xs">
                            {dep.totalDestino || 0} demandas
                          </span>
                        </td>

                        <td className="py-4 px-4 text-center">
                          <span className="inline-flex items-center gap-1 font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-full text-xs">
                            {dep.totalOrigem || 0} abertas
                          </span>
                        </td>

                        <td className="py-4 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                              dep.ativo
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                            }`}
                          >
                            {dep.ativo ? (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Ativo
                              </>
                            ) : (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                                Desativado
                              </>
                            )}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-right">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(dep.id, dep.ativo)}
                            disabled={isPending}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                              dep.ativo
                                ? 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 hover:border-rose-300'
                                : 'border-orange-500 bg-orange-50 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400 hover:bg-orange-100'
                            }`}
                          >
                            {dep.ativo ? 'Desativar' : 'Reativar'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginação de Departamentos */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span>
              Mostrando <strong>{paginatedDeps.length}</strong> de <strong>{filteredDepartments.length}</strong> departamentos
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDepPage((p) => Math.max(1, p - 1))}
                disabled={depPage <= 1}
                className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-zinc-700 dark:text-zinc-300 px-2">
                Página {depPage} de {totalDepPages}
              </span>
              <button
                type="button"
                onClick={() => setDepPage((p) => Math.min(totalDepPages, p + 1))}
                disabled={depPage >= totalDepPages}
                className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
