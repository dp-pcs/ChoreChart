import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
                autoApproveChores: true
              }
            }
          }
        }
      },
      orderBy: { weekStart: 'desc' }
    })

    if (!assignment) {
      return NextResponse.json(
        { error: 'Chore assignment not found' },
        { status: 404 }
      )
    }

    // Check if already submitted
    const existingSubmission = await prisma.choreSubmission.findFirst({
      where: {
        assignmentId: assignment.id,
        userId: session.user.id
      }
    })

    if (existingSubmission) {
      return NextResponse.json(
        { error: 'Chore already submitted' },
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

    // If auto-approved, create approval record and reward
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
        // Create auto-approval record
        await prisma.choreApproval.create({
          data: {
            submissionId: submission.id,
            approvedBy: parentInFamily.userId,
            approved: true,
            feedback: 'Auto-approved by system'
          }
        })

        // Create reward record
        await prisma.reward.create({
          data: {
            userId: session.user.id,
            title: `Completed: ${assignment.chore.title}`,
            amount: assignment.chore.reward,
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