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
                reward: true,
                points: true
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
            pointsAwarded: true,
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
            points: true,
            estimatedMinutes: true,
            isRequired: true,
            frequency: true,
            type: true,
            scheduledDays: true
          }
        },
        submissions: {
          where: {
            completedAt: {
              gte: weekStart,
              lte: weekEnd
            }
          },
          select: {
            id: true,
            completedAt: true,
            status: true
          }
        }
      },
      orderBy: { weekStart: 'desc' }
    })

    // Format submissions with necessary data including points
    const formattedSubmissions = submissions.map(submission => ({
      id: submission.id,
      choreId: submission.assignment.chore.id,
      choreName: submission.assignment.chore.title,
      reward: Number(submission.assignment.chore.reward || 0),
      points: Number(submission.assignment.chore.points || 0),
      status: submission.status,
      submittedAt: submission.submittedAt,
      completedAt: submission.completedAt,
      notes: submission.notes,
      pointsAwarded: submission.pointsAwarded ? Number(submission.pointsAwarded) : null,
      approval: submission.approval ? {
        approved: submission.approval.approved,
        feedback: submission.approval.feedback,
        score: submission.approval.score,
        partialReward: submission.approval.partialReward ? Number(submission.approval.partialReward) : null,
        pointsAwarded: submission.approval.pointsAwarded ? Number(submission.approval.pointsAwarded) : null,
        approvedAt: submission.approval.approvedAt
      } : null
    }))

    // Get today's date for checking if chore is due today
    const today = now.getDay() // 0 = Sunday

    // Format assigned chores with completion status
    const formattedChores = assignments.map(assignment => {
      // Check if submitted today
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
      const submittedToday = assignment.submissions.some(s =>
        new Date(s.completedAt) >= todayStart && new Date(s.completedAt) < todayEnd
      )

      // Check if this chore is due today based on scheduledDays
      const scheduledDays = assignment.chore.scheduledDays || []
      const isDueToday = scheduledDays.length === 0 || scheduledDays.includes(today)

      return {
        id: assignment.chore.id,
        title: assignment.chore.title,
        description: assignment.chore.description,
        reward: Number(assignment.chore.reward || 0),
        points: Number(assignment.chore.points || 0),
        estimatedMinutes: assignment.chore.estimatedMinutes,
        isRequired: assignment.chore.isRequired,
        frequency: assignment.chore.frequency,
        type: assignment.chore.type,
        scheduledDays: scheduledDays,
        assignmentId: assignment.id,
        weekStart: assignment.weekStart,
        isDueToday,
        submittedToday,
        submissionsThisWeek: assignment.submissions.length
      }
    })

    // Calculate weekly stats - now focused on points
    const approvedSubmissions = submissions.filter(s =>
      s.status === 'APPROVED' || s.status === 'AUTO_APPROVED'
    )

    // Calculate total points earned this week
    const totalPointsEarned = approvedSubmissions.reduce((sum, s) => {
      const pointsAwarded = s.approval?.pointsAwarded?.toNumber() ||
        s.pointsAwarded?.toNumber() ||
        s.assignment.chore.points?.toNumber() || 0
      return sum + pointsAwarded
    }, 0)

    // Calculate total earnings (money equivalent)
    const pointsToMoneyRate = user.family?.pointsToMoneyRate || 1.00
    const totalEarnings = Math.round(totalPointsEarned * pointsToMoneyRate * 100) / 100

    const completedCount = approvedSubmissions.length
    const pendingCount = submissions.filter(s => s.status === 'PENDING').length
    const deniedCount = submissions.filter(s => s.status === 'DENIED').length

    // For completion rate, count chores due today that are done
    const choresDueToday = formattedChores.filter(c => c.isDueToday)
    const choresDoneTodayCount = choresDueToday.filter(c => c.submittedToday).length
    const completionRate = choresDueToday.length > 0
      ? Math.round((choresDoneTodayCount / choresDueToday.length) * 100)
      : 100 // If no chores due today, 100% complete

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
        pointsToMoneyRate: pointsToMoneyRate
      },
      submissions: formattedSubmissions,
      assignedChores: formattedChores,
      weeklyStats: {
        totalPointsEarned,
        totalEarnings,
        completedCount,
        pendingCount,
        deniedCount,
        totalAssigned: formattedChores.length,
        choresDueToday: choresDueToday.length,
        choresDoneToday: choresDoneTodayCount,
        completionRate
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