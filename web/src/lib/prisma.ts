import { PrismaClient } from '../generated/prisma'
import { Decimal } from '@prisma/client/runtime/library'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Lazy initialization of Prisma client to avoid build-time errors
function createPrismaClient(): PrismaClient {
  // Only create if DATABASE_URL exists (runtime, not build time)
  if (!process.env.DATABASE_URL) {
    // Return a proxy that throws helpful error at runtime if accessed
    return new Proxy({} as PrismaClient, {
      get(_, prop) {
        if (prop === 'then') return undefined // For promise detection
        throw new Error(
          `Database connection not configured. Please set DATABASE_URL environment variable.`
        )
      }
    })
  }

  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })
}

// Create Prisma client lazily
export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export { Decimal } 