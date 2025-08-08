import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const dbUrlSet = !!process.env.DATABASE_URL
    const directUrlSet = !!process.env.DIRECT_URL
    const nextAuthUrlSet = !!process.env.NEXTAUTH_URL
    const nextAuthSecretSet = !!process.env.NEXTAUTH_SECRET

    // Quick DB connectivity check
    await prisma.$queryRaw`SELECT 1` as unknown

    res.status(200).json({
      ok: true,
      env: {
        DATABASE_URL: dbUrlSet,
        DIRECT_URL: directUrlSet,
        NEXTAUTH_URL: nextAuthUrlSet,
        NEXTAUTH_SECRET: nextAuthSecretSet,
      },
      db: 'connected',
      router: 'pages'
    })
  } catch (error) {
    console.error('pages/api/test-env error:', error)
    res.status(500).json({ ok: false, error: error instanceof Error ? error.message : String(error) })
  }
}


