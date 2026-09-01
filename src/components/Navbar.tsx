'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useSearchParams } from 'next/navigation'
import { SessionUser } from '@/lib/auth'
import { logoutAction } from '@/app/auth/actions'
import { ThemeToggle } from '@/components/theme-toggle'
import { OrfliaLogo } from '@/components/OrfliaLogo'
import {
  FileText,
  Users,
  BarChart3,
  ShieldAlert,
  LogOut,
  Loader2,
  Shield,
  User,
  Menu,
  X,
} from 'lucide-react'

interface NavbarProps {
  user: SessionUser
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentView = searchParams.get('view') || 'minhas'
  const [isLoggingOut, startLogout] = useTransition()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isAdmin = user.role === 'ADMIN'
  const isDepartamentos = pathname === '/departamentos'
  const isDashboard = pathname === '/'
  const isPerfil = pathname === '/perfil'

  const handleLogout = () => {
    startLogout(async () => {
      await logoutAction()
    })
  }

  // Iniciais do nome
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ').filter(Boolean)
    if (parts.length === 0) return '?'
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const isMinhasActive = isDashboard && (currentView === 'minhas' || currentView === 'todas')
  const isSetorActive = isDashboard && currentView === 'setor'
  const isRelatoriosActive = isDashboard && currentView === 'relatorios'

  // Links de navegação reutilizados no desktop e no menu mobile
  const navLinks = [
    { href: '/?view=minhas', label: 'Minhas OS', icon: FileText, active: isMinhasActive },
    { href: '/?view=setor', label: 'Painel do Setor', icon: Users, active: isSetorActive },
    { href: '/?view=relatorios', label: 'Relatórios', icon: BarChart3, active: isRelatoriosActive },
    ...(isAdmin
      ? [{ href: '/departamentos', label: 'Administração', icon: ShieldAlert, active: isDepartamentos }]
      : []),
  ]

  // Avatar (foto quando houver, senão iniciais) — função de renderização, não um componente aninhado
  const renderAvatar = (size: 'md' | 'sm' = 'md') => {
    const dim = size === 'sm' ? 'w-9 h-9 rounded-xl' : 'w-11 h-11 rounded-2xl'
    if (user.fotoUrl) {
      return (
        <Image
          src={user.fotoUrl}
          alt={user.nome}
          width={44}
          height={44}
          unoptimized
          className={`${dim} object-cover border border-orange-300/80 dark:border-orange-800/80 shadow-xs shrink-0`}
        />
      )
    }
    return (
      <div
        className={`${dim} bg-orange-100 dark:bg-orange-950/80 border border-orange-300/80 dark:border-orange-800/80 flex items-center justify-center text-xs font-bold text-orange-700 dark:text-orange-400 shadow-xs shrink-0`}
      >
        {getInitials(user.nome)}
      </div>
    )
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-zinc-950/90 backdrop-blur-2xl border-b border-zinc-200/90 dark:border-zinc-800/90 transition-colors duration-200 shadow-sm">
      <div className="w-full px-4 sm:px-8 lg:px-14">
        <div className="relative flex items-center justify-between h-16 sm:h-20 md:h-[88px]">
          {/* ========================================================================= */}
          {/* 1. CANTO ESQUERDO: Logo Orflia */}
          {/* ========================================================================= */}
          <div className="flex items-center gap-4 shrink-0 z-10">
            <Link href="/" className="flex flex-col group py-1">
              <OrfliaLogo size="lg" showBadge={true} />
              <span className="hidden sm:block text-[11px] text-zinc-400 dark:text-zinc-500 font-medium tracking-wide mt-1">
                Sistema de Ordem de Serviço
              </span>
            </Link>
          </div>

          {/* ========================================================================= */}
          {/* 2. CENTRO: Abas de Navegação (desktop) */}
          {/* ========================================================================= */}
          <nav className="hidden md:flex items-center gap-1.5 p-1.5 bg-zinc-100/90 dark:bg-zinc-900/90 rounded-2xl border border-zinc-200 dark:border-zinc-800/90 text-xs sm:text-sm font-semibold shadow-inner absolute left-1/2 -translate-x-1/2">
            {navLinks.map(({ href, label, icon: Icon, active }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
                  active
                    ? 'bg-white dark:bg-zinc-800 text-orange-600 dark:text-orange-400 shadow-md font-bold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${label === 'Administração' ? 'text-orange-500' : ''}`} />
                <span>{label}</span>
              </Link>
            ))}
          </nav>

          {/* ========================================================================= */}
          {/* 3. CANTO DIREITO: Tema, Perfil, Logout e Hambúrguer (mobile) */}
          {/* ========================================================================= */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0 z-10">
            {/* Toggle de Tema */}
            <ThemeToggle />

            {/* Divisor Vertical */}
            <div className="hidden sm:block h-9 w-px bg-zinc-200 dark:bg-zinc-800" />

            {/* Perfil do Usuário (leva à página /perfil) */}
            <Link
              href="/perfil"
              title="Meu Perfil"
              className={`flex items-center gap-3 rounded-2xl px-1.5 sm:px-2 py-1 transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800/60 ${
                isPerfil ? 'ring-2 ring-orange-500/40' : ''
              }`}
            >
              {renderAvatar('md')}
              {/* Nome & Setor */}
              <div className="hidden lg:block text-left leading-tight">
                <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100">
                  <span>{user.nome}</span>
                  {isAdmin ? (
                    <Shield className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[11px] px-2 py-0.5 rounded-md font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                    {user.departamentoNome}
                  </span>
                  <span className="text-[11px] text-zinc-400">•</span>
                  <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400">
                    {user.role}
                  </span>
                </div>
              </div>
            </Link>

            {/* Botão Sair (Logout) — escondido no mobile (fica no menu) */}
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="hidden md:flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-zinc-200/80 dark:border-zinc-800 hover:border-rose-200 dark:hover:border-rose-800 transition-all cursor-pointer shadow-xs"
              title="Encerrar Sessão"
            >
              {isLoggingOut ? (
                <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
              <span className="hidden lg:inline">Sair</span>
            </button>

            {/* Botão Hambúrguer (mobile / tablet) */}
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-all cursor-pointer"
              aria-label="Abrir menu de navegação"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MENU MOBILE COLAPSÁVEL */}
      {/* ========================================================================= */}
      {mobileOpen && (
        <div className="md:hidden border-t border-zinc-200/90 dark:border-zinc-800/90 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl px-4 py-4 space-y-2 shadow-lg">
          {/* Identificação do usuário no topo do menu */}
          <Link
            href="/perfil"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 p-2 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800/70"
          >
            {renderAvatar('sm')}
            <div className="leading-tight">
              <p className="font-bold text-sm text-zinc-900 dark:text-white">{user.nome}</p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {user.departamentoNome} · <span className="text-orange-600 dark:text-orange-400 font-bold">{user.role}</span>
              </p>
            </div>
          </Link>

          {/* Links de Navegação */}
          {navLinks.map(({ href, label, icon: Icon, active }) => (
            <Link
              key={`m-${href}`}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                active
                  ? 'bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400'
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${label === 'Administração' ? 'text-orange-500' : ''}`} />
              <span>{label}</span>
            </Link>
          ))}

          {/* Sair */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200/70 dark:border-rose-900/50 transition-all cursor-pointer"
          >
            {isLoggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            <span>Encerrar Sessão</span>
          </button>
        </div>
      )}
    </header>
  )
}
