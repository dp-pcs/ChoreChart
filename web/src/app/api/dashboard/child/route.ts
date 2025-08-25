import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'CHILD') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get user's family and point balance
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        familyId: true,
        availablePoints: true,
        lifetimePoints: true,
        bankedMoney: true,
        bankedPoints: true,
        family: {
          select: {
            id: true,
            pointsToMoneyRate: true
          }
        }
      }
    })

    if (!user?.familyId) {
      return NextResponse.json({ error: 'User has no family' }, { status: 400 })
    }

    // Get current week's date range
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    weekStart.setHours(0, 0, 0, 0)

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    // Get user's chore submissions for this week
    const submissions = await prisma.choreSubmission.findMany({
      where: {
        userId: session.user.id,
        submittedAt: {
          gte: weekStart,
          lte: weekEnd
        }
      },
      include: {
        assignment: {
          include: {
            chore: {
              select: {
                id: true,
                title: true,
                reward: true
              }
            }
          }
        },
        approval: {
          select: {
            approved: true,
            feedback: true,
            score: true,
            partialReward: true,
            approvedAt: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    })

    // Get assigned chores for the current week
    const assignments = await prisma.choreAssignment.findMany({
      where: {
        userId: session.user.id,
        familyId: user.familyId,
        weekStart: {
          lte: now
        }
      },
      include: {
        chore: {
          select: {
            id: true,
            title: true,
            description: true,
            reward: true,
            estimatedMinutes: true,
            isRequired: true,
            frequency: true,
            type: true
          }
        }
      },
      orderBy: { weekStart: 'desc' }
    })

    // Format submissions with necessary data
    const formattedSubmissions = submissions.map(submission => ({
      id: submission.id,
      choreId: submission.assignment.chore.id,
      choreName: submission.assignment.chore.title,
      reward: submission.assignment.chore.reward,
      status: submission.status,
      submittedAt: submission.submittedAt,
      completedAt: submission.completedAt,
      notes: submission.notes,
      approval: submission.approval ? {
        approved: submission.approval.approved,
        feedback: submission.approval.feedback,
        score: submission.approval.score,
        partialReward: submission.approval.partialReward,
        approvedAt: submission.approval.approvedAt
      } : null
    }))

    // Format assigned chores
    const formattedChores = assignments.map(assignment => ({
      id: assignment.chore.id,
      title: assignment.chore.title,
      description: assignment.chore.description,
      reward: assignment.chore.reward,
      estimatedMinutes: assignment.chore.estimatedMinutes,
      isRequired: assignment.chore.isRequired,
      frequency: assignment.chore.frequency,
      type: assignment.chore.type,
      assignmentId: assignment.id,
      weekStart: assignment.weekStart
    }))

    // Calculate weekly stats
    const approvedSubmissions = submissions.filter(s => 
      s.status === 'APPROVED' || s.status === 'AUTO_APPROVED'
    )
    const totalEarnings = approvedSubmissions.reduce((sum, s) => 
      sum + (s.approval?.partialReward?.toNumber() || s.assignment.chore.reward?.toNumber() || 0), 0
    )
    const completedCount = approvedSubmissions.length
    const totalAssigned = assignments.length
    const completionRate = totalAssigned > 0 ? Math.round((completedCount / totalAssigned) * 100) : 0

    const dashboardData = {
      user: {
        id: session.user.id,
        name: session.user.name,
        role: session.user.role,
        availablePoints: Number(user.availablePoints || 0),
        lifetimePoints: Number(user.lifetimePoints || 0),
        bankedMoney: Number(user.bankedMoney || 0),
        bankedPoints: Number(user.bankedPoints || 0)
      },
      family: {
        id: user.familyId,
        pointsToMoneyRate: user.family?.pointsToMoneyRate || 1.00
      },
      submissions: formattedSubmissions,
      assignedChores: formattedChores,
      weeklyStats: {
        totalEarnings,
        completedCount,
        totalAssigned,
        completionRate,
        pendingCount: submissions.filter(s => s.status === 'PENDING').length
      }
    }

    return NextResponse.json({
      success: true,
      data: dashboardData
    })

  } catch (error) {
    console.error('Child dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}