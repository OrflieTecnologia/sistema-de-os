'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { atualizarPerfil } from '@/app/actions'
import { SessionUser } from '@/lib/auth'
import { AvatarCropper } from './avatar-cropper'
import {
  Camera,
  Trash2,
  User,
  Mail,
  Lock,
  Building2,
  Shield,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react'

interface PerfilFormProps {
  user: SessionUser
}

export function PerfilForm({ user }: PerfilFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string>(user.fotoUrl || '')
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [nome, setNome] = useState(user.nome)
  const [email, setEmail] = useState(user.email)
  const [senha, setSenha] = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ').filter(Boolean)
    if (parts.length === 0) return '?'
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const handleSelecionarFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setFeedback({ tipo: 'erro', texto: 'Selecione um arquivo de imagem válido.' })
      return
    }
    // Limite de 5MB para o arquivo original
    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ tipo: 'erro', texto: 'A imagem deve ter no máximo 5MB.' })
      return
    }

    // Abre o editor de recorte/redimensionamento com a imagem escolhida
    const reader = new FileReader()
    reader.onload = () => {
      setCropSrc(reader.result as string)
      setFeedback(null)
    }
    reader.readAsDataURL(file)
    // Permite reselecionar o mesmo arquivo depois
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleCropConfirm = (dataUrl: string) => {
    setPreview(dataUrl)
    setCropSrc(null)
  }

  const handleRemoverFoto = () => {
    setPreview('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFeedback(null)

    const formData = new FormData()
    formData.set('nome', nome)
    formData.set('email', email)
    formData.set('senha', senha)
    formData.set('fotoUrl', preview)

    startTransition(async () => {
      const res = await atualizarPerfil(formData)
      if (res.success) {
        setFeedback({ tipo: 'ok', texto: res.message || 'Perfil atualizado com sucesso!' })
        setSenha('')
        router.refresh()
      } else {
        setFeedback({ tipo: 'erro', texto: res.message || 'Não foi possível atualizar o perfil.' })
      }
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/90 dark:border-zinc-800/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-8"
    >
      {/* Cabeçalho */}
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">Meu Perfil</h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
          Atualize seus dados pessoais, senha de acesso e foto de perfil.
        </p>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold border ${
            feedback.tipo === 'ok'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60'
          }`}
        >
          {feedback.tipo === 'ok' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.texto}</span>
        </div>
      )}

      {/* Avatar */}
      <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60">
        <div className="relative shrink-0">
          {preview ? (
            <Image
              src={preview}
              alt="Foto de perfil"
              width={96}
              height={96}
              unoptimized
              className="w-24 h-24 rounded-3xl object-cover border-2 border-orange-300/80 dark:border-orange-800/80 shadow-sm"
            />
          ) : (
            <div className="w-24 h-24 rounded-3xl bg-orange-100 dark:bg-orange-950/80 border-2 border-orange-300/80 dark:border-orange-800/80 flex items-center justify-center text-2xl font-black text-orange-700 dark:text-orange-400 shadow-sm">
              {getInitials(nome)}
            </div>
          )}
        </div>

        <div className="flex-1 text-center sm:text-left space-y-3">
          <div>
            <p className="text-sm font-bold text-zinc-900 dark:text-white">Foto de Perfil</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              JPG, PNG ou GIF · máximo de 5MB · recorte antes de salvar.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-orange-600/20 transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Escolher Foto</span>
            </button>
            {preview && (
              <button
                type="button"
                onClick={handleRemoverFoto}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-zinc-700 dark:text-zinc-300 hover:text-rose-600 dark:hover:text-rose-400 text-xs sm:text-sm font-bold transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Remover</span>
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleSelecionarFoto}
            className="hidden"
          />
        </div>
      </div>

      {/* Campos de dados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Nome */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            <User className="w-3.5 h-3.5" /> Nome Completo
          </label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            className="w-full bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
          />
        </div>

        {/* E-mail */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            <Mail className="w-3.5 h-3.5" /> E-mail Corporativo
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
          />
        </div>

        {/* Nova Senha */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            <Lock className="w-3.5 h-3.5" /> Nova Senha
          </label>
          <div className="relative">
            <input
              type={showSenha ? 'text' : 'password'}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Deixe em branco para manter a atual"
              className="w-full bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl px-4 py-2.5 pr-11 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowSenha((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              tabIndex={-1}
            >
              {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Departamento (somente leitura) */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            <Building2 className="w-3.5 h-3.5" /> Departamento
          </label>
          <div className="flex items-center justify-between w-full bg-zinc-100/70 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/60 rounded-2xl px-4 py-2.5 text-sm">
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">{user.departamentoNome}</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 dark:text-orange-400">
              <Shield className="w-3 h-3" /> {user.role}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400">
            O departamento e o nível de acesso são geridos pela administração.
          </p>
        </div>
      </div>

      {/* Ações */}
      <div className="flex items-center justify-end pt-2 border-t border-zinc-100 dark:border-zinc-800">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold shadow-md shadow-orange-600/20 active:scale-98 transition-all cursor-pointer disabled:opacity-60"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Salvar Alterações</span>
        </button>
      </div>

      {/* Editor de recorte / redimensionamento da foto */}
      {cropSrc && (
        <AvatarCropper
          src={cropSrc}
          onCancel={() => setCropSrc(null)}
          onConfirm={handleCropConfirm}
        />
      )}
    </form>
  )
}
