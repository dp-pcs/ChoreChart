import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const dbUrlSet = !!process.env.DATABASE_URL
    const directUrlSet = !!process.env.DIRECT_URL
    const nextAuthUrlSet = !!process.env.NEXTAUTH_URL
    const nextAuthSecretSet = !!process.env.NEXTAUTH_SECRET

    // Quick DB connectivity check
    await prisma.$queryRaw`SELECT 1` as unknown

    return NextResponse.json({
      ok: true,
      env: {
        DATABASE_URL: dbUrlSet,
        DIRECT_URL: directUrlSet,
        NEXTAUTH_URL: nextAuthUrlSet,
        NEXTAUTH_SECRET: nextAuthSecretSet,
      },
      db: 'connected'
    })
  } catch (error) {
    console.error('test-env error:', error)
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}


