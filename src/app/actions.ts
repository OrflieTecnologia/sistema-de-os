'use server'

import { prisma, StatusOS, PrioridadeOS, Prisma, UserRole } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getSessionUser, requireAdmin } from '@/lib/auth'
import { mimeDeDataUrl, tipoAnexoPermitido, ehImagemPorExtensao } from '@/lib/anexo-tipos'
import {
  storageConfigurado,
  uploadAnexoDataUrl,
  urlAssinada,
  removerAnexoStorage,
} from '@/lib/supabase-storage'
import bcrypt from 'bcryptjs'

export type ActionResult<T = unknown> = {
  success: boolean
  message?: string
  data?: T
}

export type UsuarioDTO = {
  id: string
  nome: string
  email: string
  departamentoId: string
  role: string
}

export type UsuarioAdminDTO = {
  id: string
  nome: string
  email: string
  role: 'ADMIN' | 'MEMBRO'
  departamentoId: string
  departamento: {
    nome: string
  }
  criadoEm?: string
}

export type DepartamentoDTO = {
  id: string
  nome: string
  ativo: boolean
  totalOrigem?: number
  totalDestino?: number
}

export type OrdemServicoDTO = {
  id: string
  codigo: string
  titulo: string
  descricao: string
  status: StatusOS
  prioridade: PrioridadeOS
  solicitanteId: string
  solicitante: {
    id: string
    nome: string
    email: string
  }
  responsavelId: string | null
  responsavel: {
    id: string
    nome: string
    email: string
  } | null
  departamentoOrigemId: string
  departamentoOrigem: {
    id: string
    nome: string
  }
  departamentoDestinoId: string
  departamentoDestino: {
    id: string
    nome: string
  }
  criadoEm: string
  atualizadoEm: string
}

export type ComentarioDTO = {
  id: string
  texto: string
  criadoEm: string
  autor: { id: string; nome: string; email: string }
}

export type AnexoDTO = {
  id: string
  url: string // URL assinada (Storage) OU data URL base64 (legado)
  nome: string | null
  isImagem: boolean
  tamanho: number | null // bytes
  criadoEm: string
}

export type DetalhesOSDTO = {
  comentarios: ComentarioDTO[]
  anexos: AnexoDTO[]
}

export type NotificacaoDTO = {
  id: string
  tipo: string
  titulo: string
  mensagem: string
  lida: boolean
  criadoEm: string
  ordemId: string | null
  ordemCodigo: string | null
}

export type ProdutividadeItemDTO = {
  responsavelId: string | null
  responsavelNome: string
  departamentoNome: string
  totalOS: number
  concluidas: number
  emAndamento: number
  abertas: number
  tempoMedioHoras: number
  tempoMedioFormatado: string
}

export type RelatorioProdutividadeDTO = {
  periodo: string
  departamentoId: string | null
  departamentoNome: string
  geradoEm: string
  totalOS: number
  totalConcluidas: number
  taxaResolucao: number
  tempoMedioGeralFormatado: string
  itens: ProdutividadeItemDTO[]
  ordensDetalhe: OrdemServicoDTO[]
}

export type RelatorioDTO = {
  id: string
  codigo: string
  titulo: string
  tipo: 'MINHAS_OS' | 'SETOR' | 'GERAL'
  departamentoId: string | null
  departamento: {
    id: string
    nome: string
  } | null
  autorId: string
  autor: {
    id: string
    nome: string
    email: string
  }
  totalOS: number
  abertas: number
  emAndamento: number
  concluidas: number
  canceladas: number
  taxaResolucao: number
  dadosJson: string | null
  criadoEm: string
}

// ----------------------------------------------------
// AÇÕES DE USUÁRIOS E COLABORADORES
// ----------------------------------------------------

export async function listarUsuariosPorDepartamento(departamentoId: string): Promise<UsuarioDTO[]> {
  try {
    if (!departamentoId) return []
    const usuarios = await prisma.usuario.findMany({
      where: { departamentoId },
      orderBy: { nome: 'asc' },
      select: {
        id: true,
        nome: true,
        email: true,
        departamentoId: true,
        role: true,
      },
    })
    return usuarios
  } catch (error) {
    console.error('Erro ao listar usuários do departamento:', error)
    return []
  }
}

// ----------------------------------------------------
// AÇÕES DE DEPARTAMENTOS
// ----------------------------------------------------

export async function listarDepartamentos(): Promise<DepartamentoDTO[]> {
  try {
    const deps = await prisma.departamento.findMany({
      orderBy: { nome: 'asc' },
      include: {
        _count: {
          select: {
            ordensOrigem: true,
            ordensDestino: true,
          },
        },
      },
    })

    return deps.map((d) => ({
      id: d.id,
      nome: d.nome,
      ativo: d.ativo,
      totalOrigem: d._count.ordensOrigem,
      totalDestino: d._count.ordensDestino,
    }))
  } catch (error) {
    console.error('Erro ao listar departamentos:', error)
    return []
  }
}

export async function criarDepartamento(formData: FormData): Promise<ActionResult<DepartamentoDTO>> {
  try {
    const nome = (formData.get('nome') as string)?.trim()

    if (!nome) {
      return { success: false, message: 'O nome do departamento é obrigatório.' }
    }

    const existe = await prisma.departamento.findUnique({
      where: { nome },
    })

    if (existe) {
      return { success: false, message: 'Já existe um departamento com este nome.' }
    }

    const novoDep = await prisma.departamento.create({
      data: {
        nome,
        ativo: true,
      },
    })

    revalidatePath('/')
    revalidatePath('/departamentos')

    return {
      success: true,
      message: `Departamento "${novoDep.nome}" criado com sucesso!`,
      data: {
        id: novoDep.id,
        nome: novoDep.nome,
        ativo: novoDep.ativo,
      },
    }
  } catch (error) {
    console.error('Erro ao criar departamento:', error)
    return { success: false, message: 'Falha ao cadastrar departamento.' }
  }
}

export async function alternarStatusDepartamento(id: string, ativo: boolean): Promise<ActionResult> {
  try {
    if (!id) {
      return { success: false, message: 'ID do departamento não informado.' }
    }

    await prisma.departamento.update({
      where: { id },
      data: { ativo },
    })

    revalidatePath('/')
    revalidatePath('/departamentos')

    return {
      success: true,
      message: `Departamento ${ativo ? 'ativado' : 'desativado'} com sucesso!`,
    }
  } catch (error) {
    console.error('Erro ao alterar status do departamento:', error)
    return { success: false, message: 'Falha ao atualizar status do departamento.' }
  }
}

