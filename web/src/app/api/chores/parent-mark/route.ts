import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma, Decimal } from '@/lib/prisma'

// Parent-driven marking of a child's chore for a specific date.
// Body: { childId: string, choreId: string, date?: string (ISO), approved: boolean, score?: number, feedback?: string }
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { childId, choreId, date, approved, score, feedback } = await request.json()

    if (!childId || !choreId || typeof approved !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields: childId, choreId, approved' },
        { status: 400 }
      )
    }

    // Validate score range if provided
    if (score !== undefined && (score < -100 || score > 150)) {
      return NextResponse.json(
        { error: 'Score must be between -100 and 150' },
        { status: 400 }
      )
    }

    // Validate parent and child are in the same family
    const child = await prisma.user.findUnique({ where: { id: childId }, select: { id: true, familyId: true, name: true } })
    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 })
    }
    if (child.familyId !== session.user.familyId) {
      return NextResponse.json({ error: 'Access denied: child not in your family' }, { status: 403 })
    }

    // Determine completedAt based on provided date (defaults to today)
    const completedAt = date ? new Date(date) : new Date()
    const startOfDay = new Date(completedAt.getFullYear(), completedAt.getMonth(), completedAt.getDate())
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)

    // Calculate week start (Monday) for assignment
    const dayOfWeek = completedAt.getDay()
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const weekStart = new Date(completedAt)
    weekStart.setDate(completedAt.getDate() - daysFromMonday)
    weekStart.setHours(0, 0, 0, 0)

    // Ensure an assignment exists for that week
    let assignment = await prisma.choreAssignment.findFirst({
      where: { choreId, userId: childId, weekStart },
      include: {
        chore: {
          select: { title: true, reward: true, points: true, familyId: true, isRequired: true }
        },
        family: {
          select: { pointsToMoneyRate: true }
        }
      }
    })

    if (!assignment) {
      const chore = await prisma.chore.findUnique({ where: { id: choreId }, select: { familyId: true, title: true, reward: true, points: true } })
      if (!chore) {
        return NextResponse.json({ error: 'Chore not found' }, { status: 404 })
      }
      assignment = await prisma.choreAssignment.create({
        data: { choreId, userId: childId, familyId: chore.familyId, weekStart },
        include: {
          chore: { select: { title: true, reward: true, points: true, familyId: true } },
          family: { select: { pointsToMoneyRate: true } }
        }
      })
    }

    // Find existing submission for the selected date
    let submission = await prisma.choreSubmission.findFirst({
      where: {
        assignmentId: assignment.id,
        userId: childId,
        completedAt: { gte: startOfDay, lt: endOfDay }
      }
    })

    const chorePoints = assignment.chore.points || new Decimal(0)
    const pointsToMoneyRate = assignment.family.pointsToMoneyRate || 1.0

    const roundTo = (val: number, places: number) => {
      const m = Math.pow(10, places)
      return Math.round(val * m) / m
    }
    let finalScore = score !== undefined ? score : approved ? 100 : 0
    let pointsAwarded = new Decimal(0)
    if (finalScore !== undefined) {
      pointsAwarded = new Decimal(roundTo((finalScore / 100) * chorePoints.toNumber(), 1))
    }

    if (!submission) {
      submission = await prisma.choreSubmission.create({
        data: {
          assignmentId: assignment.id,
          userId: childId,
          completedAt,
          status: approved ? 'APPROVED' : 'DENIED',
          score: finalScore,
          partialReward: new Decimal(Math.round(pointsAwarded.toNumber() * pointsToMoneyRate * 100) / 100),
          pointsAwarded: approved ? pointsAwarded : new Decimal(0)
        }
      })
    } else {
      submission = await prisma.choreSubmission.update({
        where: { id: submission.id },
        data: {
          status: approved ? 'APPROVED' : 'DENIED',
          score: finalScore,
          partialReward: new Decimal(Math.round(pointsAwarded.toNumber() * pointsToMoneyRate * 100) / 100),
          pointsAwarded: approved ? pointsAwarded : new Decimal(0)
        }
      })
    }

    // Upsert approval record (unique on submissionId) and compute point delta
    const existingApproval = await prisma.choreApproval.findUnique({
      where: { submissionId: submission.id },
      select: { pointsAwarded: true, approved: true }
    })

    let newPointsAwarded = new Decimal(0)
    if (approved) {
      newPointsAwarded = pointsAwarded
    } else {
      if (score !== undefined) {
        newPointsAwarded = pointsAwarded
      } else if (assignment.chore.isRequired) {
        newPointsAwarded = new Decimal(-roundTo(chorePoints.toNumber(), 1))
      } else {
        newPointsAwarded = new Decimal(0)
      }
    }

    await prisma.choreApproval.upsert({
      where: { submissionId: submission.id },
      update: {
        approvedBy: session.user.id,
        approved,
        feedback: feedback || null,
        score: finalScore,
        partialReward: new Decimal(Math.round(newPointsAwarded.toNumber() * pointsToMoneyRate * 100) / 100),
        originalReward: assignment.chore.reward,
        pointsAwarded: newPointsAwarded,
        originalPoints: chorePoints
      },
      create: {
        submissionId: submission.id,
        approvedBy: session.user.id,
        approved,
        feedback: feedback || null,
        score: finalScore,
        partialReward: new Decimal(Math.round(newPointsAwarded.toNumber() * pointsToMoneyRate * 100) / 100),
        originalReward: assignment.chore.reward,
        pointsAwarded: newPointsAwarded,
        originalPoints: chorePoints
      }
    })

    // Adjust child's points based on change vs existing approval
    const previousPoints = existingApproval?.pointsAwarded ? new Decimal(existingApproval.pointsAwarded) : new Decimal(0)
    const delta = newPointsAwarded.minus(previousPoints)
    if (!delta.isZero() || (existingApproval && existingApproval.approved && !approved)) {
      await prisma.user.update({
        where: { id: childId },
        data: {
          availablePoints: { increment: delta },
          lifetimePoints: { increment: delta.isNegative() ? new Decimal(0) : delta }
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: approved
        ? `Marked complete: ${assignment.chore.title} for ${child.name} on ${completedAt.toLocaleDateString()}`
        : `Marked denied: ${assignment.chore.title} for ${child.name} on ${completedAt.toLocaleDateString()}`,
      data: {
        submissionId: submission.id,
        score: finalScore,
        pointsAwarded: approved ? pointsAwarded.toNumber() : 0,
        money: Math.round(pointsAwarded.toNumber() * pointsToMoneyRate * 100) / 100
      }
    })

  } catch (error) {
    console.error('Parent mark error:', error)
    return NextResponse.json({ error: 'Failed to update chore status' }, { status: 500 })
  }
}


