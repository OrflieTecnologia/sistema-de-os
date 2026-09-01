import { PrioridadeOS } from '@/lib/prisma'
import { Flame, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react'

export const PRIORITY_CONFIG: Record<
  PrioridadeOS,
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
  BAIXA: {
    label: 'Baixa',
    color: 'text-zinc-500 dark:text-zinc-400',
    bg: 'bg-zinc-100 dark:bg-zinc-800/80',
    border: 'border-zinc-300 dark:border-zinc-700',
    text: 'text-zinc-700 dark:text-zinc-300',
    icon: ArrowDown,
    chartColor: '#71717a',
  },
  MEDIA: {
    label: 'Média',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/60',
    border: 'border-amber-200 dark:border-amber-800/80',
    text: 'text-amber-700 dark:text-amber-300',
    icon: ArrowUp,
    chartColor: '#f59e0b',
  },
  ALTA: {
    label: 'Alta',
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-950/60',
    border: 'border-orange-200 dark:border-orange-800/80',
    text: 'text-orange-700 dark:text-orange-300',
    icon: AlertTriangle,
    chartColor: '#f97316',
  },
  URGENTE: {
    label: 'Urgente',
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/60',
    border: 'border-rose-200 dark:border-rose-800/80',
    text: 'text-rose-700 dark:text-rose-300',
    icon: Flame,
    chartColor: '#e11d48',
  },
}

interface PriorityBadgeProps {
  prioridade: PrioridadeOS
  size?: 'sm' | 'md'
  showIcon?: boolean
}

export function PriorityBadge({
  prioridade,
  size = 'md',
  showIcon = true,
}: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[prioridade] || PRIORITY_CONFIG.MEDIA
  const Icon = config.icon

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-xs font-medium'
      : 'px-2.5 py-1 text-xs font-semibold'

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border ${config.bg} ${config.border} ${config.text} ${sizeClasses}`}
    >
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
      <span>{config.label}</span>
    </span>
  )
}
