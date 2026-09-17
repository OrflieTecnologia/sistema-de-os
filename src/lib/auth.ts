import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createHmac, timingSafeEqual } from 'crypto'
import { prisma, UserRole } from './prisma'

export type { UserRole }

// Segredo para assinar a sessão. Usa SESSION_SECRET quando definido; senão
// cai na SERVICE_ROLE_KEY (já presente em local e produção). Nunca vai ao client.
function sessionSecret(): string {
  return (
    process.env.SESSION_SECRET ||
    process.env.SERVICE_ROLE_KEY ||
    'orflie-dev-secret-inseguro-trocar'
  )
}

/** Gera o token de sessão assinado: "<userId>.<hmac>". */
export function assinarSessao(userId: string): string {
  const sig = createHmac('sha256', sessionSecret()).update(userId).digest('base64url')
  return `${userId}.${sig}`
}

/** Valida o token assinado e retorna o userId, ou null se inválido/adulterado. */
export function verificarSessao(token: string | undefined | null): string | null {
  if (!token) return null
  const i = token.lastIndexOf('.')
  if (i <= 0) return null
  const userId = token.slice(0, i)
  const sig = token.slice(i + 1)
  const esperado = createHmac('sha256', sessionSecret()).update(userId).digest('base64url')
  const a = Buffer.from(sig)
  const b = Buffer.from(esperado)
  if (a.length !== b.length) return null
  if (!timingSafeEqual(a, b)) return null
  return userId
}

export type SessionUser = {
  id: string
  nome: string
  email: string
  role: UserRole
  fotoUrl: string | null
  departamentoId: string
  departamentoNome: string
}

export const SESSION_COOKIE = 'orflie_session'

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)?.value

    // Valida a assinatura do cookie antes de confiar no ID (evita falsificação).
    const userId = verificarSessao(token)
    if (!userId) {
      return null
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      include: { departamento: true },
    })

    // Usuário desativado (soft delete) perde o acesso imediatamente.
    if (!usuario || !usuario.departamento || !usuario.ativo) {
      return null
    }

    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role,
      fotoUrl: usuario.fotoUrl,
      departamentoId: usuario.departamento.id,
      departamentoNome: usuario.departamento.nome,
    }
  } catch (error) {
    console.error('Erro ao obter usuário da sessão:', error)
    return null
  }
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) {
    redirect('/login')
  }
  return user
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth()
  if (user.role !== 'ADMIN') {
    redirect('/')
  }
  return user
}
