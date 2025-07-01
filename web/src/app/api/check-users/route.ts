import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true
      }
    })
    
    return NextResponse.json({
      status: 'success',
      users: users,
      count: users.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Database query error:', error)
    
    return NextResponse.json({
      status: 'error',
      message: 'Failed to fetch users',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 