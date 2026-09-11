'use client'

import { useState, useTransition, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell,
  CheckCheck,
  FileText,
  RefreshCw,
  MessageSquare,
  Paperclip,
  UserCheck,
} from 'lucide-react'
import {
  listarNotificacoes,
  contarNotificacoesNaoLidas,
  marcarNotificacaoLida,
  marcarTodasNotificacoesLidas,
  NotificacaoDTO,
} from '@/app/actions'
import { useAutoRefresh } from '@/lib/use-auto-refresh'

function tempoRelativo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `há ${h} h`
  const d = Math.floor(h / 24)
  if (d < 7) return `há ${d} d`
  return new Date(iso).toLocaleDateString('pt-BR')
}

function IconePorTipo({ tipo }: { tipo: string }) {
  switch (tipo) {
    case 'NOVA_OS':
      return <FileText className="w-4 h-4 text-orange-500" />
    case 'STATUS':
      return <RefreshCw className="w-4 h-4 text-blue-500" />
    case 'COMENTARIO':
      return <MessageSquare className="w-4 h-4 text-emerald-500" />
    case 'ANEXO':
      return <Paperclip className="w-4 h-4 text-violet-500" />
    case 'RESPONSAVEL':
      return <UserCheck className="w-4 h-4 text-amber-500" />
    default:
      return <Bell className="w-4 h-4 text-zinc-400" />
  }
}

export function NotificacoesBell() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState<NotificacaoDTO[]>([])
  const [naoLidas, setNaoLidas] = useState(0)
  const [, startTransition] = useTransition()
  const containerRef = useRef<HTMLDivElement>(null)

  const carregar = useCallback(() => {
    startTransition(async () => {
      const [lista, count] = await Promise.all([
        listarNotificacoes(),
        contarNotificacoesNaoLidas(),
      ])
      setNotifs(lista)
      setNaoLidas(count)
    })
  }, [])

  // Carga inicial + atualização automática (foco/aba visível + polling), sem F5
  useEffect(() => {
    carregar()
  }, [carregar])
  useAutoRefresh(carregar, 30000)

  // Fecha o painel ao clicar fora
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const abrirNotificacao = (n: NotificacaoDTO) => {
    setOpen(false)
    startTransition(async () => {
      if (!n.lida) await marcarNotificacaoLida(n.id)
      const view = n.tipo === 'NOVA_OS' ? 'setor' : 'minhas'
      const url = n.ordemId ? `/?view=${view}&os=${n.ordemId}` : `/?view=${view}`
      router.push(url)
      router.refresh()
      carregar()
    })
  }

  const marcarTodas = () => {
    startTransition(async () => {
      await marcarTodasNotificacoesLidas()
      carregar()
    })
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex items-center justify-center w-9 h-9 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 hover:text-orange-600 dark:hover:text-orange-400 transition-all cursor-pointer"
        title="Notificações"
        aria-label="Notificações"
      >
        <Bell className="w-[18px] h-[18px]" />
        {naoLidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm ring-2 ring-zinc-100 dark:ring-zinc-900">
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-h-[70vh] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl z-50 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
            <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Notificações</span>
            {naoLidas > 0 && (
              <button
                type="button"
                onClick={marcarTodas}
                className="flex items-center gap-1.5 text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Marcar todas
              </button>
            )}
          </div>

          <div className="overflow-y-auto">
            {notifs.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-zinc-400">Nenhuma notificação ainda.</p>
            ) : (
              notifs.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => abrirNotificacao(n)}
                  className={`w-full text-left flex gap-3 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/70 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer ${
                    !n.lida ? 'bg-orange-50/60 dark:bg-orange-950/20' : ''
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    <IconePorTipo tipo={n.tipo} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <span className="truncate">{n.titulo}</span>
                      {!n.lida && <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />}
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 truncate">{n.mensagem}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{tempoRelativo(n.criadoEm)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