// ----------------------------------------------------
// AÇÕES DE ORDENS DE SERVIÇO INTERNAS (INTEGRADAS COM USUÁRIO E RESPONSÁVEL)
// ----------------------------------------------------

export async function criarOrdemServico(formData: FormData): Promise<ActionResult<OrdemServicoDTO>> {
  try {
    const user = await getSessionUser()
    if (!user) {
      return { success: false, message: 'Você precisa estar logado para abrir uma ordem de serviço.' }
    }

    const titulo = (formData.get('titulo') as string)?.trim()
    const descricao = (formData.get('descricao') as string)?.trim()
    const departamentoOrigemId = (formData.get('departamentoOrigemId') as string)?.trim() || user.departamentoId
    const departamentoDestinoId = (formData.get('departamentoDestinoId') as string)?.trim()
    const responsavelId = (formData.get('responsavelId') as string)?.trim() || null
    const prioridade = (formData.get('prioridade') as PrioridadeOS) || 'MEDIA'

    if (!titulo || !descricao || !departamentoOrigemId || !departamentoDestinoId) {
      return {
        success: false,
        message: 'Preencha todos os campos obrigatórios (Título, Origem, Destino e Descrição).',
      }
    }

    // Anexos (prints) enviados como JSON de data URLs base64 já comprimidas no cliente
    const anexos = parseAnexos(formData.get('anexos'))

    const timestamp = Date.now().toString().slice(-6)
    const randomSuffix = Math.floor(100 + Math.random() * 900)
    const codigo = `OS-${timestamp}-${randomSuffix}`

    const novaOS = await prisma.ordemServico.create({
      data: {
        codigo,
        titulo,
        descricao,
        solicitanteId: user.id,
        responsavelId: responsavelId && responsavelId !== 'none' ? responsavelId : null,
        departamentoOrigemId,
        departamentoDestinoId,
        prioridade,
        status: 'ABERTA',
      },
      include: {
        solicitante: { select: { id: true, nome: true, email: true } },
        responsavel: { select: { id: true, nome: true, email: true } },
        departamentoOrigem: { select: { id: true, nome: true } },
        departamentoDestino: { select: { id: true, nome: true } },
      },
    })

    // Salva os anexos (Storage quando configurado; senão base64 no banco).
    if (anexos.length > 0) {
      await salvarAnexos(novaOS.id, anexos)
    }

    // Notifica a equipe do setor de destino sobre a nova OS.
    await notificar({
      destinatarios: await membrosDoSetor(departamentoDestinoId),
      excluir: user.id,
      ordemId: novaOS.id,
      tipo: 'NOVA_OS',
      titulo: `Nova OS para ${novaOS.departamentoDestino.nome}`,
      mensagem: `${novaOS.codigo} — ${novaOS.titulo}`,
    })

    revalidatePath('/')
    revalidatePath('/minhas-os')
    revalidatePath('/painel-setor')
    revalidatePath('/relatorios')

    return {
      success: true,
      message: `Ordem de Serviço ${codigo} registrada com sucesso!`,
      data: {
        id: novaOS.id,
        codigo: novaOS.codigo,
        titulo: novaOS.titulo,
        descricao: novaOS.descricao,
        status: novaOS.status,
        prioridade: novaOS.prioridade,
        solicitanteId: novaOS.solicitanteId,
        solicitante: novaOS.solicitante,
        responsavelId: novaOS.responsavelId,
        responsavel: novaOS.responsavel,
        departamentoOrigemId: novaOS.departamentoOrigemId,
        departamentoOrigem: novaOS.departamentoOrigem,
        departamentoDestinoId: novaOS.departamentoDestinoId,
        departamentoDestino: novaOS.departamentoDestino,
        criadoEm: novaOS.criadoEm.toISOString(),
        atualizadoEm: novaOS.atualizadoEm.toISOString(),
      },
    }
  } catch (error) {
    console.error('Erro ao criar ordem de serviço interna:', error)
    return {
      success: false,
      message: 'Ocorreu um erro ao registrar a Ordem de Serviço interna. Tente novamente.',
    }
  }
}

export async function listarOrdensServico(filterOptions?: {
  view?: 'minhas' | 'setor' | 'relatorios' | 'todas'
  userId?: string
  departamentoId?: string
}): Promise<OrdemServicoDTO[]> {
  try {
    const whereClause: Prisma.OrdemServicoWhereInput = {}

    // Escopo estrito e claro:
    if (filterOptions?.view === 'setor' && filterOptions?.departamentoId) {
      // Painel do Setor: TODAS as demandas direcionadas para a equipe do usuário logado atender
      whereClause.departamentoDestinoId = filterOptions.departamentoId
    } else if (filterOptions?.view === 'todas') {
      // Todas as demandas (usado em relatórios ou admin)
    } else if (filterOptions?.userId) {
      // Minhas OS (padrão): Exclusivamente chamados abertos pelo usuário logado
      whereClause.solicitanteId = filterOptions.userId
    }

    const ordens = await prisma.ordemServico.findMany({
      where: whereClause,
      orderBy: { criadoEm: 'desc' },
      include: {
        solicitante: { select: { id: true, nome: true, email: true } },
        responsavel: { select: { id: true, nome: true, email: true } },
        departamentoOrigem: { select: { id: true, nome: true } },
        departamentoDestino: { select: { id: true, nome: true } },
      },
    })

    return ordens.map((os) => ({
      id: os.id,
      codigo: os.codigo,
      titulo: os.titulo,
      descricao: os.descricao,
      status: os.status,
      prioridade: os.prioridade,
      solicitanteId: os.solicitanteId,
      solicitante: os.solicitante,
      responsavelId: os.responsavelId,
      responsavel: os.responsavel,
      departamentoOrigemId: os.departamentoOrigemId,
      departamentoOrigem: os.departamentoOrigem,
      departamentoDestinoId: os.departamentoDestinoId,
      departamentoDestino: os.departamentoDestino,
      criadoEm: os.criadoEm.toISOString(),
      atualizadoEm: os.atualizadoEm.toISOString(),
    }))
  } catch (error) {
    console.error('Erro ao listar ordens de serviço:', error)
    return []
  }
}

