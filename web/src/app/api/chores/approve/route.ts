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

    const { submissionId, approved, feedback, score } = await request.json()

    if (!submissionId || typeof approved !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields: submissionId, approved' },
        { status: 400 }
      )
    }

    // Validate score if provided (0-100)
    if (score !== undefined && (score < 0 || score > 100)) {
      return NextResponse.json(
        { error: 'Score must be between 0 and 100' },
        { status: 400 }
      )
    }

    // Find the submission
    const submission = await prisma.choreSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          include: {
            chore: {
              select: {
                title: true,
                reward: true,
                familyId: true
              }
            }
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
    if (submission.assignment.chore.familyId !== session.user.familyId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Calculate partial reward based on score
    let partialReward = submission.assignment.chore.reward
    let finalScore = score

    if (score !== undefined && approved) {
      // Calculate partial reward: score percentage of full reward
      partialReward = Math.round((score / 100) * submission.assignment.chore.reward)
      finalScore = score
    } else if (approved) {
      // If approved without score, give full reward
      partialReward = submission.assignment.chore.reward
      finalScore = 100
    } else {
      // If denied, no reward
      partialReward = 0
      finalScore = 0
    }

    // Update the submission status
    const updatedSubmission = await prisma.choreSubmission.update({
      where: { id: submissionId },
      data: {
        status: approved ? 'APPROVED' : 'DENIED',
        score: finalScore,
        partialReward: partialReward
      }
    })

    // Create approval record
    await prisma.choreApproval.create({
      data: {
        submissionId: submissionId,
        approvedBy: session.user.id,
        approved: approved,
        feedback: feedback || null,
        score: finalScore,
        partialReward: partialReward,
        originalReward: submission.assignment.chore.reward
      }
    })

    // If approved (even partially), create a reward record
    if (approved && partialReward > 0) {
      await prisma.reward.create({
        data: {
          userId: submission.user.id,
          title: `Completed: ${submission.assignment.chore.title}`,
          amount: partialReward,
          type: 'MONEY',
          awardedBy: session.user.id
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: approved 
        ? `Approved ${submission.assignment.chore.title} for ${submission.user.name} with ${finalScore}% quality score - $${partialReward} earned`
        : `Denied ${submission.assignment.chore.title} for ${submission.user.name}`,
      data: {
        score: finalScore,
        partialReward,
        originalReward: submission.assignment.chore.reward
      }
    })

  } catch (error) {
    console.error('Chore approval error:', error)
    return NextResponse.json(
      { error: 'Failed to process approval' },
      { status: 500 }
    )
  }
}