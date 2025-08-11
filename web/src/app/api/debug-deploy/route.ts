import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const results: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {}
  }

  // 1. Environment Variables Check
  results.checks.environment = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    DATABASE_URL_LENGTH: process.env.DATABASE_URL?.length || 0,
    DIRECT_URL: !!process.env.DIRECT_URL,
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    NEXTAUTH_SECRET_LENGTH: process.env.NEXTAUTH_SECRET?.length || 0,
    NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
    NEXTAUTH_URL_VALUE: process.env.NEXTAUTH_URL,
    NODE_ENV: process.env.NODE_ENV,
  }

  // 2. Database Connection Test
  try {
    console.log('Testing database connection...')
    await prisma.$queryRaw`SELECT 1 as test`
    results.checks.database = {
      status: 'connected',
      error: null
    }
    console.log('Database connection successful')
  } catch (error) {
    console.error('Database connection failed:', error)
    results.checks.database = {
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }
  }

  // 3. User Table Access Test
  try {
    console.log('Testing user table access...')
    const userCount = await prisma.user.count()
    results.checks.userTable = {
      status: 'accessible',
      userCount,
      error: null
    }
    console.log(`User table accessible, ${userCount} users found`)
  } catch (error) {
    console.error('User table access failed:', error)
    results.checks.userTable = {
      status: 'failed',
      error: error instanceof Error ? error.message : String(error)
    }
  }

  // 4. Family Table Access Test
  try {
    console.log('Testing family table access...')
    const familyCount = await prisma.family.count()
    results.checks.familyTable = {
      status: 'accessible', 
      familyCount,
      error: null
    }
    console.log(`Family table accessible, ${familyCount} families found`)
  } catch (error) {
    console.error('Family table access failed:', error)
    results.checks.familyTable = {
      status: 'failed',
      error: error instanceof Error ? error.message : String(error)
    }
  }

  // 5. Test Demo User Existence
  try {
    console.log('Testing demo user existence...')
    const demoUser = await prisma.user.findUnique({
      where: { email: 'parent@demo.com' },
      include: { family: true }
    })
    results.checks.demoUser = {
      status: demoUser ? 'found' : 'not_found',
      hasFamily: !!demoUser?.family,
      familyName: demoUser?.family?.name,
      hasPassword: !!demoUser?.password,
      error: null
    }
    console.log(`Demo user ${demoUser ? 'found' : 'not found'}`)
  } catch (error) {
    console.error('Demo user check failed:', error)
    results.checks.demoUser = {
      status: 'failed',
      error: error instanceof Error ? error.message : String(error)
    }
  }

  // 6. NextAuth Secret Test
  try {
    if (!process.env.NEXTAUTH_SECRET) {
      throw new Error('NEXTAUTH_SECRET is not configured')
    }
    
    // Test JWT signing (basic check)
    const jwt = require('jsonwebtoken')
    const testToken = jwt.sign({ test: 'data' }, process.env.NEXTAUTH_SECRET, { expiresIn: '1m' })
    const decoded = jwt.verify(testToken, process.env.NEXTAUTH_SECRET)
    
    results.checks.nextAuthSecret = {
      status: 'valid',
      canSign: true,
      canVerify: !!decoded,
      error: null
    }
    console.log('NextAuth secret is valid')
  } catch (error) {
    console.error('NextAuth secret test failed:', error)
    results.checks.nextAuthSecret = {
      status: 'failed',
      error: error instanceof Error ? error.message : String(error)
    }
  }

  // Determine overall status
  const hasFailures = Object.values(results.checks).some((check: any) => 
    check.status === 'failed' || check.status === 'not_found'
  )

  console.log('Diagnostic complete. Overall status:', hasFailures ? 'ISSUES_FOUND' : 'ALL_GOOD')

  return NextResponse.json({
    ...results,
    overallStatus: hasFailures ? 'ISSUES_FOUND' : 'ALL_GOOD'
  }, { 
    status: hasFailures ? 500 : 200 
  })
}
