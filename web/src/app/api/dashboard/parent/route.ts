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

    if (session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get user's primary family membership
    const primaryFamilyMembership = await prisma.familyMembership.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
        isPrimary: true
      },
      include: {
        family: {
          include: {
            familyMemberships: {
              where: { isActive: true },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true
                  }
                }
              }
            }
          }
        }
      }
    })

    // If no primary family membership, try to get any active family membership
    let familyMembership = primaryFamilyMembership
    if (!familyMembership) {
      familyMembership = await prisma.familyMembership.findFirst({
        where: {
          userId: session.user.id,
          isActive: true
        },
        include: {
          family: {
            include: {
              familyMemberships: {
                where: { isActive: true },
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      role: true,
                      createdAt: true
                    }
                  }
                }
              }
            }
          }
        }
      })
    }

    if (!familyMembership) {
      return NextResponse.json({ error: 'No active family membership found' }, { status: 404 })
    }

    const family = familyMembership.family
    const familyId = family.id

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
                reward: true
              }
            }
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
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
    const children = family.familyMemberships.filter((m: any) => m.role === 'CHILD')
    const completedChores = weeklySubmissions.filter((s: any) => s.status === 'APPROVED')
    const totalEarnings = completedChores.reduce((sum: number, s: any) => sum + s.assignment.chore.reward, 0)
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

    const dashboardData = {
      family: {
        name: family.name,
        totalChildren: children.length,
        weeklyAllowance: family.weeklyAllowance,
        settings: {
          autoApproveChores: family.autoApproveChores,
          allowMultipleParents: family.allowMultipleParents,
          emailNotifications: family.emailNotifications,
          shareReports: family.shareReports,
          crossFamilyApproval: family.crossFamilyApproval
        }
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
        reward: submission.assignment.chore.reward,
        status: submission.status,
        notes: submission.notes
      })),
      children: children.map((child: any) => ({
        id: child.user.id,
        name: child.user.name,
        email: child.user.email,
        joinedAt: child.createdAt
      })),
      recentActivity: recentActivity.map((activity: any) => ({
        id: activity.id,
        childName: activity.user.name,
        choreName: activity.assignment.chore.title,
        action: activity.status === 'APPROVED' ? 'completed' : 'submitted',
        reward: activity.assignment.chore.reward,
        timestamp: activity.submittedAt
      })),
      permissions: {
        canInvite: familyMembership.canInvite,
        canManage: familyMembership.canManage
      }
    }

    return NextResponse.json({
      success: true,
      data: dashboardData
    })

  } catch (error) {
    console.error('Parent dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}