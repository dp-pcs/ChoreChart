import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    const results: any = {
      timestamp: new Date().toISOString(),
      input: { email, hasPassword: !!password },
      steps: {}
    }

    // Step 1: Environment Check
    console.log('Step 1: Checking environment...')
    results.steps.environment = {
      NODE_ENV: process.env.NODE_ENV,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      isProduction: process.env.NODE_ENV === 'production'
    }

    // Step 2: Database Connection
    console.log('Step 2: Testing database connection...')
    try {
      await prisma.$queryRaw`SELECT 1 as test`
      results.steps.database = { status: 'connected' }
    } catch (error) {
      results.steps.database = { 
        status: 'failed',
        error: error instanceof Error ? error.message : String(error)
      }
      throw new Error(`Database connection failed: ${error}`)
    }

    // Step 3: Find User
    console.log(`Step 3: Looking for user ${email}...`)
    let user
    try {
      user = await prisma.user.findUnique({
        where: { email },
        include: { family: true }
      })
      
      results.steps.userLookup = {
        status: user ? 'found' : 'not_found',
        userId: user?.id,
        userRole: user?.role,
        hasFamily: !!user?.family,
        familyName: user?.family?.name,
        familyId: user?.familyId,
        hasPassword: !!user?.password
      }
    } catch (error) {
      results.steps.userLookup = {
        status: 'failed',
        error: error instanceof Error ? error.message : String(error)
      }
      throw new Error(`User lookup failed: ${error}`)
    }

    if (!user) {
      // Try mock users for troubleshooting
      const mockUsers = {
        'child@demo.com': {
          id: 'child-demo-1',
          email: 'child@demo.com',
          name: 'Noah (Demo Child)',
          role: 'CHILD',
          familyId: 'demo-family-1',
          family: { id: 'demo-family-1', name: 'Demo Family' }
        },
        'parent@demo.com': {
          id: 'parent-demo-1',
          email: 'parent@demo.com',
          name: 'Demo Parent',
          role: 'PARENT',
          familyId: 'demo-family-1',
          family: { id: 'demo-family-1', name: 'Demo Family' }
        }
      }

      if (email in mockUsers && password === 'password') {
        results.steps.mockUser = {
          status: 'used_mock',
          reason: 'User not found in database, using mock user'
        }
        
        return NextResponse.json({
          ...results,
          result: 'SUCCESS_MOCK',
          message: 'Authentication would succeed using mock user',
          user: mockUsers[email as keyof typeof mockUsers]
        })
      }

      return NextResponse.json({
        ...results,
        result: 'FAILED_USER_NOT_FOUND',
        message: 'User not found in database and not a valid mock user'
      }, { status: 401 })
    }

    // Step 4: Password Validation
    console.log('Step 4: Validating password...')
    try {
      const allowDevPassword = process.env.NODE_ENV !== 'production'
      let isPasswordValid = false
      
      if (allowDevPassword && password === 'password') {
        isPasswordValid = true
        results.steps.passwordCheck = {
          status: 'valid',
          method: 'development_fallback'
        }
      } else if (user.password) {
        isPasswordValid = await bcrypt.compare(password, user.password)
        results.steps.passwordCheck = {
          status: isPasswordValid ? 'valid' : 'invalid',
          method: 'bcrypt_hash'
        }
      } else {
        results.steps.passwordCheck = {
          status: 'failed',
          method: 'no_password_stored',
          error: 'User has no password stored in database'
        }
      }

      if (!isPasswordValid) {
        return NextResponse.json({
          ...results,
          result: 'FAILED_INVALID_PASSWORD',
          message: 'Password validation failed'
        }, { status: 401 })
      }

    } catch (error) {
      results.steps.passwordCheck = {
        status: 'failed',
        error: error instanceof Error ? error.message : String(error)
      }
      throw new Error(`Password validation failed: ${error}`)
    }

    // Step 5: JWT Token Test
    console.log('Step 5: Testing JWT token creation...')
    try {
      const secret = process.env.NEXTAUTH_SECRET
      if (!secret) {
        throw new Error('NEXTAUTH_SECRET not configured')
      }

      const jwt = require('jsonwebtoken')
      const testToken = jwt.sign({
        userId: user.id,
        email: user.email,
        role: user.role,
        familyId: user.familyId
      }, secret, { expiresIn: '7d' })

      results.steps.tokenCreation = {
        status: 'success',
        tokenLength: testToken.length
      }
    } catch (error) {
      results.steps.tokenCreation = {
        status: 'failed',
        error: error instanceof Error ? error.message : String(error)
      }
      throw new Error(`Token creation failed: ${error}`)
    }

    // Success!
    return NextResponse.json({
      ...results,
      result: 'SUCCESS',
      message: 'All authentication steps completed successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        familyId: user.familyId,
        family: user.family
      }
    })

  } catch (error) {
    console.error('Signin diagnostic failed:', error)
    return NextResponse.json({
      result: 'ERROR',
      message: error instanceof Error ? error.message : String(error),
      error: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST with email and password to test signin process',
    usage: {
      method: 'POST',
      body: { email: 'parent@demo.com', password: 'password' }
    }
  })
}
