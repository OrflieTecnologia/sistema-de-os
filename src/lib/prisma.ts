import { PrismaClient, UserRole, StatusOS, PrioridadeOS, Prisma } from '@/generated/client'

export { PrismaClient, UserRole, StatusOS, PrioridadeOS, Prisma }

const prismaClientSingleton = () => {
  return new PrismaClient()
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton> | undefined
} & typeof global

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma

export default prisma