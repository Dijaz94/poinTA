import { PrismaClient } from '../../app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// Usamos un nombre distinto al export (`__prisma`) para que el global del
// caché de HMR no choque con el auto-import `prisma` de Nuxt.
const globalForPrisma = globalThis as unknown as {
  __prisma?: PrismaClient
}

function createPrismaClient() {
  const url = new URL(process.env.DATABASE_URL!)
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
    max: 5,
  })

  return new PrismaClient({
    adapter,
    log: ['error', 'warn'],
  })
}

export const prisma: PrismaClient =
  globalForPrisma.__prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__prisma = prisma
}