export async function obterOrdemPorId(id: string): Promise<OrdemServicoDTO | null> {
  try {
    if (!id) return null
    const os = await prisma.ordemServico.findUnique({
      where: { id },
      include: {
        solicitante: { select: { id: true, nome: true, email: true } },
        responsavel: { select: { id: true, nome: true, email: true } },
        departamentoOrigem: { select: { id: true, nome: true } },
        departamentoDestino: { select: { id: true, nome: true } },
      },
    })
    if (!os) return null
    return {
      id: os.id,
      codigo: os.codigo,
      titulo: os.titulo,
      descricao: os.descricao,
      status: os.status,
      prioridade: os.prioridade,
      solicitanteId: os.solicitanteId,
      solicitante: os.solicitante,
      responsavelId: os.responsavelId,
      responsavel: os.responsavel,
      departamentoOrigemId: os.departamentoOrigemId,
      departamentoOrigem: os.departamentoOrigem,
      departamentoDestinoId: os.departamentoDestinoId,
      departamentoDestino: os.departamentoDestino,
      criadoEm: os.criadoEm.toISOString(),
      atualizadoEm: os.atualizadoEm.toISOString(),
    }
  } catch (error) {
    console.error('Erro ao obter OS por id:', error)
    return null
  }
}

export async function atualizarStatusOS(
  id: string,
  novoStatus: StatusOS
): Promise<ActionResult> {
  try {
    if (!id || !novoStatus) {
      return { success: false, message: 'Dados inválidos para atualização.' }
    }

    const user = await getSessionUser()
    if (!user) {
      return { success: false, message: 'Você precisa estar logado para alterar o status.' }
    }

    const osAtual = await prisma.ordemServico.findUnique({
      where: { id },
      select: {
        status: true,
        departamentoDestinoId: true,
        responsavelId: true,
        solicitanteId: true,
        codigo: true,
      },
    })
    if (!osAtual) {
      return { success: false, message: 'Ordem de serviço não encontrada.' }
    }

    // Regra: OS concluída não pode mais ter o status alterado.
    if (osAtual.status === 'CONCLUIDA') {
      return {
        success: false,
        message: 'Esta OS está concluída e seu status não pode mais ser alterado.',
      }
    }

    // Regra: apenas o setor de destino (para quem a OS foi direcionada) pode
    // alterar o status — o dono/solicitante não altera o próprio chamado.
    if (user.departamentoId !== osAtual.departamentoDestinoId) {
      return {
        success: false,
        message: 'Apenas o setor de destino pode alterar o status desta OS.',
      }
    }

    const dadosAtualizacao: { status: StatusOS; responsavelId?: string } = {
      status: novoStatus,
    }

    // Regra: ao CONCLUIR uma OS sem responsável, o próprio usuário que a conclui
    // é registrado como responsável técnico. OS já atribuídas mantêm o original.
    if (novoStatus === 'CONCLUIDA' && !osAtual.responsavelId) {
      dadosAtualizacao.responsavelId = user.id
    }

    await prisma.ordemServico.update({
      where: { id },
      data: dadosAtualizacao,
    })

    // Notifica o dono (solicitante) sobre a mudança de status da sua OS.
    await notificar({
      destinatarios: [osAtual.solicitanteId],
      excluir: user.id,
      ordemId: id,
      tipo: 'STATUS',
      titulo: `Status atualizado — ${osAtual.codigo}`,
      mensagem: `Sua OS agora está: ${STATUS_LABEL[novoStatus] || novoStatus}.`,
    })

    revalidatePath('/')
    revalidatePath('/minhas-os')
    revalidatePath('/painel-setor')
    revalidatePath('/relatorios')
    return { success: true, message: 'Status atualizado com sucesso!' }
  } catch (error) {
    console.error('Erro ao atualizar status da OS:', error)
    return { success: false, message: 'Falha ao atualizar status da OS.' }
  }
}

export async function atribuirResponsavelOS(
  id: string,
  responsavelId: string | null
): Promise<ActionResult> {
  try {
    if (!id) return { success: false, message: 'ID da OS não informado.' }

    const user = await getSessionUser()
    const novoResp = responsavelId && responsavelId !== 'none' ? responsavelId : null

    const os = await prisma.ordemServico.findUnique({
      where: { id },
      select: { solicitanteId: true, codigo: true },
    })

    await prisma.ordemServico.update({
      where: { id },
      data: { responsavelId: novoResp },
    })

    // Notifica o dono e (quando houver) o técnico atribuído.
    if (os) {
      let nomeResp = ''
      if (novoResp) {
        const r = await prisma.usuario.findUnique({ where: { id: novoResp }, select: { nome: true } })
        nomeResp = r?.nome || 'um técnico'
      }
      await notificar({
        destinatarios: [os.solicitanteId],
        excluir: user?.id,
        ordemId: id,
        tipo: 'RESPONSAVEL',
        titulo: `Responsável definido — ${os.codigo}`,
        mensagem: novoResp
          ? `${nomeResp} agora é responsável pela sua OS.`
          : 'Sua OS voltou para a fila geral do setor.',
      })
      if (novoResp) {
        await notificar({
          destinatarios: [novoResp],
          excluir: user?.id,
          ordemId: id,
          tipo: 'RESPONSAVEL',
          titulo: `Você foi atribuído — ${os.codigo}`,
          mensagem: 'Você é o responsável técnico desta OS.',
        })
      }
    }

    revalidatePath('/')
    revalidatePath('/minhas-os')
    revalidatePath('/painel-setor')
    revalidatePath('/relatorios')
    return { success: true, message: 'Responsável técnico atualizado com sucesso!' }
  } catch (error) {
    console.error('Erro ao atribuir responsável:', error)
    return { success: false, message: 'Falha ao atualizar responsável da OS.' }
  }
}

export async function excluirOrdemServico(id: string): Promise<ActionResult> {
  try {
    if (!id) {
      return { success: false, message: 'ID da OS não informado.' }
    }

    const user = await getSessionUser()
    if (!user) {
      return { success: false, message: 'Você precisa estar logado para excluir.' }
    }

    const osAtual = await prisma.ordemServico.findUnique({
      where: { id },
      select: { status: true, solicitanteId: true },
    })
    if (!osAtual) {
      return { success: false, message: 'Ordem de serviço não encontrada.' }
    }

    // Regra: apenas o dono (solicitante) da OS ou um ADMIN podem excluir.
    if (user.role !== 'ADMIN' && osAtual.solicitanteId !== user.id) {
      return {
        success: false,
        message: 'Apenas quem abriu a OS ou um administrador pode excluí-la.',
      }
    }

    // Regra: OS concluídas não podem ser excluídas
    // (preserva o histórico e a integridade dos relatórios de produtividade).
    if (osAtual.status === 'CONCLUIDA') {
      return {
        success: false,
        message: 'Não é possível excluir uma OS concluída. O histórico é preservado para os relatórios.',
      }
    }

    // Remove os arquivos do Storage antes de apagar a OS (o cascade do banco
    // remove as linhas de anexo, mas não os arquivos no bucket).
    const anexos = await prisma.anexoOS.findMany({
      where: { ordemId: id },
      select: { storagePath: true },
    })
    await Promise.all(
      anexos
        .filter((a) => a.storagePath)
        .map((a) => removerAnexoStorage(a.storagePath as string))
    )

    await prisma.ordemServico.delete({
      where: { id },
    })

    revalidatePath('/')
    revalidatePath('/minhas-os')
    revalidatePath('/painel-setor')
    revalidatePath('/relatorios')
    return { success: true, message: 'Ordem de serviço removida com sucesso!' }
  } catch (error) {
    console.error('Erro ao excluir OS:', error)
    return { success: false, message: 'Falha ao excluir ordem de serviço.' }
  }
}

