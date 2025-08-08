import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { convertDecimalsDeep } from '@/lib/utils'
import { getActiveFamilyId } from '@/lib/family'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // DEMO fallback: return mock parent dashboard for demo user
    if (session.user.id?.startsWith('parent-demo') || session.user.email === 'parent@demo.com') {
      const now = new Date()
      const children = [
        { id: 'child-demo-1', name: 'Noah (Demo Child)', email: 'child@demo.com', joinedAt: now }
      ]
      const dashboardData = {
        family: {
          name: 'Demo Family',
          totalChildren: children.length,
          weeklyAllowance: 0,
          settings: { autoApproveChores: false, allowMultipleParents: true, emailNotifications: true, shareReports: false, crossFamilyApproval: false }
        },
        weeklyStats: { totalChoresCompleted: 0, totalEarningsApproved: 0, childrenParticipation: '0%' },
        pendingApprovals: [],
        completedChores: [],
        children,
        recentActivity: [],
        permissions: { canInvite: true, canManage: true }
      }
      return NextResponse.json({ success: true, data: dashboardData })
    }

    // Resolve active familyId robustly and fetch basic family info and children list
    const familyId = await getActiveFamilyId(session.user.id)
    if (!familyId) {
      return NextResponse.json({ 
        error: 'No family found for user. Please contact support or set up your family.',
        code: 'NO_FAMILY'
      }, { status: 404 })
    }

    const [family, familyUsers] = await Promise.all([
      prisma.family.findUnique({
        where: { id: familyId },
        select: {
          id: true,
          name: true,
          autoApproveChores: true,
          allowMultipleParents: true,
          emailNotifications: true,
          shareReports: true,
          crossFamilyApproval: true,
          baseAllowance: true,
          stretchAllowance: true,
          pointsToMoneyRate: true
        }
      }),
      prisma.user.findMany({
        where: { familyId, role: 'CHILD' },
        select: { id: true, name: true, email: true, createdAt: true }
      })
    ])
    if (!family) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 })
    }

    // Get pending chore submissions for approval
    const pendingSubmissions = await prisma.choreSubmission.findMany({
      where: {
        assignment: {
          familyId: familyId
        },
        status: 'PENDING'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        },
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
        }
      },
      orderBy: { submittedAt: 'desc' }
    })

    // Get completed chore submissions (auto-approved and manually approved) from last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const completedSubmissions = await prisma.choreSubmission.findMany({
      where: {
        assignment: {
          familyId: familyId
        },
        status: {
          in: ['AUTO_APPROVED', 'APPROVED']
        },
        submittedAt: {
          gte: sevenDaysAgo
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        },
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
            originalReward: true,
            approvedAt: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' },
      take: 20 // Limit to recent 20 completed chores
    })

    // Get weekly stats
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    const weeklySubmissions = await prisma.choreSubmission.findMany({
      where: {
        assignment: {
          familyId: familyId
        },
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
                reward: true
              }
            }
          }
        }
      }
    })

    // Calculate stats
    const children = familyUsers
    
    const completedChores = weeklySubmissions.filter((s: any) => s.status === 'APPROVED')
    const totalEarnings = completedChores.reduce((sum: number, s: any) => sum + (s.assignment.chore.reward || 0), 0)
    const participationRate = children.length > 0 
      ? Math.round((completedChores.length / Math.max(children.length * 7, 1)) * 100) 
      : 0

    // Get recent activity
    const recentActivity = await prisma.choreSubmission.findMany({
      where: {
        assignment: {
          familyId: familyId
        }
      },
      include: {
        user: {
          select: {
            name: true
          }
        },
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
      },
      orderBy: { submittedAt: 'desc' },
      take: 5
    })

    // Handle family settings with fallback for missing fields
    const familySettings = {
      autoApproveChores: !!family.autoApproveChores,
      allowMultipleParents: family.allowMultipleParents !== undefined ? family.allowMultipleParents : true,
      emailNotifications: family.emailNotifications !== undefined ? family.emailNotifications : true,
      shareReports: !!family.shareReports,
      crossFamilyApproval: !!family.crossFamilyApproval
    }

    const dashboardData = {
      family: {
        name: family?.name || 'Unknown Family',
        totalChildren: children.length,
        weeklyAllowance: (Number(family?.baseAllowance || 0) + Number(family?.stretchAllowance || 0)),
        settings: familySettings
      },
      weeklyStats: {
        totalChoresCompleted: completedChores.length,
        totalEarningsApproved: totalEarnings,
        childrenParticipation: `${participationRate}%`
      },
      pendingApprovals: pendingSubmissions.map((submission: any) => ({
        id: submission.id,
        childName: submission.user.name,
        choreName: submission.assignment.chore.title,
        submittedAt: submission.submittedAt,
        reward: Number(submission.assignment.chore.reward || 0),
        points: Number(submission.assignment.chore.points || 0),
        status: submission.status,
        notes: submission.notes
      })),
      completedChores: completedSubmissions.map((submission: any) => ({
        id: submission.id,
        childName: submission.user.name,
        choreName: submission.assignment.chore.title,
        submittedAt: submission.submittedAt,
        completedAt: submission.completedAt,
        reward: submission.assignment.chore.reward,
        status: submission.status,
        notes: submission.notes,
        approval: submission.approval ? {
          approved: submission.approval.approved,
          feedback: submission.approval.feedback,
          score: submission.approval.score,
          partialReward: submission.approval.partialReward,
          originalReward: submission.approval.originalReward,
          approvedAt: submission.approval.approvedAt,
          isAutoApproved: submission.status === 'AUTO_APPROVED'
        } : null
      })),
      children: children.map((child: any) => ({
        id: child.id,
        name: child.name,
        email: child.email,
        joinedAt: child.createdAt
      })),
      recentActivity: recentActivity.map((activity: any) => ({
        id: activity.id,
        childName: activity.user.name,
        choreName: activity.assignment.chore.title,
        action: activity.status === 'APPROVED' ? 'completed' : 'submitted',
        reward: activity.assignment.chore.reward,
        timestamp: activity.submittedAt,
        score: activity.score,
        partialReward: activity.partialReward
      })),
      permissions: {
        canInvite: true,
        canManage: true
      }
    }

    return NextResponse.json(convertDecimalsDeep({
      success: true,
      data: dashboardData
    }))

  } catch (error) {
    console.error('Parent dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}