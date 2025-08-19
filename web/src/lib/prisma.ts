import { PrismaClient, Prisma } from '@prisma/client'

// Ensure Prisma can connect even if DATABASE_URL is not injected at runtime.
// Fall back to DIRECT_URL (Supabase direct connection) when available.
const resolvedDatabaseUrl = process.env.DATABASE_URL || process.env.DIRECT_URL

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(
    resolvedDatabaseUrl
      ? { datasources: { db: { url: resolvedDatabaseUrl } } }
      : undefined
  )

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

const Decimal = Prisma.Decimal
export { Decimal } 