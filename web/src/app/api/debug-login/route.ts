import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    
    console.log('Debug login attempt:', { email, password })
    
    const user = await prisma.user.findUnique({
      where: { email },
      include: { family: true }
    })
    
    if (!user) {
      return NextResponse.json({
        status: 'error',
        message: 'User not found',
        email
      })
    }
    
    console.log('Found user:', { 
      id: user.id, 
      email: user.email, 
      hasPassword: !!user.password,
      passwordLength: user.password?.length,
      passwordPreview: user.password?.substring(0, 10) + '...'
    })
    
    // Test both password validation methods
    const isPlainTextMatch = password === "password"
    const isBcryptMatch = user.password ? await bcrypt.compare(password, user.password) : false
    
    return NextResponse.json({
      status: 'debug',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        hasPassword: !!user.password,
        passwordHash: user.password?.substring(0, 20) + '...'
      },
      tests: {
        inputPassword: password,
        isPlainTextMatch,
        isBcryptMatch,
        shouldPass: isPlainTextMatch || isBcryptMatch
      }
    })
    
  } catch (error) {
    console.error('Debug login error:', error)
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 