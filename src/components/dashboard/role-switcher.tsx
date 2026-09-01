'use client'

import { useTransition } from 'react'
import { SessionUser } from '@/lib/auth'
import { switchQuickAccountAction } from '@/app/auth/actions'
import { Shield, User, Loader2 } from 'lucide-react'

interface RoleSwitcherProps {
  currentUser: SessionUser
}

export function RoleSwitcher({ currentUser }: RoleSwitcherProps) {
  const [isPending, startTransition] = useTransition()

  const handleSwitch = (email: string) => {
    if (email === currentUser.email || isPending) return
    startTransition(async () => {
      await switchQuickAccountAction(email)
    })
  }

  const isAdmin = currentUser.role === 'ADMIN'

  return (
    <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800/90 rounded-2xl border border-zinc-200 dark:border-zinc-700/80 shadow-xs">
      <button
        type="button"
        onClick={() => handleSwitch('admin@orflie.com')}
        disabled={isPending}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
          isAdmin
            ? 'bg-white dark:bg-zinc-900 text-orange-600 dark:text-orange-400 shadow-xs ring-1 ring-orange-500/20'
            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
        }`}
        title="Alternar para Administrador (Carlos Admin)"
      >
        {isPending && isAdmin ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />
        ) : (
          <Shield className="w-3.5 h-3.5 text-orange-500" />
        )}
        <span>Admin</span>
      </button>

      <button
        type="button"
        onClick={() => handleSwitch('mariana@orflie.com')}
        disabled={isPending}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
          !isAdmin
            ? 'bg-white dark:bg-zinc-900 text-orange-600 dark:text-orange-400 shadow-xs ring-1 ring-orange-500/20'
            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
        }`}
        title="Alternar para Membro (Mariana Costa)"
      >
        {isPending && !isAdmin ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />
        ) : (
          <User className="w-3.5 h-3.5 text-orange-500" />
        )}
        <span>Membro</span>
      </button>
    </div>
  )
}
