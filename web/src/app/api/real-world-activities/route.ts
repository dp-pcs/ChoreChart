import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-simple'
import { prisma } from '@/lib/prisma'
import { getActiveFamilyId } from '@/lib/family'
import { convertDecimalsDeep } from '@/lib/utils'

// GET: Fetch real-world activities
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const childId = url.searchParams.get('childId')
    const parentId = url.searchParams.get('parentId')
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')

    // Build where clause based on user role and filters
    const whereClause: any = {}
    
    if (session.user.role === 'CHILD') {
      // Children can only see activities logged for them
      whereClause.childId = session.user.id
    } else if (session.user.role === 'PARENT') {
      // Parents can see activities from their family
      if (childId) {
        whereClause.childId = childId
      } else {
        // Get all children in the family
        const familyId = await getActiveFamilyId(session.user.id)
        const familyChildren = await prisma.user.findMany({
          where: {
            familyId: familyId || undefined,
            role: 'CHILD'
          },
          select: { id: true }
        })
        whereClause.childId = { in: familyChildren.map((child: { id: string }) => child.id) }
      }
      
      if (parentId) {
        whereClause.parentId = parentId
      }
    }

    // Date filtering
    if (startDate || endDate) {
      whereClause.occurredAt = {}
      if (startDate) {
        whereClause.occurredAt.gte = new Date(startDate)
      }
      if (endDate) {
        whereClause.occurredAt.lte = new Date(endDate)
      }
    }

    const activities = await prisma.realWorldActivity.findMany({
      where: whereClause,
      include: {
        child: {
          select: {
            id: true,
            name: true
          }
        },
        parent: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { occurredAt: 'desc' }
    })

    return NextResponse.json(convertDecimalsDeep({
      success: true,
      activities
    }))

  } catch (error) {
    console.error('Real-world activities fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch real-world activities' },
      { status: 500 }
    )
  }
}

// POST: Log new real-world activity (parents only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Only parents can log real-world activities' }, { status: 403 })
    }

    const { childId, title, description, occurredAt, points } = await request.json()

    if (!childId || !title || !occurredAt) {
      return NextResponse.json(
        { error: 'Child ID, title, and occurrence date are required' },
        { status: 400 }
      )
    }

    // Verify child belongs to parent's active family
    const familyId = await getActiveFamilyId(session.user.id)
    const child = await prisma.user.findFirst({
      where: {
        id: childId,
        familyId: familyId || undefined,
        role: 'CHILD'
      }
    })

    if (!child) {
      return NextResponse.json(
        { error: 'Child not found in your family' },
        { status: 404 }
      )
    }

    const activity = await prisma.realWorldActivity.create({
      data: {
        childId,
        parentId: session.user.id,
        title,
        description: description || null,
        occurredAt: new Date(occurredAt),
        points: points || 0
      },
      include: {
        child: {
          select: {
            id: true,
            name: true
          }
        },
        parent: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Award points if any
    if (points > 0) {
      await prisma.user.update({
        where: { id: childId },
        data: {
          availablePoints: { increment: points },
          lifetimePoints: { increment: points }
        }
      })

      // Create a reward record for tracking
      await prisma.reward.create({
        data: {
          userId: childId,
          title: `Real-world activity: ${title}`,
          description: description || title,
          amount: 0, // Points-based, not money
          type: 'EXPERIENCE',
          awardedBy: session.user.id
        }
      })
    }

    return NextResponse.json(convertDecimalsDeep({
      success: true,
      activity,
      message: 'Real-world activity logged successfully!'
    }))

  } catch (error) {
    console.error('Real-world activity creation error:', error)
    return NextResponse.json(
      { error: 'Failed to log real-world activity' },
      { status: 500 }
    )
  }
}

// PUT: Update real-world activity (parents only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Only parents can update activities' }, { status: 403 })
    }

    const { activityId, title, description, occurredAt, points } = await request.json()

    if (!activityId) {
      return NextResponse.json(
        { error: 'Activity ID is required' },
        { status: 400 }
      )
    }

    // Verify activity exists and belongs to parent's family
    const existingActivity = await prisma.realWorldActivity.findFirst({
      where: {
        id: activityId,
        parentId: session.user.id // Only parent who logged it can update
      },
      include: {
        child: true
      }
    })

    if (!existingActivity) {
      return NextResponse.json(
        { error: 'Activity not found or not authorized' },
        { status: 404 }
      )
    }

    // Calculate point difference for adjustment
    const oldPoints = existingActivity.points
    const newPoints = points || 0
    const pointDifference = newPoints - oldPoints

    const updatedActivity = await prisma.realWorldActivity.update({
      where: { id: activityId },
      data: {
        title: title || existingActivity.title,
        description: description !== undefined ? description : existingActivity.description,
        occurredAt: occurredAt ? new Date(occurredAt) : existingActivity.occurredAt,
        points: newPoints
      },
      include: {
        child: {
          select: {
            id: true,
            name: true
          }
        },
        parent: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Adjust child's points if changed
    if (pointDifference !== 0) {
      await prisma.user.update({
        where: { id: existingActivity.childId },
        data: {
          availablePoints: { increment: pointDifference },
          lifetimePoints: pointDifference > 0 ? { increment: pointDifference } : undefined
        }
      })
    }

    return NextResponse.json(convertDecimalsDeep({
      success: true,
      activity: updatedActivity,
      message: 'Activity updated successfully!'
    }))

  } catch (error) {
    console.error('Real-world activity update error:', error)
    return NextResponse.json(
      { error: 'Failed to update activity' },
      { status: 500 }
    )
  }
}

// DELETE: Remove real-world activity (parents only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Only parents can delete activities' }, { status: 403 })
    }

    const url = new URL(request.url)
    const activityId = url.searchParams.get('activityId')

    if (!activityId) {
      return NextResponse.json(
        { error: 'Activity ID is required' },
        { status: 400 }
      )
    }

    // Verify activity exists and belongs to parent
    const activity = await prisma.realWorldActivity.findFirst({
      where: {
        id: activityId,
        parentId: session.user.id
      }
    })

    if (!activity) {
      return NextResponse.json(
        { error: 'Activity not found or not authorized' },
        { status: 404 }
      )
    }

    // Remove points from child if any were awarded
    if (activity.points > 0) {
      await prisma.user.update({
        where: { id: activity.childId },
        data: {
          availablePoints: { decrement: activity.points }
        }
      })
    }

    // Delete the activity
    await prisma.realWorldActivity.delete({
      where: { id: activityId }
    })

    return NextResponse.json({
      success: true,
      message: 'Activity deleted successfully!'
    })

  } catch (error) {
    console.error('Real-world activity deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete activity' },
      { status: 500 }
    )
  }
} 