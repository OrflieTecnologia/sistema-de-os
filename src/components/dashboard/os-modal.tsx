'use client'

import { useState, useTransition, useEffect, useRef, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { criarOrdemServico, listarUsuariosPorDepartamento, DepartamentoDTO, UsuarioDTO } from '@/app/actions'
import { SessionUser } from '@/lib/auth'
import { comprimirImagem } from '@/lib/image-utils'
import { X, PlusCircle, Loader2, CheckCircle, AlertCircle, Building2, User, UserCheck, ImagePlus, Trash2 } from 'lucide-react'

const MAX_ANEXOS = 6

interface OsModalProps {
  isOpen: boolean
  onClose: () => void
  departamentos: DepartamentoDTO[]
  currentUser: SessionUser
}

export function OsModal({
  isOpen,
  onClose,
  departamentos,
  currentUser,
}: OsModalProps) {
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  )

  // Filtra para NÃO exibir o próprio departamento do solicitante como destino
  const departamentosDestino = useMemo(() => {
    return departamentos.filter((d) => d.id !== currentUser.departamentoId)
  }, [departamentos, currentUser.departamentoId])

  const initialDestinoId = departamentosDestino[0]?.id || ''

  const [destinoId, setDestinoId] = useState<string>(initialDestinoId)
  const [tecnicos, setTecnicos] = useState<UsuarioDTO[]>([])
  const [carregandoTecnicos, setCarregandoTecnicos] = useState(false)
  const [anexos, setAnexos] = useState<{ dados: string; nome: string }[]>([])
  const [comprimindo, setComprimindo] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const activeDestinoId = departamentosDestino.some((d) => d.id === destinoId)
    ? destinoId
    : initialDestinoId

  const handleClose = useCallback(() => {
    setFeedback(null)
    setAnexos([])
    onClose()
  }, [onClose])

  const handleSelectImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (fileRef.current) fileRef.current.value = ''
    if (files.length === 0) return

    const espacoRestante = MAX_ANEXOS - anexos.length
    if (espacoRestante <= 0) {
      setFeedback({ type: 'error', message: `Máximo de ${MAX_ANEXOS} imagens por chamado.` })
      return
    }

    setComprimindo(true)
    try {
      const novos: { dados: string; nome: string }[] = []
      for (const file of files.slice(0, espacoRestante)) {
        if (!file.type.startsWith('image/')) continue
        if (file.size > 8 * 1024 * 1024) {
          setFeedback({ type: 'error', message: `"${file.name}" é muito grande (máx. 8MB).` })
          continue
        }
        const dados = await comprimirImagem(file)
        novos.push({ dados, nome: file.name })
      }
      if (novos.length > 0) {
        setAnexos((prev) => [...prev, ...novos])
        setFeedback(null)
      }
    } catch {
      setFeedback({ type: 'error', message: 'Falha ao processar a imagem.' })
    } finally {
      setComprimindo(false)
    }
  }

  const removerAnexo = (idx: number) => setAnexos((prev) => prev.filter((_, i) => i !== idx))

  // Carrega técnicos ao mudar o setor de destino
  useEffect(() => {
    if (!activeDestinoId) return
    let isMounted = true

    listarUsuariosPorDepartamento(activeDestinoId)
      .then((users) => {
        if (isMounted) {
          setTecnicos(users)
          setCarregandoTecnicos(false)
        }
      })
      .catch(() => {
        if (isMounted) setCarregandoTecnicos(false)
      })

    return () => {
      isMounted = false
    }
  }, [activeDestinoId])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleClose])

  if (!isOpen) return null

  async function handleSubmit(formData: FormData) {
    setFeedback(null)
    formData.set('anexos', JSON.stringify(anexos))
    startTransition(async () => {
      const res = await criarOrdemServico(formData)
      if (res.success) {
        setFeedback({ type: 'success', message: res.message || 'Ordem de serviço registrada!' })
        formRef.current?.reset()
        setAnexos([])
        setTimeout(() => {
          handleClose()
        }, 1200)
      } else {
        setFeedback({
          type: 'error',
          message: res.message || 'Erro ao cadastrar ordem de serviço interna.',
        })
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden z-10 my-8 transform transition-all animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-950/80 border border-orange-200 dark:border-orange-800 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                Nova Ordem de Serviço Interna
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Abertura de solicitação e direcionamento para a equipe responsável
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback Message */}
        {feedback && (
          <div
            className={`mx-6 mt-4 p-3.5 rounded-2xl border flex items-center gap-2.5 text-xs font-medium ${
              feedback.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Form */}
        <form ref={formRef} action={handleSubmit} className="p-6 space-y-4">
          {/* Info Solicitante Autenticado */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-zinc-900 dark:text-white">
                  {currentUser.nome}
                </span>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Setor Solicitante: <strong className="text-zinc-700 dark:text-zinc-300">{currentUser.departamentoNome}</strong>
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/80 px-2.5 py-1 rounded-lg border border-orange-200 dark:border-orange-800">
              Solicitante
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Título */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                Título da Solicitação <span className="text-orange-500">*</span>
              </label>
              <input
                type="text"
                name="titulo"
                required
                placeholder="Ex: Liberação de acesso ao CRM de Vendas"
                className="w-full bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
              />
            </div>

            {/* Setor Origem (Fixado no setor do usuário) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                Setor de Origem <span className="text-orange-500">*</span>
              </label>
              <input type="hidden" name="departamentoOrigemId" value={currentUser.departamentoId} />
              <div className="w-full bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                {currentUser.departamentoNome}
              </div>
            </div>

            {/* Setor Destino (Apenas outros setores) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                Setor Responsável (Destino) <span className="text-orange-500">*</span>
              </label>
              <select
                name="departamentoDestinoId"
                required
                value={activeDestinoId}
                onChange={(e) => {
                  const newId = e.target.value
                  setDestinoId(newId)
                  setCarregandoTecnicos(true)
                }}
                className="w-full bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all cursor-pointer"
              >
                {departamentosDestino.map((dep) => (
                  <option key={`destino-${dep.id}`} value={dep.id}>
                    {dep.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Atribuição de Responsável Técnico */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-orange-500" />
                  Atribuir Responsável Técnico (Opcional)
                </span>
              </label>
              <select
                name="responsavelId"
                defaultValue="none"
                disabled={carregandoTecnicos}
                className="w-full bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all cursor-pointer disabled:opacity-60"
              >
                <option value="none">
                  {carregandoTecnicos
                    ? 'Carregando equipe do setor...'
                    : '👥 Fila Geral do Setor (Sem responsável atribuído)'}
                </option>
                {tecnicos.map((user) => (
                  <option key={`tec-${user.id}`} value={user.id}>
                    👤 {user.nome} ({user.email})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-zinc-400 mt-1">
                Você pode direcionar o chamado para um membro específico da equipe ou deixar na fila geral do departamento.
              </p>
            </div>

            {/* Prioridade */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                Nível de Prioridade
              </label>
              <select
                name="prioridade"
                defaultValue="MEDIA"
                className="w-full bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all cursor-pointer"
              >
                <option value="BAIXA">🟢 Baixa (Demandas rotineiras sem urgência)</option>
                <option value="MEDIA">🟡 Média (Prazos normais de atendimento)</option>
                <option value="ALTA">🟠 Alta (Impacto relevante nas atividades)</option>
                <option value="URGENTE">🔴 Urgente (Bloqueio crítico de operações)</option>
              </select>
            </div>

            {/* Descrição */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                Descrição Detalhada do Chamado <span className="text-orange-500">*</span>
              </label>
              <textarea
                name="descricao"
                rows={3}
                required
                placeholder="Descreva com clareza o que é necessário, justificativa, dados de apoio ou prazos..."
                className="w-full bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all resize-none"
              />
            </div>

            {/* Anexos / Prints */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <ImagePlus className="w-3.5 h-3.5 text-orange-500" />
                  Anexar Prints / Imagens (Opcional)
                </span>
              </label>
              <div className="flex flex-wrap items-center gap-3">
                {anexos.map((a, idx) => (
                  <div key={`anexo-${idx}`} className="relative group">
                    <Image
                      src={a.dados}
                      alt={a.nome}
                      width={72}
                      height={72}
                      unoptimized
                      className="w-18 h-18 rounded-xl object-cover border border-zinc-200 dark:border-zinc-700"
                      style={{ width: 72, height: 72 }}
                    />
                    <button
                      type="button"
                      onClick={() => removerAnexo(idx)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-sm hover:bg-rose-500 cursor-pointer"
                      title="Remover"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {anexos.length < MAX_ANEXOS && (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={comprimindo}
                    className="w-18 h-18 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 flex flex-col items-center justify-center gap-1 text-zinc-400 hover:text-orange-500 hover:border-orange-400 transition-colors cursor-pointer disabled:opacity-60"
                    style={{ width: 72, height: 72 }}
                    title="Adicionar imagem"
                  >
                    {comprimindo ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <ImagePlus className="w-5 h-5" />
                        <span className="text-[10px] font-semibold">Adicionar</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleSelectImages}
                className="hidden"
              />
              <p className="text-[11px] text-zinc-400 mt-1.5">
                Até {MAX_ANEXOS} imagens · úteis para prints de tela. São redimensionadas automaticamente.
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending || departamentosDestino.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-orange-600/20 hover:shadow-orange-600/30 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Registrando...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>Abrir Chamado</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
