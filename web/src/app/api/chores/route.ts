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

    // Get user's family
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { familyId: true }
    })

    if (!user?.familyId) {
      return NextResponse.json({ error: 'User has no family' }, { status: 400 })
    }
    
    // Get all chores for the family
    const chores = await prisma.chore.findMany({
      where: {
        familyId: user.familyId
      },
      include: {
        assignments: {
          include: {
            user: {
              select: { name: true, id: true }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ chores })
    
  } catch (error) {
    console.error('Error fetching chores:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chores' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Only parents can create chores' }, { status: 403 })
    }

    const {
      title,
      description,
      reward,
      estimatedMinutes,
      frequency,
      selectedDays,
      isRequired,
      assignedChildIds
    } = await request.json()

    // Validate required fields only
    if (!title) {
      return NextResponse.json(
        { error: 'Missing required field: title' },
        { status: 400 }
      )
    }

    // Get user's family
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { familyId: true }
    })

    if (!user?.familyId) {
      return NextResponse.json({ error: 'User has no family' }, { status: 400 })
    }

    // Map frequency to proper enum values
    const choreType = frequency === 'once' ? 'ONE_TIME' : 
                     frequency === 'daily' ? 'DAILY' : 
                     frequency === 'weekly' ? 'WEEKLY' : 'CUSTOM'
    
    const choreFrequency = frequency === 'once' ? 'AS_NEEDED' : 
                          frequency === 'daily' ? 'DAILY' : 
                          frequency === 'weekly' ? 'WEEKLY' :
                          frequency === 'monthly' ? 'MONTHLY' : 'AS_NEEDED'

    // Create the chore
    const chore = await prisma.chore.create({
      data: {
        title,
        description: description || '',
        reward: reward || 0,
        estimatedMinutes: estimatedMinutes || 15,
        isRequired: Boolean(isRequired),
        familyId: user.familyId,
        type: choreType,
        frequency: choreFrequency,
        scheduledDays: selectedDays || [],
        assignments: {
          create: assignedChildIds?.map((childId: string) => ({
            userId: childId,
            familyId: user.familyId,
            weekStart: new Date()
          })) || []
        }
      },
      include: {
        assignments: {
          include: {
            user: {
              select: { name: true, id: true }
            }
          }
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      chore,
      message: `Chore "${title}" created successfully!`
    })
    
  } catch (error) {
    console.error('Error creating chore:', error)
    return NextResponse.json(
      { error: 'Failed to create chore' },
      { status: 500 }
    )
  }
}