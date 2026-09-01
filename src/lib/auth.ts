import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma, UserRole } from './prisma'

export type { UserRole }

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
    const sessionCookie = cookieStore.get(SESSION_COOKIE)?.value

    if (!sessionCookie) {
      return null
    }

    // O cookie guarda o ID do usuário
    const usuario = await prisma.usuario.findUnique({
      where: { id: sessionCookie },
      include: { departamento: true },
    })

    if (!usuario || !usuario.departamento) {
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
