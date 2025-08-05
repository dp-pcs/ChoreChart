import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'CHILD') {
      return NextResponse.json({ error: 'Only children can submit chores' }, { status: 403 })
    }

    const { choreId, notes, completedAt } = await request.json()

    if (!choreId) {
      return NextResponse.json(
        { error: 'Missing required field: choreId' },
        { status: 400 }
      )
    }

    console.log('🔍 Finding assignment for:', { choreId, userId: session.user.id, currentDate: new Date() })
    
    // Find the chore assignment for this child
    const assignment = await prisma.choreAssignment.findFirst({
      where: {
        choreId: choreId,
        userId: session.user.id,
        // Get current week's assignment
        weekStart: {
          lte: new Date()
        }
      },
      include: {
        chore: {
          include: {
            family: {
              select: {
                id: true,
                autoApproveChores: true,
                pointsToMoneyRate: true
              }
            }
          },
          select: {
            title: true,
            reward: true,
            points: true,
            family: true
          }
        }
      },
      orderBy: { weekStart: 'desc' }
    })
    
    console.log('📋 Found assignment:', assignment ? { id: assignment.id, weekStart: assignment.weekStart, choreTitle: assignment.chore.title } : 'None')

    if (!assignment) {
      return NextResponse.json(
        { error: 'Chore assignment not found' },
        { status: 404 }
      )
    }

    // Check if already submitted for today specifically  
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
    
    const existingSubmission = await prisma.choreSubmission.findFirst({
      where: {
        assignmentId: assignment.id,
        userId: session.user.id,
        completedAt: {
          gte: startOfDay,
          lt: endOfDay
        }
      }
    })
    
    console.log('🔄 Checking for existing submission today:', { 
      found: !!existingSubmission, 
      startOfDay, 
      endOfDay,
      existingId: existingSubmission?.id 
    })

    if (existingSubmission) {
      return NextResponse.json(
        { error: 'Chore already submitted for today' },
        { status: 400 }
      )
    }

    // Determine status based on family's auto-approval setting
    const shouldAutoApprove = assignment.chore.family.autoApproveChores
    const status = shouldAutoApprove ? 'AUTO_APPROVED' : 'PENDING'

    // Create the submission
    const submission = await prisma.choreSubmission.create({
      data: {
        assignmentId: assignment.id,
        userId: session.user.id,
        completedAt: completedAt ? new Date(completedAt) : new Date(),
        notes: notes || null,
        status: status
      },
      include: {
        assignment: {
          include: {
            chore: {
              select: {
                title: true,
                reward: true
              }
            }
          }
        }
      }
    })

    // If auto-approved, create approval record and award points
    if (shouldAutoApprove) {
      // Find a parent in the family to attribute the auto-approval to
      const parentInFamily = await prisma.familyMembership.findFirst({
        where: {
          familyId: assignment.chore.family.id,
          role: 'PARENT',
          isActive: true
        },
        select: { userId: true }
      })

      if (parentInFamily) {
        // Get chore points (this is the primary currency now)
        const chorePoints = assignment.chore.points || new Decimal(0)
        const pointsToMoneyRate = assignment.chore.family.pointsToMoneyRate || 1.00
        const moneyEquivalent = chorePoints.toNumber() * pointsToMoneyRate
        
        console.log('💰 Auto-approving chore:', {
          choreTitle: assignment.chore.title,
          userId: session.user.id,
          chorePoints: chorePoints.toNumber(),
          pointsToMoneyRate,
          moneyEquivalent
        })

        // Award points to user (CRITICAL: This was missing!)
        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            availablePoints: { increment: chorePoints },
            lifetimePoints: { increment: chorePoints }
          }
        })

        // Create auto-approval record
        await prisma.choreApproval.create({
          data: {
            submissionId: submission.id,
            approvedBy: parentInFamily.userId,
            approved: true,
            feedback: 'Auto-approved by system',
            score: 100,
            pointsAwarded: chorePoints,
            originalPoints: chorePoints,
            partialReward: new Decimal(moneyEquivalent),
            originalReward: assignment.chore.reward
          }
        })

        // Create reward record (for tracking/history)
        await prisma.reward.create({
          data: {
            userId: session.user.id,
            title: `Completed: ${assignment.chore.title}`,
            amount: moneyEquivalent, // Dollar equivalent 
            type: 'MONEY',
            awardedBy: parentInFamily.userId
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      submission: {
        id: submission.id,
        status: submission.status,
        reward: assignment.chore.reward,
        choreName: assignment.chore.title
      },
      message: shouldAutoApprove 
        ? `✅ ${assignment.chore.title} auto-approved! You earned $${assignment.chore.reward}!`
        : `📝 ${assignment.chore.title} submitted for parent review`
    })

  } catch (error) {
    console.error('Chore submission error:', error)
    return NextResponse.json(
      { error: 'Failed to submit chore' },
      { status: 500 }
    )
  }
} 