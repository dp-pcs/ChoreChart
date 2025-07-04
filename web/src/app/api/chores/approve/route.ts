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

    if (session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { submissionId, approved, feedback } = await request.json()

    if (!submissionId || typeof approved !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields: submissionId, approved' },
        { status: 400 }
      )
    }

    // Find the submission
    const submission = await prisma.choreSubmission.findUnique({
      where: { id: submissionId },
      include: {
        chore: {
          select: {
            title: true,
            reward: true,
            familyId: true
          }
        },
        user: {
          select: {
            name: true,
            id: true
          }
        }
      }
    })

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    // Verify the submission belongs to the parent's family
    if (submission.chore.familyId !== session.user.familyId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Update the submission status
    const updatedSubmission = await prisma.choreSubmission.update({
      where: { id: submissionId },
      data: {
        status: approved ? 'APPROVED' : 'DENIED'
      }
    })

    // Create approval record
    await prisma.choreApproval.create({
      data: {
        submissionId: submissionId,
        approvedBy: session.user.id,
        approved: approved,
        feedback: feedback || null
      }
    })

    // If approved, create a reward record
    if (approved) {
      await prisma.reward.create({
        data: {
          userId: submission.user.id,
          title: `Completed: ${submission.chore.title}`,
          amount: submission.chore.reward,
          type: 'MONEY',
          awardedBy: session.user.id
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: approved 
        ? `Approved ${submission.chore.title} for ${submission.user.name}`
        : `Denied ${submission.chore.title} for ${submission.user.name}`
    })

  } catch (error) {
    console.error('Chore approval error:', error)
    return NextResponse.json(
      { error: 'Failed to process approval' },
      { status: 500 }
    )
  }
}