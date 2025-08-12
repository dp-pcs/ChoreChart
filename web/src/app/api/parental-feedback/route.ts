import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-simple'
import { prisma } from '@/lib/prisma'
import { getActiveFamilyId } from '@/lib/family'
import { convertDecimalsDeep } from '@/lib/utils'

// GET: Fetch parental feedback
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const childId = url.searchParams.get('childId')
    const parentId = url.searchParams.get('parentId')
    const type = url.searchParams.get('type')
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')
    const limit = url.searchParams.get('limit')

    // Build where clause based on user role and filters
    const whereClause: any = {}
    
    if (session.user.role === 'CHILD') {
      // Children can only see feedback logged for them
      whereClause.childId = session.user.id
    } else if (session.user.role === 'PARENT') {
      // Parents can see feedback from their family
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
        whereClause.childId = { in: familyChildren.map(child => child.id) }
      }
      
      if (parentId) {
        whereClause.parentId = parentId
      }
    }

    // Add filters
    if (type) {
      whereClause.type = type
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

    const feedback = await prisma.parentalFeedback.findMany({
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
      orderBy: { occurredAt: 'desc' },
      take: limit ? parseInt(limit) : 50
    })

    // Get feedback patterns for today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const endOfDay = new Date(today)
    endOfDay.setHours(23, 59, 59, 999)

    const todaysFeedback = await prisma.parentalFeedback.groupBy({
      by: ['childId', 'type'],
      where: {
        ...whereClause,
        occurredAt: {
          gte: today,
          lte: endOfDay
        }
      },
      _count: {
        id: true
      }
    })

    return NextResponse.json(convertDecimalsDeep({
      success: true,
      feedback,
      todaysSummary: todaysFeedback
    }))

  } catch (error) {
    console.error('Parental feedback fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch parental feedback' },
      { status: 500 }
    )
  }
}

// POST: Log new parental feedback (parents only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Only parents can log feedback' }, { status: 403 })
    }

    const { 
      childId, 
      title, 
      description, 
      type,
      occurredAt, 
      points 
    } = await request.json()

    if (!childId || !title || !type || !occurredAt) {
      return NextResponse.json(
        { error: 'Child ID, title, type, and occurrence date are required' },
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

    const feedbackRecord = await prisma.parentalFeedback.create({
      data: {
        childId,
        parentId: session.user.id,
        title,
        description: description || null,
        type,
        occurredAt: new Date(occurredAt),
        points: points || null
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

    // Award or deduct points if specified
    if (points && points !== 0) {
      if (points > 0) {
        // Positive feedback - award points
        await prisma.user.update({
          where: { id: childId },
          data: {
            availablePoints: { increment: points },
            lifetimePoints: { increment: points }
          }
        })
      } else {
        // Negative feedback - deduct points
        await prisma.user.update({
          where: { id: childId },
          data: {
            availablePoints: { decrement: Math.abs(points) }
          }
        })
      }
    }

    // Check for patterns (same type of feedback today)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const endOfDay = new Date(today)
    endOfDay.setHours(23, 59, 59, 999)

    const todayCount = await prisma.parentalFeedback.count({
      where: {
        childId,
        type,
        occurredAt: {
          gte: today,
          lte: endOfDay
        }
      }
    })

    let patternWarning = null
    if (type === 'NEGATIVE' && todayCount >= 5) {
      patternWarning = `⚠️ ${child.name} has received ${todayCount} negative feedback entries today`
    } else if (type === 'POSITIVE' && todayCount >= 3) {
      patternWarning = `🌟 ${child.name} is having a great day with ${todayCount} positive feedback entries!`
    }

    return NextResponse.json(convertDecimalsDeep({
      success: true,
      feedback: feedbackRecord,
      patternWarning,
      message: 'Feedback logged successfully!'
    }))

  } catch (error) {
    console.error('Parental feedback creation error:', error)
    return NextResponse.json(
      { error: 'Failed to log feedback' },
      { status: 500 }
    )
  }
}

// DELETE: Remove parental feedback (parents only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Only parents can delete feedback' }, { status: 403 })
    }

    const url = new URL(request.url)
    const feedbackId = url.searchParams.get('feedbackId')

    if (!feedbackId) {
      return NextResponse.json(
        { error: 'Feedback ID is required' },
        { status: 400 }
      )
    }

    // Verify feedback exists and belongs to parent
    const feedback = await prisma.parentalFeedback.findFirst({
      where: {
        id: feedbackId,
        parentId: session.user.id
      }
    })

    if (!feedback) {
      return NextResponse.json(
        { error: 'Feedback not found or not authorized' },
        { status: 404 }
      )
    }

    // Reverse points if any were awarded/deducted
    if (feedback.points && feedback.points.toNumber() !== 0) {
      if (feedback.points.toNumber() > 0) {
        // Remove awarded points
        await prisma.user.update({
          where: { id: feedback.childId },
          data: {
            availablePoints: { decrement: feedback.points },
            lifetimePoints: { decrement: feedback.points }
          }
        })
      } else {
        // Restore deducted points
        await prisma.user.update({
          where: { id: feedback.childId },
          data: {
            availablePoints: { increment: Math.abs(feedback.points.toNumber()) }
          }
        })
      }
    }

    // Delete the feedback
    await prisma.parentalFeedback.delete({
      where: { id: feedbackId }
    })

    return NextResponse.json({
      success: true,
      message: 'Feedback deleted successfully!'
    })

  } catch (error) {
    console.error('Parental feedback deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete feedback' },
      { status: 500 }
    )
  }
}