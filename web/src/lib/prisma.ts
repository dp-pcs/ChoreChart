import { PrismaClient } from '../generated/prisma'
import { Decimal } from '@prisma/client/runtime/library'

// Keep a single Prisma instance across hot reloads in dev
const globalForPrisma = globalThis as unknown as {
  __PRISMA__?: PrismaClient
}

let prismaSingleton: PrismaClient | undefined = globalForPrisma.__PRISMA__

function getPrisma(): PrismaClient {
  if (!prismaSingleton) {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not set for PrismaClient')
    }
    prismaSingleton = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    })
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.__PRISMA__ = prismaSingleton
    }
  }
  return prismaSingleton
}

// Lazy proxy so importing this module does not instantiate Prisma
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrisma()
    return Reflect.get(client, prop, receiver)
  },
}) as PrismaClient

export { Decimal } 