export async function listarTodosUsuarios(): Promise<UsuarioDTO[]> {
  try {
    const usuarios = await prisma.usuario.findMany({
      orderBy: { nome: 'asc' },
      select: {
        id: true,
        nome: true,
        email: true,
        departamentoId: true,
        role: true,
      },
    })
    return usuarios
  } catch (error) {
    console.error('Erro ao listar todos os usuários:', error)
    return []
  }
}

export async function listarUsuariosParaAdmin(): Promise<UsuarioAdminDTO[]> {
  try {
    await requireAdmin()
    const usuarios = await prisma.usuario.findMany({
      orderBy: { nome: 'asc' },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        departamentoId: true,
        departamento: {
          select: { nome: true },
        },
        criadoEm: true,
      },
    })
    return usuarios.map((u) => ({
      id: u.id,
      nome: u.nome,
      email: u.email,
      role: u.role as 'ADMIN' | 'MEMBRO',
      departamentoId: u.departamentoId,
      departamento: { nome: u.departamento.nome },
      criadoEm: u.criadoEm?.toISOString(),
    }))
  } catch (error) {
    console.error('Erro ao listar usuários para admin:', error)
    return []
  }
}

export async function alternarRoleUsuario(
  usuarioId: string,
  novoRole: 'ADMIN' | 'MEMBRO'
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin()
    if (!usuarioId) return { success: false, message: 'ID do usuário não informado.' }

    // Se estiver despromovendo a si mesmo, verificar se ainda há outros admins
    if (admin.id === usuarioId && novoRole !== 'ADMIN') {
      const totalAdmins = await prisma.usuario.count({
        where: { role: UserRole.ADMIN },
      })
      if (totalAdmins <= 1) {
        return {
          success: false,
          message:
            'Não é possível remover seu próprio privilégio de ADMIN pois você é o único administrador cadastrado no sistema.',
        }
      }
    }

    await prisma.usuario.update({
      where: { id: usuarioId },
      data: { role: novoRole === 'ADMIN' ? UserRole.ADMIN : UserRole.MEMBRO },
    })

    revalidatePath('/departamentos')
    revalidatePath('/')
    return {
      success: true,
      message: `Papel de acesso atualizado com sucesso para ${novoRole === 'ADMIN' ? 'Administrador (ADMIN)' : 'Membro Comum (MEMBRO)'}!`,
    }
  } catch (error) {
    console.error('Erro ao alternar role do usuário:', error)
    return { success: false, message: 'Falha ao atualizar papel do usuário.' }
  }
}

export async function alterarSetorUsuario(
  usuarioId: string,
  departamentoId: string
): Promise<ActionResult> {
  try {
    await requireAdmin()
    if (!usuarioId || !departamentoId) {
      return { success: false, message: 'Usuário e setor são obrigatórios.' }
    }

    const departamento = await prisma.departamento.findUnique({
      where: { id: departamentoId },
      select: { id: true, nome: true },
    })
    if (!departamento) {
      return { success: false, message: 'Setor informado não existe.' }
    }

    const usuario = await prisma.usuario.update({
      where: { id: usuarioId },
      data: { departamentoId },
      select: { nome: true },
    })

    revalidatePath('/departamentos')
    revalidatePath('/')
    return {
      success: true,
      message: `Setor de ${usuario.nome} alterado para ${departamento.nome}.`,
    }
  } catch (error) {
    console.error('Erro ao alterar setor do usuário:', error)
    return { success: false, message: 'Falha ao alterar o setor do colaborador.' }
  }
}

// ----------------------------------------------------
// NOTIFICAÇÕES
// ----------------------------------------------------

const STATUS_LABEL: Record<string, string> = {
  ABERTA: 'Aberta',
  EM_ANDAMENTO: 'Em andamento',
  AGUARDANDO_RESPOSTA: 'Aguardando resposta',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
}

/** IDs dos usuários de um setor (para notificar a equipe de destino). */
async function membrosDoSetor(departamentoId: string): Promise<string[]> {
  const membros = await prisma.usuario.findMany({
    where: { departamentoId },
    select: { id: true },
  })
  return membros.map((m) => m.id)
}

/**
 * Cria notificações para uma lista de destinatários.
 * Remove duplicados, vazios e o ator (quem realizou a ação) — ninguém é
 * notificado do próprio ato. Falhas aqui nunca quebram a ação principal.
 */
async function notificar(params: {
  destinatarios: (string | null | undefined)[]
  excluir?: string | null
  ordemId: string
  tipo: string
  titulo: string
  mensagem: string
}): Promise<void> {
  try {
    const ids = Array.from(
      new Set(params.destinatarios.filter((d): d is string => !!d && d !== params.excluir))
    )
    if (ids.length === 0) return
    await prisma.notificacao.createMany({
      data: ids.map((usuarioId) => ({
        usuarioId,
        ordemId: params.ordemId,
        tipo: params.tipo,
        titulo: params.titulo,
        mensagem: params.mensagem,
      })),
    })
  } catch (e) {
    console.error('Falha ao gerar notificações:', e)
  }
}

/**
 * Notifica sobre uma alteração feita na OS (comentário/anexo):
 * - se quem alterou é o dono, avisa a equipe do setor de destino (+ responsável);
 * - caso contrário, avisa o dono da OS.
 */
async function notificarMudancaOS(params: {
  ordemId: string
  atorId: string
  tipo: string
  titulo: (codigo: string) => string
  mensagem: string
}): Promise<void> {
  const os = await prisma.ordemServico.findUnique({
    where: { id: params.ordemId },
    select: {
      solicitanteId: true,
      departamentoDestinoId: true,
      responsavelId: true,
      codigo: true,
    },
  })
  if (!os) return
  const ehDono = os.solicitanteId === params.atorId
  const destinatarios = ehDono
    ? [...(await membrosDoSetor(os.departamentoDestinoId)), os.responsavelId]
    : [os.solicitanteId]
  await notificar({
    destinatarios,
    excluir: params.atorId,
    ordemId: params.ordemId,
    tipo: params.tipo,
    titulo: params.titulo(os.codigo),
    mensagem: params.mensagem,
  })
}

