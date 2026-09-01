'use client'

import { OrdemServicoDTO, DepartamentoDTO } from '@/app/actions'
import { PRIORITY_CONFIG } from './priority-badge'
import { PrioridadeOS } from '@/lib/prisma'
import { useMounted } from '@/lib/use-mounted'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Building2, BarChart3, Info } from 'lucide-react'

interface ChartsSectionProps {
  ordens: OrdemServicoDTO[]
  departamentos: DepartamentoDTO[]
}

const DEPARTMENT_COLORS = [
  '#f97316', // orange-500
  '#f59e0b', // amber-500
  '#a855f7', // purple-500
  '#10b981', // emerald-500
  '#06b6d4', // cyan-500
  '#ec4899', // pink-500
  '#6366f1', // indigo-500
  '#e11d48', // rose-600
]

interface TooltipPayloadItem {
  name: string
  value: number
  payload: {
    name: string
    value: number
    color: string
    percent?: number
  }
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
}

const CustomDepartmentTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0]
    return (
      <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 shadow-xl text-xs space-y-1">
        <div className="flex items-center gap-2 font-semibold text-zinc-800 dark:text-zinc-200">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: data.payload.color }}
          />
          <span>{data.name}</span>
        </div>
        <p className="text-zinc-500 dark:text-zinc-400">
          Chamados recebidos: <strong className="text-zinc-900 dark:text-white">{data.value}</strong>
        </p>
        {data.payload.percent !== undefined && (
          <p className="text-zinc-500 dark:text-zinc-400">
            Participação: <strong className="text-zinc-900 dark:text-white">{data.payload.percent}%</strong>
          </p>
        )}
      </div>
    )
  }
  return null
}

const CustomPriorityTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0]
    return (
      <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 shadow-xl text-xs space-y-1">
        <div className="flex items-center gap-2 font-semibold text-zinc-800 dark:text-zinc-200">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: data.payload.color }}
          />
          <span>Prioridade: {data.name}</span>
        </div>
        <p className="text-zinc-500 dark:text-zinc-400">
          Total de chamados: <strong className="text-zinc-900 dark:text-white">{data.value}</strong>
        </p>
      </div>
    )
  }
  return null
}

export function ChartsSection({ ordens, departamentos }: ChartsSectionProps) {
  const mounted = useMounted()
  const total = ordens.length

  // Contagem por Departamento Destino (Setor Responsável)
  const departmentCounts: Record<string, { nome: string; count: number }> = {}

  departamentos.forEach((dep) => {
    departmentCounts[dep.id] = { nome: dep.nome, count: 0 }
  })

  ordens.forEach((os) => {
    if (departmentCounts[os.departamentoDestino.id]) {
      departmentCounts[os.departamentoDestino.id].count++
    } else {
      departmentCounts[os.departamentoDestino.id] = {
        nome: os.departamentoDestino.nome,
        count: 1,
      }
    }
  })

  const departmentData = Object.values(departmentCounts)
    .map((item, index) => ({
      name: item.nome.length > 15 ? `${item.nome.slice(0, 14)}...` : item.nome,
      fullName: item.nome,
      value: item.count,
      color: DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length],
      percent: total > 0 ? Math.round((item.count / total) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value)

  // Contagem por Prioridade
  const priorityCounts: Record<PrioridadeOS, number> = {
    BAIXA: 0,
    MEDIA: 0,
    ALTA: 0,
    URGENTE: 0,
  }

  ordens.forEach((os) => {
    if (priorityCounts[os.prioridade] !== undefined) {
      priorityCounts[os.prioridade]++
    }
  })

  const priorityData = (Object.keys(priorityCounts) as PrioridadeOS[]).map((key) => ({
    name: PRIORITY_CONFIG[key].label,
    value: priorityCounts[key],
    color: PRIORITY_CONFIG[key].chartColor,
    percent: total > 0 ? Math.round((priorityCounts[key] / total) * 100) : 0,
  }))

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="h-80 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 animate-pulse" />
        <div className="h-80 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Gráfico 1: Chamados por Departamento Destino */}
      <div className="bg-white dark:bg-zinc-900/90 rounded-2xl border border-zinc-200 dark:border-zinc-800/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/60 border border-orange-200/60 dark:border-orange-800/60 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-white">
                Demandas por Departamento Destino
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Volume de ordens de serviço direcionadas a cada setor
              </p>
            </div>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
            {departamentos.length} Setores
          </span>
        </div>

        <div className="h-64 w-full my-3">
          {total === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400 text-xs gap-2">
              <Info className="w-6 h-6 text-zinc-400" />
              <span>Nenhuma solicitação interna cadastrada ainda.</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={departmentData}
                margin={{ top: 15, right: 10, left: -20, bottom: 25 }}
              >
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#a1a1aa' }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  axisLine={{ stroke: '#3f3f46', opacity: 0.3 }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#a1a1aa' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomDepartmentTooltip />} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {departmentData.map((entry, index) => (
                    <Cell key={`dep-cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Legenda de Setores */}
        <div className="flex items-center gap-3 overflow-x-auto pt-3 border-t border-zinc-100 dark:border-zinc-800/80 text-xs no-scrollbar">
          {departmentData.slice(0, 5).map((dep, idx) => (
            <div key={idx} className="flex items-center gap-1.5 shrink-0">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: dep.color }}
              />
              <span className="text-zinc-600 dark:text-zinc-400">{dep.name}:</span>
              <strong className="text-zinc-900 dark:text-white">{dep.value}</strong>
            </div>
          ))}
        </div>
      </div>

      {/* Gráfico 2: Volume por Prioridade */}
      <div className="bg-white dark:bg-zinc-900/90 rounded-2xl border border-zinc-200 dark:border-zinc-800/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-white">
                Volume por Prioridade
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Nível de criticidade das solicitações internas
              </p>
            </div>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
            4 Níveis
          </span>
        </div>

        <div className="h-64 w-full my-3">
          {total === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400 text-xs gap-2">
              <Info className="w-6 h-6 text-zinc-400" />
              <span>Nenhuma solicitação interna cadastrada ainda.</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={priorityData}
                margin={{ top: 15, right: 10, left: -20, bottom: 5 }}
              >
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#a1a1aa' }}
                  axisLine={{ stroke: '#3f3f46', opacity: 0.3 }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: '#a1a1aa' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomPriorityTooltip />} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Legenda de Prioridades */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
          {(Object.keys(priorityCounts) as PrioridadeOS[]).map((pr) => {
            const cfg = PRIORITY_CONFIG[pr]
            const count = priorityCounts[pr]
            return (
              <div key={pr} className="flex items-center gap-1.5 text-xs">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: cfg.chartColor }}
                />
                <span className="text-zinc-600 dark:text-zinc-400">{cfg.label}:</span>
                <span className="font-semibold text-zinc-900 dark:text-white">{count}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
