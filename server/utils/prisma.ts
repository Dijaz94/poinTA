import { PrismaClient } from '../generated/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  __prisma?: PrismaClient
}

function getPrismaClient(): PrismaClient {
  if (globalForPrisma.__prisma && (globalForPrisma.__prisma as any).unit) {
    return globalForPrisma.__prisma
  }

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL no está configurada en las variables de entorno.')
  }

  const adapter = new PrismaPg({
    connectionString,
    max: process.env.NODE_ENV === 'production' ? 2 : 5,
  })

  const client = new PrismaClient({
    adapter,
    log: ['error', 'warn'],
  })

  globalForPrisma.__prisma = client
  return client
}

// Proxy para inicialización perezosa (lazy) segura en entornos serverless como Vercel
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient()
    const value = Reflect.get(client, prop, receiver)
    return typeof value === 'function' ? value.bind(client) : value
  },
})