export async function listarNotificacoes(): Promise<NotificacaoDTO[]> {
  try {
    const user = await getSessionUser()
    if (!user) return []
    const notifs = await prisma.notificacao.findMany({
      where: { usuarioId: user.id },
      orderBy: { criadoEm: 'desc' },
      take: 20,
      include: { ordem: { select: { codigo: true } } },
    })
    return notifs.map((n) => ({
      id: n.id,
      tipo: n.tipo,
      titulo: n.titulo,
      mensagem: n.mensagem,
      lida: n.lida,
      criadoEm: n.criadoEm.toISOString(),
      ordemId: n.ordemId,
      ordemCodigo: n.ordem?.codigo ?? null,
    }))
  } catch (error) {
    console.error('Erro ao listar notificações:', error)
    return []
  }
}

export async function contarNotificacoesNaoLidas(): Promise<number> {
  try {
    const user = await getSessionUser()
    if (!user) return 0
    return await prisma.notificacao.count({ where: { usuarioId: user.id, lida: false } })
  } catch (error) {
    console.error('Erro ao contar notificações:', error)
    return 0
  }
}

export async function marcarNotificacaoLida(id: string): Promise<ActionResult> {
  try {
    const user = await getSessionUser()
    if (!user) return { success: false, message: 'Não autenticado.' }
    if (!id) return { success: false, message: 'Notificação inválida.' }
    // updateMany com filtro de dono garante que ninguém marque a de outro
    await prisma.notificacao.updateMany({
      where: { id, usuarioId: user.id },
      data: { lida: true },
    })
    return { success: true }
  } catch (error) {
    console.error('Erro ao marcar notificação:', error)
    return { success: false, message: 'Falha ao marcar notificação.' }
  }
}

export async function marcarTodasNotificacoesLidas(): Promise<ActionResult> {
  try {
    const user = await getSessionUser()
    if (!user) return { success: false, message: 'Não autenticado.' }
    await prisma.notificacao.updateMany({
      where: { usuarioId: user.id, lida: false },
      data: { lida: true },
    })
    return { success: true, message: 'Notificações marcadas como lidas.' }
  } catch (error) {
    console.error('Erro ao marcar todas as notificações:', error)
    return { success: false, message: 'Falha ao atualizar notificações.' }
  }
}

// ----------------------------------------------------
// AÇÕES DE COMENTÁRIOS E ANEXOS (PRINTS) DAS OS
// ----------------------------------------------------

const MAX_ANEXOS = 8
const MAX_ANEXO_LEN = 7_000_000 // ~5MB por arquivo em base64

function parseAnexos(raw: FormDataEntryValue | null): { dados: string; nome: string | null }[] {
  if (typeof raw !== 'string' || !raw) return []
  try {
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return []
    return arr
      .map((a) => {
        if (typeof a === 'string') return { dados: a, nome: null }
        if (a && typeof a.dados === 'string')
          return { dados: a.dados, nome: typeof a.nome === 'string' ? a.nome : null }
        return null
      })
      .filter(
        (a): a is { dados: string; nome: string | null } =>
          !!a &&
          a.dados.startsWith('data:') &&
          tipoAnexoPermitido(mimeDeDataUrl(a.dados)) &&
          a.dados.length <= MAX_ANEXO_LEN
      )
      .slice(0, MAX_ANEXOS)
  } catch {
    return []
  }
}

/** Tamanho aproximado (bytes) de um data URL base64. */
function bytesDeDataUrl(dataUrl: string): number {
  const b64 = dataUrl.split(',')[1] || ''
  return Math.floor((b64.length * 3) / 4)
}

/**
 * Salva anexos de uma OS. Usa o Supabase Storage quando configurado
 * (guarda só o caminho); senão faz fallback para base64 no banco (retrocompatível).
 */
async function salvarAnexos(
  ordemId: string,
  anexos: { dados: string; nome: string | null }[]
): Promise<void> {
  const usarStorage = storageConfigurado()
  for (const a of anexos) {
    try {
      const tamanho = bytesDeDataUrl(a.dados)
      if (usarStorage) {
        const path = await uploadAnexoDataUrl(a.dados, ordemId, a.nome)
        await prisma.anexoOS.create({ data: { ordemId, storagePath: path, nome: a.nome, tamanho } })
      } else {
        await prisma.anexoOS.create({ data: { ordemId, dados: a.dados, nome: a.nome, tamanho } })
      }
    } catch (e) {
      console.error('Falha ao salvar anexo da OS', ordemId, e)
      // segue para os demais anexos sem abortar a OS inteira
    }
  }
}

/** Monta o DTO de um anexo (gera URL assinada quando vem do Storage). */
async function montarAnexoDTO(a: {
  id: string
  dados: string | null
  storagePath: string | null
  nome: string | null
  tamanho: number | null
  criadoEm: Date
}): Promise<AnexoDTO> {
  let url = ''
  let isImagem = false
  if (a.storagePath) {
    url = (await urlAssinada(a.storagePath)) || ''
    isImagem = ehImagemPorExtensao(a.storagePath) || ehImagemPorExtensao(a.nome)
  } else if (a.dados) {
    url = a.dados
    isImagem = a.dados.startsWith('data:image/')
  }
  return {
    id: a.id,
    url,
    nome: a.nome,
    isImagem,
    tamanho: a.tamanho ?? (a.dados ? bytesDeDataUrl(a.dados) : null),
    criadoEm: a.criadoEm.toISOString(),
  }
}

export async function obterDetalhesOS(ordemId: string): Promise<DetalhesOSDTO> {
  try {
    if (!ordemId) return { comentarios: [], anexos: [] }
    const [comentarios, anexos] = await Promise.all([
      prisma.comentarioOS.findMany({
        where: { ordemId },
        orderBy: { criadoEm: 'asc' },
        include: { autor: { select: { id: true, nome: true, email: true } } },
      }),
      prisma.anexoOS.findMany({ where: { ordemId }, orderBy: { criadoEm: 'asc' } }),
    ])
    return {
      comentarios: comentarios.map((c) => ({
        id: c.id,
        texto: c.texto,
        criadoEm: c.criadoEm.toISOString(),
        autor: c.autor,
      })),
      anexos: await Promise.all(anexos.map((a) => montarAnexoDTO(a))),
    }
  } catch (error) {
    console.error('Erro ao obter detalhes da OS:', error)
    return { comentarios: [], anexos: [] }
  }
}

