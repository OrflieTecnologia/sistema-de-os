'use client'

import { useActionState, useState } from 'react'
import { cadastroAction } from '@/app/auth/actions'
import { DepartamentoDTO } from '@/app/actions'
import { Lock, Mail, User, Building2, Loader2, AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react'

interface CadastroFormProps {
  departamentos: DepartamentoDTO[]
}

export function CadastroForm({ departamentos }: CadastroFormProps) {
  const [state, formAction, isPending] = useActionState(cadastroAction, null)
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="space-y-5">
      {/* Feedback Alert */}
      {state && !state.success && state.error && (
        <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-medium flex items-center gap-2.5 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      <form action={formAction} className="space-y-4">
        {/* Nome Completo */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Nome Completo <span className="text-orange-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              name="nome"
              required
              placeholder="Ex: Mariana Costa"
              className="w-full bg-zinc-800/80 border border-zinc-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
            />
          </div>
        </div>

        {/* Email Corporativo */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
            E-mail Corporativo <span className="text-orange-500">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="email"
              name="email"
              required
              placeholder="mariana@orflie.com"
              className="w-full bg-zinc-800/80 border border-zinc-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
            />
          </div>
        </div>

        {/* Departamento */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Departamento / Setor <span className="text-orange-500">*</span>
          </label>
          <div className="relative">
            <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <select
              name="departamentoId"
              required
              defaultValue={departamentos[0]?.id || ''}
              className="w-full bg-zinc-800/80 border border-zinc-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all cursor-pointer"
            >
              {departamentos.map((dep) => (
                <option key={dep.id} value={dep.id}>
                  {dep.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Senha */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Senha (mínimo 6 caracteres) <span className="text-orange-500">*</span>
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="senha"
              required
              minLength={6}
              placeholder="••••••••"
              className="w-full bg-zinc-800/80 border border-zinc-700/80 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending || departamentos.length === 0}
          className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-semibold text-sm shadow-lg shadow-orange-600/25 hover:shadow-orange-600/35 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Cadastrando...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Criar Minha Conta</span>
            </>
          )}
        </button>
      </form>
    </div>
  )
}
