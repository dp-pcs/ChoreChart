import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma, Decimal } from '@/lib/prisma'
import { convertDecimalsDeep } from '@/lib/utils'

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

    // Validate score if provided (-100 to 150 to allow deductions and bonuses)
    if (score !== undefined && (score < -100 || score > 150)) {
      return NextResponse.json(
        { error: 'Score must be between -100 and 150' },
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
                points: true,
                familyId: true
              }
            },
            family: {
              select: {
                pointsToMoneyRate: true
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

    // Calculate points awarded based on score (points are now primary)
    const chorePoints = submission.assignment.chore.points || new Decimal(0)
    const pointsToMoneyRate = submission.assignment.family.pointsToMoneyRate || 1.00
    let pointsAwarded = chorePoints
    let finalScore = score

    if (score !== undefined && approved) {
      // Calculate partial/bonus/penalty points: score percentage of full points
      // This allows for bonuses (>100%) and penalties (negative scores)
      pointsAwarded = new Decimal(Math.round((score / 100) * chorePoints.toNumber()))
      finalScore = score
    } else if (approved) {
      // If approved without score, give full points
      pointsAwarded = chorePoints
      finalScore = 100
    } else {
      // If denied, no points (but could still have negative score as penalty)
      pointsAwarded = score !== undefined ? new Decimal(Math.round((score / 100) * chorePoints.toNumber())) : new Decimal(0)
      finalScore = score !== undefined ? score : 0
    }

    // Calculate dollar equivalent for legacy compatibility
    const partialReward = Math.round(pointsAwarded.toNumber() * pointsToMoneyRate * 100) / 100

    // Update the submission status
    const updatedSubmission = await prisma.choreSubmission.update({
      where: { id: submissionId },
      data: {
        status: approved ? 'APPROVED' : 'DENIED',
        score: finalScore,
        partialReward: new Decimal(partialReward),
        pointsAwarded: pointsAwarded
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
        partialReward: new Decimal(partialReward),
        originalReward: submission.assignment.chore.reward,
        pointsAwarded: pointsAwarded,
        originalPoints: chorePoints
      }
    })

    // If approved (even partially), award points to user and create reward record
    if (approved && pointsAwarded.toNumber() > 0) {
      // Update user's points balance
      await prisma.user.update({
        where: { id: submission.user.id },
        data: {
          availablePoints: { increment: pointsAwarded },
          lifetimePoints: { increment: pointsAwarded }
        }
      })

      // Create a reward record for tracking (dollar amount is now calculated from points)
      await prisma.reward.create({
        data: {
          userId: submission.user.id,
          title: `Completed: ${submission.assignment.chore.title}`,
          amount: partialReward, // Dollar equivalent
          type: 'MONEY',
          awardedBy: session.user.id
        }
      })
    }

    return NextResponse.json(convertDecimalsDeep({
      success: true,
      message: approved 
        ? `Approved ${submission.assignment.chore.title} for ${submission.user.name} with ${finalScore}% quality score - ${pointsAwarded.toNumber()} points earned ($${partialReward})`
        : `Denied ${submission.assignment.chore.title} for ${submission.user.name}`,
      data: {
        score: finalScore,
        pointsAwarded: pointsAwarded.toNumber(),
        partialReward,
        originalPoints: chorePoints.toNumber(),
        originalReward: submission.assignment.chore.reward
      }
    }))

  } catch (error) {
    console.error('Chore approval error:', error)
    return NextResponse.json(
      { error: 'Failed to process approval' },
      { status: 500 }
    )
  }
}