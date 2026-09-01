'use server'

import { prisma, UserRole } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { SESSION_COOKIE } from '@/lib/auth'

export type AuthActionResult = {
  success: boolean
  error?: string
}

export async function loginAction(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const senha = (formData.get('senha') as string)?.trim()

  if (!email || !senha) {
    return { success: false, error: 'Informe seu e-mail e senha.' }
  }

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { email },
      include: { departamento: true },
    })

    if (!usuario) {
      return { success: false, error: 'E-mail ou senha incorretos.' }
    }

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha)
    if (!senhaCorreta) {
      return { success: false, error: 'E-mail ou senha incorretos.' }
    }

    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE, usuario.id, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    })
  } catch (error) {
    console.error('Erro no login:', error)
    return { success: false, error: 'Ocorreu um erro ao processar o login. Tente novamente.' }
  }

  redirect('/')
}

export async function cadastroAction(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const nome = (formData.get('nome') as string)?.trim()
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const senha = (formData.get('senha') as string)?.trim()
  const departamentoId = (formData.get('departamentoId') as string)?.trim()

  if (!nome || !email || !senha || !departamentoId) {
    return { success: false, error: 'Preencha todos os campos obrigatórios.' }
  }

  if (senha.length < 6) {
    return { success: false, error: 'A senha deve conter no mínimo 6 caracteres.' }
  }

  try {
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email },
    })

    if (usuarioExistente) {
      return { success: false, error: 'Já existe uma conta cadastrada com este e-mail.' }
    }

    const senhaHash = await bcrypt.hash(senha, 10)

    const novoUsuario = await prisma.usuario.create({
      data: {
        nome,
        email,
        senha: senhaHash,
        role: UserRole.MEMBRO,
        departamentoId,
      },
    })

    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE, novoUsuario.id, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    })
  } catch (error) {
    console.error('Erro no cadastro:', error)
    return { success: false, error: 'Falha ao criar conta. Verifique os dados e tente novamente.' }
  }

  redirect('/')
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
  redirect('/login')
}

export async function switchQuickAccountAction(email: string): Promise<void> {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { email },
    })

    if (usuario) {
      const cookieStore = await cookies()
      cookieStore.set(SESSION_COOKIE, usuario.id, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      })
    }
  } catch (error) {
    console.error('Erro ao alternar conta rápida:', error)
  }

  redirect('/')
}