export async function adicionarComentario(
  ordemId: string,
  texto: string
): Promise<ActionResult<ComentarioDTO>> {
  try {
    const user = await getSessionUser()
    if (!user) return { success: false, message: 'Você precisa estar logado.' }
    const t = texto?.trim()
    if (!ordemId || !t) return { success: false, message: 'Escreva um comentário.' }
    if (t.length > 5000) return { success: false, message: 'Comentário muito longo (máx. 5000 caracteres).' }

    const c = await prisma.comentarioOS.create({
      data: { ordemId, autorId: user.id, texto: t },
      include: { autor: { select: { id: true, nome: true, email: true } } },
    })

    await notificarMudancaOS({
      ordemId,
      atorId: user.id,
      tipo: 'COMENTARIO',
      titulo: (cod) => `Novo comentário — ${cod}`,
      mensagem: `${user.nome}: ${t.slice(0, 80)}${t.length > 80 ? '…' : ''}`,
    })

    revalidatePath('/')
    return {
      success: true,
      data: { id: c.id, texto: c.texto, criadoEm: c.criadoEm.toISOString(), autor: c.autor },
    }
  } catch (error) {
    console.error('Erro ao adicionar comentário:', error)
    return { success: false, message: 'Falha ao adicionar comentário.' }
  }
}

export async function adicionarAnexoOS(
  ordemId: string,
  dados: string,
  nome?: string
): Promise<ActionResult<AnexoDTO>> {
  try {
    const user = await getSessionUser()
    if (!user) return { success: false, message: 'Você precisa estar logado.' }
    if (!ordemId || !dados) return { success: false, message: 'Arquivo inválido.' }
    if (!dados.startsWith('data:') || !tipoAnexoPermitido(mimeDeDataUrl(dados)))
      return { success: false, message: 'Tipo de arquivo não permitido.' }
    if (dados.length > MAX_ANEXO_LEN) return { success: false, message: 'O arquivo é muito grande (máx. ~5MB).' }

    const total = await prisma.anexoOS.count({ where: { ordemId } })
    if (total >= MAX_ANEXOS) return { success: false, message: `Limite de ${MAX_ANEXOS} anexos por OS atingido.` }

    const nomeArquivo = nome?.slice(0, 200) || null
    const tamanho = bytesDeDataUrl(dados)

    let a
    if (storageConfigurado()) {
      const path = await uploadAnexoDataUrl(dados, ordemId, nomeArquivo)
      a = await prisma.anexoOS.create({ data: { ordemId, storagePath: path, nome: nomeArquivo, tamanho } })
    } else {
      a = await prisma.anexoOS.create({ data: { ordemId, dados, nome: nomeArquivo, tamanho } })
    }

    await notificarMudancaOS({
      ordemId,
      atorId: user.id,
      tipo: 'ANEXO',
      titulo: (cod) => `Novo anexo — ${cod}`,
      mensagem: `${user.nome} anexou um arquivo${nomeArquivo ? `: ${nomeArquivo}` : ''}.`,
    })

    revalidatePath('/')
    return { success: true, data: await montarAnexoDTO(a) }
  } catch (error) {
    console.error('Erro ao adicionar anexo:', error)
    return { success: false, message: 'Falha ao anexar o arquivo.' }
  }
}

export async function excluirComentario(id: string): Promise<ActionResult> {
  try {
    const user = await getSessionUser()
    if (!user) return { success: false, message: 'Não autenticado.' }
    const c = await prisma.comentarioOS.findUnique({ where: { id }, select: { autorId: true } })
    if (!c) return { success: false, message: 'Comentário não encontrado.' }
    if (c.autorId !== user.id && user.role !== 'ADMIN') {
      return { success: false, message: 'Você só pode excluir seus próprios comentários.' }
    }
    await prisma.comentarioOS.delete({ where: { id } })
    revalidatePath('/')
    return { success: true, message: 'Comentário removido.' }
  } catch (error) {
    console.error('Erro ao excluir comentário:', error)
    return { success: false, message: 'Falha ao excluir comentário.' }
  }
}

export async function excluirAnexoOS(id: string): Promise<ActionResult> {
  try {
    const user = await getSessionUser()
    if (!user) return { success: false, message: 'Não autenticado.' }
    if (!id) return { success: false, message: 'Anexo inválido.' }

    const anexo = await prisma.anexoOS.findUnique({ where: { id }, select: { storagePath: true } })
    if (anexo?.storagePath) {
      await removerAnexoStorage(anexo.storagePath)
    }

    await prisma.anexoOS.delete({ where: { id } })
    revalidatePath('/')
    return { success: true, message: 'Anexo removido.' }
  } catch (error) {
    console.error('Erro ao excluir anexo:', error)
    return { success: false, message: 'Falha ao remover o anexo.' }
  }
}

// ----------------------------------------------------
// AÇÕES DE PERFIL DO COLABORADOR
// ----------------------------------------------------

export async function atualizarPerfil(formData: FormData): Promise<ActionResult> {
  try {
    const user = await getSessionUser()
    if (!user) {
      return { success: false, message: 'Sessão expirada. Faça login novamente.' }
    }

    const nome = (formData.get('nome') as string)?.trim()
    const email = (formData.get('email') as string)?.trim().toLowerCase()
    const senha = (formData.get('senha') as string)?.trim()
    const fotoUrlRaw = formData.get('fotoUrl')
    const fotoUrl = typeof fotoUrlRaw === 'string' ? fotoUrlRaw.trim() : ''

    if (!nome || !email) {
      return { success: false, message: 'Nome e e-mail são obrigatórios.' }
    }

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    if (!emailValido) {
      return { success: false, message: 'Informe um e-mail válido.' }
    }

    // Garante e-mail único (exceto o do próprio usuário)
    const emailEmUso = await prisma.usuario.findFirst({
      where: { email, NOT: { id: user.id } },
      select: { id: true },
    })
    if (emailEmUso) {
      return { success: false, message: 'Este e-mail já está em uso por outro colaborador.' }
    }

    // Limite de segurança para a imagem em base64 (~5MB de arquivo original)
    if (fotoUrl && fotoUrl.length > 7_000_000) {
      return { success: false, message: 'A imagem é muito grande. Escolha uma foto de até 5MB.' }
    }

    const dados: { nome: string; email: string; fotoUrl: string | null; senha?: string } = {
      nome,
      email,
      fotoUrl: fotoUrl || null,
    }

    if (senha) {
      if (senha.length < 6) {
        return { success: false, message: 'A nova senha deve conter no mínimo 6 caracteres.' }
      }
      dados.senha = await bcrypt.hash(senha, 10)
    }

    await prisma.usuario.update({
      where: { id: user.id },
      data: dados,
    })

    revalidatePath('/')
    revalidatePath('/perfil')
    revalidatePath('/departamentos')
    return { success: true, message: 'Perfil atualizado com sucesso!' }
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error)
    return { success: false, message: 'Falha ao atualizar o perfil. Tente novamente.' }
  }
}

