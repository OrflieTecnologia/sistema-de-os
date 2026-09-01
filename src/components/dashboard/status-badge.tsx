import { StatusOS } from '@/lib/prisma'
import { AlertCircle, RefreshCw, MessageSquareQuote, CheckCircle2, XCircle } from 'lucide-react'

export const STATUS_CONFIG: Record<
  StatusOS,
  {
    label: string
    color: string
    bg: string
    border: string
    text: string
    icon: React.ComponentType<{ className?: string }>
    chartColor: string
  }
> = {
  ABERTA: {
    label: 'Aberta',
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-950/60',
    border: 'border-orange-200 dark:border-orange-800/80',
    text: 'text-orange-700 dark:text-orange-300',
    icon: AlertCircle,
    chartColor: '#f97316',
  },
  EM_ANDAMENTO: {
    label: 'Em Andamento',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/60',
    border: 'border-amber-200 dark:border-amber-800/80',
    text: 'text-amber-700 dark:text-amber-300',
    icon: RefreshCw,
    chartColor: '#f59e0b',
  },
  AGUARDANDO_RESPOSTA: {
    label: 'Aguardando Resposta',
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-950/60',
    border: 'border-purple-200 dark:border-purple-800/80',
    text: 'text-purple-700 dark:text-purple-300',
    icon: MessageSquareQuote,
    chartColor: '#a855f7',
  },
  CONCLUIDA: {
    label: 'Concluída',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/60',
    border: 'border-emerald-200 dark:border-emerald-800/80',
    text: 'text-emerald-700 dark:text-emerald-300',
    icon: CheckCircle2,
    chartColor: '#10b981',
  },
  CANCELADA: {
    label: 'Cancelada',
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/60',
    border: 'border-rose-200 dark:border-rose-800/80',
    text: 'text-rose-700 dark:text-rose-300',
    icon: XCircle,
    chartColor: '#f43f5e',
  },
}

interface StatusBadgeProps {
  status: StatusOS
  size?: 'sm' | 'md'
  showIcon?: boolean
}

export function StatusBadge({ status, size = 'md', showIcon = true }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.ABERTA
  const Icon = config.icon

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-xs font-medium'
      : 'px-2.5 py-1 text-xs font-semibold'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${config.border} ${config.text} ${sizeClasses} shadow-xs`}
    >
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
      <span>{config.label}</span>
    </span>
  )
}
