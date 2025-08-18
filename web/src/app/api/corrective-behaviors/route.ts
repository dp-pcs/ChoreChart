import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-simple'
import { prisma } from '@/lib/prisma'

// GET: Fetch corrective behaviors
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const childId = url.searchParams.get('childId')
    const parentId = url.searchParams.get('parentId')
    const behavior = url.searchParams.get('behavior')
    const severity = url.searchParams.get('severity')
    const status = url.searchParams.get('status')
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')

    // Build where clause based on user role and filters
    const whereClause: any = {}
    
    if (session.user.role === 'CHILD') {
      // Children can only see behaviors logged for them
      whereClause.childId = session.user.id
    } else if (session.user.role === 'PARENT') {
      // Parents can see behaviors from their family
      if (childId) {
        whereClause.childId = childId
      } else {
        // Get all children in the family
        const familyChildren = await prisma.user.findMany({
          where: {
            familyId: session.user.familyId,
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

    // Add filters
    if (behavior) {
      whereClause.behavior = { contains: behavior, mode: 'insensitive' }
    }
    if (severity) {
      whereClause.severity = severity
    }
    if (status) {
      whereClause.status = status
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

    const behaviors = await prisma.correctiveBehavior.findMany({
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

    // Get behavior pattern analysis
    const behaviorPatterns = await prisma.correctiveBehavior.groupBy({
      by: ['behavior', 'childId'],
      where: {
        ...whereClause,
        occurredAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    })

    return NextResponse.json({
      success: true,
      behaviors,
      patterns: behaviorPatterns
    })

  } catch (error) {
    console.error('Corrective behaviors fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch corrective behaviors' },
      { status: 500 }
    )
  }
}

// POST: Log new corrective behavior (parents only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Only parents can log corrective behaviors' }, { status: 403 })
    }

    const { 
      childId, 
      behavior, 
      description, 
      occurredAt, 
      severity, 
      actionTaken, 
      pointsDeducted 
    } = await request.json()

    if (!childId || !behavior || !occurredAt) {
      return NextResponse.json(
        { error: 'Child ID, behavior, and occurrence date are required' },
        { status: 400 }
      )
    }

    // Verify child belongs to parent's family
    const child = await prisma.user.findFirst({
      where: {
        id: childId,
        familyId: session.user.familyId,
        role: 'CHILD'
      }
    })

    if (!child) {
      return NextResponse.json(
        { error: 'Child not found in your family' },
        { status: 404 }
      )
    }

    const behaviorRecord = await prisma.correctiveBehavior.create({
      data: {
        childId,
        parentId: session.user.id,
        behavior,
        description: description || null,
        occurredAt: new Date(occurredAt),
        severity: severity || 'MINOR',
        actionTaken: actionTaken || null,
        pointsDeducted: pointsDeducted || 0,
        status: actionTaken ? 'ACTION_TAKEN' : 'NOTED'
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

    // Deduct points if specified
    if (pointsDeducted > 0) {
      await prisma.user.update({
        where: { id: childId },
        data: {
          availablePoints: { decrement: pointsDeducted }
        }
      })
    }

    // Check for patterns (same behavior in last 7 days)
    const recentCount = await prisma.correctiveBehavior.count({
      where: {
        childId,
        behavior: {
          contains: behavior,
          mode: 'insensitive'
        },
        occurredAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    })

    let patternWarning = null
    if (recentCount >= 3) {
      patternWarning = `⚠️ Pattern detected: "${behavior}" has occurred ${recentCount} times in the last 7 days`
    }

    return NextResponse.json({
      success: true,
      behavior: behaviorRecord,
      patternWarning,
      message: 'Corrective behavior logged successfully!'
    })

  } catch (error) {
    console.error('Corrective behavior creation error:', error)
    return NextResponse.json(
      { error: 'Failed to log corrective behavior' },
      { status: 500 }
    )
  }
}

// PATCH: Update corrective behavior (parents only)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Only parents can update behaviors' }, { status: 403 })
    }

    const { 
      behaviorId, 
      behavior, 
      description, 
      severity, 
      status, 
      actionTaken, 
      pointsDeducted 
    } = await request.json()

    if (!behaviorId) {
      return NextResponse.json(
        { error: 'Behavior ID is required' },
        { status: 400 }
      )
    }

    // Verify behavior exists and belongs to parent
    const existingBehavior = await prisma.correctiveBehavior.findFirst({
      where: {
        id: behaviorId,
        parentId: session.user.id
      }
    })

    if (!existingBehavior) {
      return NextResponse.json(
        { error: 'Behavior not found or not authorized' },
        { status: 404 }
      )
    }

    // Calculate point difference for adjustment
    const oldPoints = existingBehavior.pointsDeducted || 0
    const newPoints = pointsDeducted || 0
    const pointDifference = newPoints - oldPoints

    const updatedBehavior = await prisma.correctiveBehavior.update({
      where: { id: behaviorId },
      data: {
        behavior: behavior || existingBehavior.behavior,
        description: description !== undefined ? description : existingBehavior.description,
        severity: severity || existingBehavior.severity,
        status: status || existingBehavior.status,
        actionTaken: actionTaken !== undefined ? actionTaken : existingBehavior.actionTaken,
        pointsDeducted: newPoints
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
      if (pointDifference > 0) {
        // More points deducted
        await prisma.user.update({
          where: { id: existingBehavior.childId },
          data: {
            availablePoints: { decrement: pointDifference }
          }
        })
      } else {
        // Points restored
        await prisma.user.update({
          where: { id: existingBehavior.childId },
          data: {
            availablePoints: { increment: Math.abs(pointDifference) }
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      behavior: updatedBehavior,
      message: 'Behavior updated successfully!'
    })

  } catch (error) {
    console.error('Corrective behavior update error:', error)
    return NextResponse.json(
      { error: 'Failed to update behavior' },
      { status: 500 }
    )
  }
}

// DELETE: Remove corrective behavior (parents only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Only parents can delete behaviors' }, { status: 403 })
    }

    const url = new URL(request.url)
    const behaviorId = url.searchParams.get('behaviorId')

    if (!behaviorId) {
      return NextResponse.json(
        { error: 'Behavior ID is required' },
        { status: 400 }
      )
    }

    // Verify behavior exists and belongs to parent
    const behavior = await prisma.correctiveBehavior.findFirst({
      where: {
        id: behaviorId,
        parentId: session.user.id
      }
    })

    if (!behavior) {
      return NextResponse.json(
        { error: 'Behavior not found or not authorized' },
        { status: 404 }
      )
    }

    // Restore points to child if any were deducted
    if (behavior.pointsDeducted && behavior.pointsDeducted > 0) {
      await prisma.user.update({
        where: { id: behavior.childId },
        data: {
          availablePoints: { increment: behavior.pointsDeducted }
        }
      })
    }

    // Delete the behavior
    await prisma.correctiveBehavior.delete({
      where: { id: behaviorId }
    })

    return NextResponse.json({
      success: true,
      message: 'Behavior deleted successfully!'
    })

  } catch (error) {
    console.error('Corrective behavior deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete behavior' },
      { status: 500 }
    )
  }
} 