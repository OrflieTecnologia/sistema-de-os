'use client'

import { useState } from 'react'
import { OsModal } from './os-modal'
import { DepartamentoDTO } from '@/app/actions'
import { SessionUser } from '@/lib/auth'
import { Plus, Sparkles, FileText, Users, BarChart3 } from 'lucide-react'

interface HeaderProps {
  totalOS: number
  departamentos: DepartamentoDTO[]
  currentUser: SessionUser
  currentView?: string
}

export function Header({ totalOS, departamentos, currentUser, currentView = 'minhas' }: HeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const getViewInfo = () => {
    switch (currentView) {
      case 'setor':
        return {
          title: `Painel do Setor (${currentUser.departamentoNome})`,
          subtitle: 'Chamados com destino no seu departamento corporativo para a equipe atender',
          icon: <Users className="w-6 h-6 text-orange-500" />,
        }
      case 'relatorios':
        return {
          title: 'Central de Relatórios & Produtividade',
          subtitle: `Relatórios de desempenho e ordens de serviço do setor ${currentUser.departamentoNome}`,
          icon: <BarChart3 className="w-6 h-6 text-orange-500" />,
        }
      case 'minhas':
      default:
        return {
          title: 'Minhas Solicitações de Serviço',
          subtitle: 'Acompanhamento das ordens de serviço internas abertas por você na plataforma',
          icon: <FileText className="w-6 h-6 text-orange-500" />,
        }
    }
  }

  const viewInfo = getViewInfo()

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 p-6 sm:p-7 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-zinc-200/90 dark:border-zinc-800/90 rounded-3xl shadow-xs">
        {/* Título & Contexto da View */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-950/80 border border-orange-200 dark:border-orange-800/80 flex items-center justify-center shrink-0 shadow-xs">
            {viewInfo.icon}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-lg sm:text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
                {viewInfo.title}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800/80">
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                {totalOS} {totalOS === 1 ? 'OS' : 'OSs'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              {viewInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Botão de Destaque para Abertura de Nova OS: Apenas na visualização do Painel do Setor */}
        {currentView === 'setor' && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-orange-600/25 hover:shadow-orange-600/35 hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Nova Ordem de Serviço</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal de Abertura de OS Interna */}
      <OsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        departamentos={departamentos.filter((d) => d.ativo)}
        currentUser={currentUser}
      />
    </>
  )
}
