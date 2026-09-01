import { PrismaClient, UserRole, StatusOS, PrioridadeOS } from '../src/generated/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const departamentosIniciais = [
  'Comercial',
  'Diretoria',
  'Financeiro',
  'Marketing',
  'Operações',
  'Recursos Humanos (RH)',
  'Tecnologia da Informação (TI)',
]

async function seed() {
  console.log('Populando departamentos e usuários iniciais...')

  // 1. Departamentos
  const depsMap: Record<string, string> = {}
  for (const nome of departamentosIniciais) {
    const dep = await prisma.departamento.upsert({
      where: { nome },
      update: { ativo: true },
      create: { nome, ativo: true },
    })
    depsMap[nome] = dep.id
    console.log(`Setor OK: ${dep.nome} (${dep.id})`)
  }

  // 2. Senhas com hash
  const adminPasswordHash = await bcrypt.hash('admin123', 10)
  const memberPasswordHash = await bcrypt.hash('membro123', 10)

  // 3. Usuários
  const adminUser = await prisma.usuario.upsert({
    where: { email: 'admin@orflie.com' },
    update: {
      nome: 'Carlos Admin',
      senha: adminPasswordHash,
      role: UserRole.ADMIN,
      departamentoId: depsMap['Tecnologia da Informação (TI)'],
    },
    create: {
      nome: 'Carlos Admin',
      email: 'admin@orflie.com',
      senha: adminPasswordHash,
      role: UserRole.ADMIN,
      departamentoId: depsMap['Tecnologia da Informação (TI)'],
    },
  })

  const marianaUser = await prisma.usuario.upsert({
    where: { email: 'mariana@orflie.com' },
    update: {
      nome: 'Mariana Costa',
      senha: memberPasswordHash,
      role: UserRole.MEMBRO,
      departamentoId: depsMap['Comercial'],
    },
    create: {
      nome: 'Mariana Costa',
      email: 'mariana@orflie.com',
      senha: memberPasswordHash,
      role: UserRole.MEMBRO,
      departamentoId: depsMap['Comercial'],
    },
  })

  const robertoUser = await prisma.usuario.upsert({
    where: { email: 'roberto@orflie.com' },
    update: {
      nome: 'Roberto Silva',
      senha: memberPasswordHash,
      role: UserRole.MEMBRO,
      departamentoId: depsMap['Financeiro'],
    },
    create: {
      nome: 'Roberto Silva',
      email: 'roberto@orflie.com',
      senha: memberPasswordHash,
      role: UserRole.MEMBRO,
      departamentoId: depsMap['Financeiro'],
    },
  })

  // 4. Ordens de Serviço Iniciais
  await prisma.ordemServico.upsert({
    where: { codigo: 'OS-102931-101' },
    update: {
      status: StatusOS.EM_ANDAMENTO,
    },
    create: {
      codigo: 'OS-102931-101',
      titulo: 'Liberação de Acesso ao CRM HubSpot',
      descricao: 'Necessidade de criar novo usuário para o time comercial no módulo de prospecção e pipeline de vendas.',
      solicitanteId: marianaUser.id,
      departamentoOrigemId: depsMap['Comercial'],
      departamentoDestinoId: depsMap['Tecnologia da Informação (TI)'],
      prioridade: PrioridadeOS.ALTA,
      status: StatusOS.EM_ANDAMENTO,
    },
  })

  await prisma.ordemServico.upsert({
    where: { codigo: 'OS-102932-102' },
    update: {
      status: StatusOS.ABERTA,
    },
    create: {
      codigo: 'OS-102932-102',
      titulo: 'Solicitação de Treinamento de Integração',
      descricao: 'Agendamento de onboarding e alinhamento de políticas internas para novo estagiário da equipe comercial.',
      solicitanteId: marianaUser.id,
      departamentoOrigemId: depsMap['Comercial'],
      departamentoDestinoId: depsMap['Recursos Humanos (RH)'],
      prioridade: PrioridadeOS.MEDIA,
      status: StatusOS.ABERTA,
    },
  })

  await prisma.ordemServico.upsert({
    where: { codigo: 'OS-102933-103' },
    update: {
      status: StatusOS.AGUARDANDO_RESPOSTA,
    },
    create: {
      codigo: 'OS-102933-103',
      titulo: 'Aprovação de Orçamento de Infraestrutura Cloud',
      descricao: 'Envio de planilha de custos e relatório de migração de servidores para validação da diretoria executiva.',
      solicitanteId: adminUser.id,
      departamentoOrigemId: depsMap['Tecnologia da Informação (TI)'],
      departamentoDestinoId: depsMap['Diretoria'],
      prioridade: PrioridadeOS.URGENTE,
      status: StatusOS.AGUARDANDO_RESPOSTA,
    },
  })

  await prisma.ordemServico.upsert({
    where: { codigo: 'OS-102934-104' },
    update: {
      status: StatusOS.CONCLUIDA,
    },
    create: {
      codigo: 'OS-102934-104',
      titulo: 'Fechamento Contábil e Relatório Mensal',
      descricao: 'Validação de notas fiscais emitidas e conciliação bancária do encerramento do mês vigente.',
      solicitanteId: robertoUser.id,
      departamentoOrigemId: depsMap['Financeiro'],
      departamentoDestinoId: depsMap['Diretoria'],
      prioridade: PrioridadeOS.ALTA,
      status: StatusOS.CONCLUIDA,
    },
  })

  console.log('Seed Orflie concluído com sucesso!')
}

seed()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