// ----------------------------------------------------
// AÇÕES DE RELATÓRIOS E PRODUTIVIDADE
// ----------------------------------------------------

export async function obterDadosRelatorioProdutividade(filtros?: {
  departamentoId?: string
  responsavelId?: string
  mesAno?: string // "YYYY-MM"
  status?: string
  prioridade?: string
}): Promise<RelatorioProdutividadeDTO> {
  try {
    const whereClause: Prisma.OrdemServicoWhereInput = {}

    if (filtros?.departamentoId && filtros.departamentoId !== 'TODOS') {
      whereClause.departamentoDestinoId = filtros.departamentoId
    }

    if (filtros?.responsavelId && filtros.responsavelId !== 'TODOS') {
      if (filtros.responsavelId === 'SEM_RESPONSAVEL') {
        whereClause.responsavelId = null
      } else {
        whereClause.responsavelId = filtros.responsavelId
      }
    }

    if (filtros?.status && filtros.status !== 'TODOS') {
      whereClause.status = filtros.status as StatusOS
    }

    if (filtros?.prioridade && filtros.prioridade !== 'TODAS') {
      whereClause.prioridade = filtros.prioridade as PrioridadeOS
    }

    if (filtros?.mesAno) {
      const [yearStr, monthStr] = filtros.mesAno.split('-')
      const year = parseInt(yearStr, 10)
      const month = parseInt(monthStr, 10) - 1
      const startDate = new Date(year, month, 1)
      const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999)
      whereClause.criadoEm = {
        gte: startDate,
        lte: endDate,
      }
    }

    const ordens = await prisma.ordemServico.findMany({
      where: whereClause,
      orderBy: { criadoEm: 'desc' },
      include: {
        solicitante: { select: { id: true, nome: true, email: true } },
        responsavel: { select: { id: true, nome: true, email: true } },
        departamentoOrigem: { select: { id: true, nome: true } },
        departamentoDestino: { select: { id: true, nome: true } },
      },
    })

    // Agrupar por prestador/responsável
    const responsavelMap: Record<
      string,
      {
        responsavelId: string | null
        responsavelNome: string
        departamentoNome: string
        totalOS: number
        concluidas: number
        emAndamento: number
        abertas: number
        somaHorasConclusao: number
      }
    > = {}

    ordens.forEach((os) => {
      const key = os.responsavelId || 'SEM_RESPONSAVEL'
      const nome = os.responsavel?.nome || 'Não Atribuído / Fila Geral'
      const depNome = os.departamentoDestino.nome

      if (!responsavelMap[key]) {
        responsavelMap[key] = {
          responsavelId: os.responsavelId,
          responsavelNome: nome,
          departamentoNome: depNome,
          totalOS: 0,
          concluidas: 0,
          emAndamento: 0,
          abertas: 0,
          somaHorasConclusao: 0,
        }
      }

      responsavelMap[key].totalOS++

      if (os.status === 'CONCLUIDA') {
        responsavelMap[key].concluidas++
        const diffMs = os.atualizadoEm.getTime() - os.criadoEm.getTime()
        const diffHours = Math.max(0.5, diffMs / (1000 * 60 * 60))
        responsavelMap[key].somaHorasConclusao += diffHours
      } else if (os.status === 'EM_ANDAMENTO' || os.status === 'AGUARDANDO_RESPOSTA') {
        responsavelMap[key].emAndamento++
      } else if (os.status === 'ABERTA') {
        responsavelMap[key].abertas++
      }
    })

    const itens: ProdutividadeItemDTO[] = Object.values(responsavelMap).map((item) => {
      const mediaHoras = item.concluidas > 0 ? item.somaHorasConclusao / item.concluidas : 0
      let formatado = '-'
      if (mediaHoras > 0) {
        if (mediaHoras < 24) {
          formatado = `${mediaHoras.toFixed(1)} h`
        } else {
          formatado = `${(mediaHoras / 24).toFixed(1)} d`
        }
      }

      return {
        responsavelId: item.responsavelId,
        responsavelNome: item.responsavelNome,
        departamentoNome: item.departamentoNome,
        totalOS: item.totalOS,
        concluidas: item.concluidas,
        emAndamento: item.emAndamento,
        abertas: item.abertas,
        tempoMedioHoras: mediaHoras,
        tempoMedioFormatado: formatado,
      }
    })

    // Ordenar por concluídas decrescente
    itens.sort((a, b) => b.concluidas - a.concluidas)

    const totalOS = ordens.length
    const totalConcluidas = ordens.filter((os) => os.status === 'CONCLUIDA').length
    const taxaResolucao = totalOS > 0 ? Math.round((totalConcluidas / totalOS) * 100) : 0

    let somaHorasGerais = 0
    ordens.forEach((os) => {
      if (os.status === 'CONCLUIDA') {
        const diffMs = os.atualizadoEm.getTime() - os.criadoEm.getTime()
        somaHorasGerais += Math.max(0.5, diffMs / (1000 * 60 * 60))
      }
    })

    const mediaGeralHoras = totalConcluidas > 0 ? somaHorasGerais / totalConcluidas : 0
    let tempoMedioGeralFormatado = '-'
    if (mediaGeralHoras > 0) {
      if (mediaGeralHoras < 24) {
        tempoMedioGeralFormatado = `${mediaGeralHoras.toFixed(1)} h`
      } else {
        tempoMedioGeralFormatado = `${(mediaGeralHoras / 24).toFixed(1)} d`
      }
    }

    let depNomeFiltro = 'Todos os Departamentos'
    if (filtros?.departamentoId && filtros.departamentoId !== 'TODOS') {
      const d = await prisma.departamento.findUnique({ where: { id: filtros.departamentoId } })
      if (d) depNomeFiltro = d.nome
    }

    const ordensDetalhe: OrdemServicoDTO[] = ordens.map((os) => ({
      id: os.id,
      codigo: os.codigo,
      titulo: os.titulo,
      descricao: os.descricao,
      status: os.status,
      prioridade: os.prioridade,
      solicitanteId: os.solicitanteId,
      solicitante: os.solicitante,
      responsavelId: os.responsavelId,
      responsavel: os.responsavel,
      departamentoOrigemId: os.departamentoOrigemId,
      departamentoOrigem: os.departamentoOrigem,
      departamentoDestinoId: os.departamentoDestinoId,
      departamentoDestino: os.departamentoDestino,
      criadoEm: os.criadoEm.toISOString(),
      atualizadoEm: os.atualizadoEm.toISOString(),
    }))

    return {
      periodo: filtros?.mesAno || 'Período Completo',
      departamentoId: filtros?.departamentoId || null,
      departamentoNome: depNomeFiltro,
      geradoEm: new Date().toISOString(),
      totalOS,
      totalConcluidas,
      taxaResolucao,
      tempoMedioGeralFormatado,
      itens,
      ordensDetalhe,
    }
  } catch (error) {
    console.error('Erro ao obter relatório de produtividade:', error)
    return {
      periodo: 'Atual',
      departamentoId: null,
      departamentoNome: 'Todos',
      geradoEm: new Date().toISOString(),
      totalOS: 0,
      totalConcluidas: 0,
      taxaResolucao: 0,
      tempoMedioGeralFormatado: '-',
      itens: [],
      ordensDetalhe: [],
    }
  }
}

