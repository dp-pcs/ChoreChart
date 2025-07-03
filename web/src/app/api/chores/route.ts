import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // For now, we'll mock the user session data
    // In a real implementation, you'd get this from session
    const mockFamilyId = 'family-1' // This should come from session
    
    // Get all chores for the family
    const chores = await prisma.chore.findMany({
      where: {
        familyId: mockFamilyId
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
    // For now, we'll mock the user session data
    // In a real implementation, you'd validate parent role from session
    const mockFamilyId = 'family-1' // This should come from session
    const mockUserId = 'parent-1' // This should come from session

    const {
      title,
      description,
      reward,
      estimatedMinutes,
      isRequired,
      assignedChildIds
    } = await request.json()

    // Validate input
    if (!title || !reward || !estimatedMinutes) {
      return NextResponse.json(
        { error: 'Missing required fields: title, reward, estimatedMinutes' },
        { status: 400 }
      )
    }

    // Create the chore
    const chore = await prisma.chore.create({
      data: {
        title,
        description: description || '',
        reward: parseFloat(reward),
        estimatedMinutes: parseInt(estimatedMinutes),
        isRequired: Boolean(isRequired),
        familyId: mockFamilyId,
        type: 'ONE_TIME',
        frequency: 'AS_NEEDED',
        assignments: {
          create: assignedChildIds?.map((childId: string) => ({
            userId: childId,
            familyId: mockFamilyId,
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