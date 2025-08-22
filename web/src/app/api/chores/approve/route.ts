import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma, Decimal } from '@/lib/prisma'

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
                familyId: true,
                isRequired: true
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
    const roundTo = (val: number, places: number) => {
      const m = Math.pow(10, places)
      return Math.round(val * m) / m
    }
    const computePointsFromScore = (pct: number) => new Decimal(roundTo((pct / 100) * chorePoints.toNumber(), 1))

    let pointsAwarded = new Decimal(0)
    let finalScore = score

    if (approved) {
      if (score !== undefined) {
        // partial/bonus/penalty by score
        pointsAwarded = computePointsFromScore(score)
        finalScore = score
      } else {
        // full points
        pointsAwarded = new Decimal(roundTo(chorePoints.toNumber(), 1))
        finalScore = 100
      }
    } else {
      // Denied: if score specified use it, otherwise apply penalty only for required chores
      if (score !== undefined) {
        pointsAwarded = computePointsFromScore(score)
        finalScore = score
      } else if (submission.assignment.chore.isRequired) {
        // Full deduction for required chores
        pointsAwarded = new Decimal(-roundTo(chorePoints.toNumber(), 1))
        finalScore = 0
      } else {
        pointsAwarded = new Decimal(0)
        finalScore = 0
      }
    }

    // Calculate dollar equivalent for legacy compatibility
    const partialReward = Math.round(pointsAwarded.toNumber() * pointsToMoneyRate * 100) / 100

    // Update the submission status and awarded points on the submission
    const updatedSubmission = await prisma.choreSubmission.update({
      where: { id: submissionId },
      data: {
        status: approved ? 'APPROVED' : 'DENIED',
        score: finalScore,
        partialReward: new Decimal(partialReward),
        pointsAwarded: pointsAwarded
      }
    })

    // Upsert approval record to allow re-approvals/denials and compute delta
    const existingApproval = await prisma.choreApproval.findUnique({
      where: { submissionId },
      select: { pointsAwarded: true, approved: true }
    })

    await prisma.choreApproval.upsert({
      where: { submissionId },
      update: {
        approvedBy: session.user.id,
        approved: approved,
        feedback: feedback || null,
        score: finalScore,
        partialReward: new Decimal(partialReward),
        originalReward: submission.assignment.chore.reward,
        pointsAwarded: pointsAwarded,
        originalPoints: chorePoints
      },
      create: {
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

    // Adjust child's points by delta vs any previous approval, and only add to lifetimePoints when positive
    const previousPoints = existingApproval?.pointsAwarded ? new Decimal(existingApproval.pointsAwarded) : new Decimal(0)
    const delta = pointsAwarded.minus(previousPoints)
    if (!delta.isZero() || (existingApproval && existingApproval.approved !== approved)) {
      await prisma.user.update({
        where: { id: submission.user.id },
        data: {
          availablePoints: { increment: delta },
          lifetimePoints: { increment: delta.isNegative() ? new Decimal(0) : delta }
        }
      })
    }

    return NextResponse.json({
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
    })

  } catch (error) {
    console.error('Chore approval error:', error)
    return NextResponse.json(
      { error: 'Failed to process approval' },
      { status: 500 }
    )
  }
}