export async function gerarRelatorio(tipo: 'MINHAS_OS' | 'SETOR' | 'GERAL', customTitulo?: string): Promise<ActionResult<RelatorioDTO>> {
  try {
    const user = await getSessionUser()
    if (!user) {
      return { success: false, message: 'Usuário não autenticado.' }
    }

    const whereClause: Prisma.OrdemServicoWhereInput = {}
    let tituloPadrao = ''
    let departamentoId: string | null = null

    if (tipo === 'MINHAS_OS') {
      whereClause.solicitanteId = user.id
      tituloPadrao = `Relatório de Minhas Solicitações - ${user.nome}`
      departamentoId = user.departamentoId
    } else if (tipo === 'SETOR') {
      whereClause.departamentoDestinoId = user.departamentoId
      tituloPadrao = `Relatório de Atendimento do Setor (${user.departamentoNome})`
      departamentoId = user.departamentoId
    } else {
      tituloPadrao = `Relatório Geral de Ordens de Serviço Orflie`
    }

    const ordens = await prisma.ordemServico.findMany({
      where: whereClause,
      include: {
        departamentoOrigem: { select: { nome: true } },
        departamentoDestino: { select: { nome: true } },
        solicitante: { select: { nome: true } },
      },
    })

    const totalOS = ordens.length
    const abertas = ordens.filter((os) => os.status === 'ABERTA').length
    const emAndamento = ordens.filter((os) => os.status === 'EM_ANDAMENTO' || os.status === 'AGUARDANDO_RESPOSTA').length
    const concluidas = ordens.filter((os) => os.status === 'CONCLUIDA').length
    const canceladas = ordens.filter((os) => os.status === 'CANCELADA').length

    const timestamp = Date.now().toString().slice(-5)
    const codigo = `REL-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${timestamp}`

    const dadosJson = JSON.stringify({
      geradoEm: new Date().toISOString(),
      geradoPor: user.nome,
      departamento: user.departamentoNome,
      amostraOS: ordens.slice(0, 15).map((os) => ({
        codigo: os.codigo,
        titulo: os.titulo,
        origem: os.departamentoOrigem.nome,
        destino: os.departamentoDestino.nome,
        status: os.status,
        prioridade: os.prioridade,
      })),
    })

    const relatorio = await prisma.relatorio.create({
      data: {
        codigo,
        titulo: customTitulo || tituloPadrao,
        tipo,
        departamentoId,
        autorId: user.id,
        totalOS,
        abertas,
        emAndamento,
        concluidas,
        canceladas,
        dadosJson,
      },
      include: {
        autor: { select: { id: true, nome: true, email: true } },
        departamento: { select: { id: true, nome: true } },
      },
    })

    revalidatePath('/')
    revalidatePath('/relatorios')

    return {
      success: true,
      message: `Relatório ${codigo} gerado com sucesso!`,
      data: {
        id: relatorio.id,
        codigo: relatorio.codigo,
        titulo: relatorio.titulo,
        tipo: relatorio.tipo as 'MINHAS_OS' | 'SETOR' | 'GERAL',
        departamentoId: relatorio.departamentoId,
        departamento: relatorio.departamento,
        autorId: relatorio.autorId,
        autor: relatorio.autor,
        totalOS: relatorio.totalOS,
        abertas: relatorio.abertas,
        emAndamento: relatorio.emAndamento,
        concluidas: relatorio.concluidas,
        canceladas: relatorio.canceladas,
        taxaResolucao: relatorio.totalOS > 0 ? Math.round((relatorio.concluidas / relatorio.totalOS) * 100) : 0,
        dadosJson: relatorio.dadosJson,
        criadoEm: relatorio.criadoEm.toISOString(),
      },
    }
  } catch (error) {
    console.error('Erro ao gerar relatório:', error)
    return { success: false, message: 'Falha ao processar e salvar o relatório.' }
  }
}

export async function listarRelatorios(): Promise<RelatorioDTO[]> {
  try {
    const relatorios = await prisma.relatorio.findMany({
      orderBy: { criadoEm: 'desc' },
      include: {
        autor: { select: { id: true, nome: true, email: true } },
        departamento: { select: { id: true, nome: true } },
      },
    })

    return relatorios.map((r) => ({
      id: r.id,
      codigo: r.codigo,
      titulo: r.titulo,
      tipo: r.tipo as 'MINHAS_OS' | 'SETOR' | 'GERAL',
      departamentoId: r.departamentoId,
      departamento: r.departamento,
      autorId: r.autorId,
      autor: r.autor,
      totalOS: r.totalOS,
      abertas: r.abertas,
      emAndamento: r.emAndamento,
      concluidas: r.concluidas,
      canceladas: r.canceladas,
      taxaResolucao: r.totalOS > 0 ? Math.round((r.concluidas / r.totalOS) * 100) : 0,
      dadosJson: r.dadosJson,
      criadoEm: r.criadoEm.toISOString(),
    }))
  } catch (error) {
    console.error('Erro ao listar relatórios:', error)
    return []
  }
}

export async function excluirRelatorio(id: string): Promise<ActionResult> {
  try {
    if (!id) return { success: false, message: 'ID do relatório não informado.' }

    await prisma.relatorio.delete({
      where: { id },
    })

    revalidatePath('/')
    revalidatePath('/relatorios')
    return { success: true, message: 'Relatório excluído com sucesso!' }
  } catch (error) {
    console.error('Erro ao excluir relatório:', error)
    return { success: false, message: 'Falha ao excluir relatório.' }
  }
}