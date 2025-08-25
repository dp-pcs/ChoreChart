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

    // First, try to get user's primary family membership
    let familyMembership = null
    let family = null
    let familyId = null

    try {
      // Check if FamilyMembership table exists and has data
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
                      createdAt: true,
                      availablePoints: true,
                      lifetimePoints: true,
                      bankedPoints: true
                    }
                  }
                }
              }
            }
          }
        }
      })

      familyMembership = primaryFamilyMembership

      // If no primary family membership, try to get any active family membership
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

      if (familyMembership) {
        family = familyMembership.family
        familyId = family.id
      }
    } catch (error) {
      console.log('FamilyMembership query failed, likely table does not exist:', error instanceof Error ? error.message : String(error))
    }

    // Fallback: use direct family relationship if no family membership exists
    if (!familyMembership) {
      console.log('No family membership found, falling back to direct family relationship')
      
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          family: {
            include: {
              users: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                  createdAt: true,
                  availablePoints: true,
                  lifetimePoints: true,
                  bankedPoints: true
                }
              }
            }
          }
        }
      })

      if (!user?.family) {
        return NextResponse.json({ 
          error: 'No family found for user. Please contact support or set up your family.',
          code: 'NO_FAMILY'
        }, { status: 404 })
      }

      family = user.family
      familyId = family.id

      // Create a mock familyMembership structure for compatibility
      familyMembership = {
        family: {
          ...family,
          familyMemberships: family.users.map(u => ({
            user: u,
            role: u.role,
            isActive: true,
            isPrimary: true,
            canInvite: u.role === 'PARENT',
            canManage: u.role === 'PARENT'
          }))
        },
        canInvite: user.role === 'PARENT',
        canManage: user.role === 'PARENT'
      }
    }

    // Get pending chore submissions for approval
    const pendingSubmissions = familyId ? await prisma.choreSubmission.findMany({
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
    }) : []

    // Optional date filter (YYYY-MM-DD) to return completions for a specific day only
    const dateParam = request.nextUrl.searchParams.get('date')
    let dayStart: Date | null = null
    let dayEnd: Date | null = null
    if (dateParam) {
      const d = new Date(dateParam)
      dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate())
      dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
    }

    // Get completed chore submissions (auto-approved and manually approved)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const completedSubmissions = familyId ? await prisma.choreSubmission.findMany({
      where: {
        assignment: {
          familyId: familyId
        },
        status: {
          in: ['AUTO_APPROVED', 'APPROVED', 'DENIED']
        },
        ...(dayStart && dayEnd
          ? { completedAt: { gte: dayStart, lt: dayEnd } }
          : { submittedAt: { gte: sevenDaysAgo } }
        )
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
    }) : []

    // Get weekly stats
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    const weeklySubmissions = familyId ? await prisma.choreSubmission.findMany({
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
    }) : []

    // Calculate stats
    const children = (family as any)?.familyMemberships ? 
      (family as any).familyMemberships.filter((m: any) => m.role === 'CHILD' || (m.user && m.user.role === 'CHILD')) :
      (family as any)?.users ? (family as any).users.filter((u: any) => u.role === 'CHILD') : []
    
    const completedChores = weeklySubmissions.filter((s: any) => s.status === 'APPROVED')
    const totalEarnings = completedChores.reduce((sum: number, s: any) => sum + (s.assignment.chore.reward || 0), 0)
    const participationRate = children.length > 0 
      ? Math.round((completedChores.length / Math.max(children.length * 7, 1)) * 100) 
      : 0

    // Get recent activity
    const recentActivity = familyId ? await prisma.choreSubmission.findMany({
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
    }) : []

    // Handle family settings with fallback for missing fields
    const familySettings = {
      autoApproveChores: family?.autoApproveChores || false,
      allowMultipleParents: family?.allowMultipleParents !== undefined ? family.allowMultipleParents : true,
      emailNotifications: family?.emailNotifications !== undefined ? family.emailNotifications : true,
      shareReports: family?.shareReports || false,
      crossFamilyApproval: family?.crossFamilyApproval || false,
      pointsToMoneyRate: family?.pointsToMoneyRate || 1.0,
      enablePointsSystem: family?.enablePointsSystem !== undefined ? family.enablePointsSystem : true
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
        childId: submission.user.id,
        childName: submission.user.name,
        choreId: submission.assignment.chore.id,
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
      children: children.map((child: any) => {
        const childUser = child.user || child
        return {
          id: childUser.id,
          name: childUser.name,
          email: childUser.email,
          joinedAt: childUser.createdAt,
          availablePoints: Number(childUser.availablePoints || 0),
          lifetimePoints: Number(childUser.lifetimePoints || 0),
          bankedPoints: Number(childUser.bankedPoints || 0)
        }
      }),
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
        canInvite: familyMembership.canInvite !== undefined ? familyMembership.canInvite : true,
        canManage: familyMembership.canManage !== undefined ? familyMembership.canManage : true
      }
    }

    return NextResponse.json({
      success: true,
      data: dashboardData
    })

  } catch (error) {
    console.error('Parent dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}