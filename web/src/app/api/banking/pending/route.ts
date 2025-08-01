import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Only parents can view banking requests' }, { status: 403 })
    }

    // Get all pending banking requests from children in the same family
    const requests = await prisma.pointTransaction.findMany({
      where: {
        familyId: session.user.familyId,
        type: 'BANKING_REQUEST',
        status: 'PENDING'
      },
      orderBy: { submittedAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      requests 
    })

  } catch (error) {
    console.error('Banking pending requests error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}