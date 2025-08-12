import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-simple'
import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

// GET: Get family allowance settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Only parents can view allowance settings' }, { status: 403 })
    }

    const family = await prisma.family.findUnique({
      where: { id: session.user.familyId },
      select: {
        baseAllowance: true,
        stretchAllowance: true,
        allowBudgetOverrun: true,
        pointsToMoneyRate: true,
        chores: {
          select: {
            id: true,
            title: true,
            points: true,
            priority: true,
            frequency: true,
            scheduledDays: true,
            assignments: {
              select: {
                userId: true,
                user: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!family) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 })
    }

    // Calculate total potential earnings per week
    const totalWeeklyPotential = family.chores.reduce((total, chore) => {
      const chorePoints = Number(chore.points)
      let weeklyOccurrences = 1 // default
      
      if (chore.frequency === 'DAILY') {
        weeklyOccurrences = chore.scheduledDays?.length || 1
      } else if (chore.frequency === 'WEEKLY') {
        weeklyOccurrences = 1
      }
      
      return total + (chorePoints * weeklyOccurrences * chore.assignments.length)
    }, 0)

    const baseAllowanceAmount = Number(family.baseAllowance)
    const stretchAllowanceAmount = Number(family.stretchAllowance)
    const totalAllowanceBudget = baseAllowanceAmount + stretchAllowanceAmount

    return NextResponse.json({
      success: true,
      settings: {
        baseAllowance: baseAllowanceAmount,
        stretchAllowance: stretchAllowanceAmount,
        totalBudget: totalAllowanceBudget,
        allowBudgetOverrun: family.allowBudgetOverrun,
        pointsToMoneyRate: family.pointsToMoneyRate
      },
      analysis: {
        totalWeeklyPotential,
        stretchBudgetDifference: totalWeeklyPotential - stretchAllowanceAmount,
        isOverStretchBudget: totalWeeklyPotential > stretchAllowanceAmount,
        // Legacy fields for backward compatibility
        budgetDifference: totalWeeklyPotential - stretchAllowanceAmount,
        isOverBudget: totalWeeklyPotential > stretchAllowanceAmount
      },
      chores: family.chores
    })

  } catch (error) {
    console.error('Family allowance GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch allowance settings' },
      { status: 500 }
    )
  }
}

// PUT: Update family allowance settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Only parents can update allowance settings' }, { status: 403 })
    }

    const { baseAllowance, stretchAllowance, allowBudgetOverrun, choreUpdates } = await request.json()

    // Validate inputs
    if (baseAllowance < 0 || stretchAllowance < 0) {
      return NextResponse.json(
        { error: 'Allowance amounts must be non-negative' },
        { status: 400 }
      )
    }

    // Update family allowance settings
    const updatedFamily = await prisma.family.update({
      where: { id: session.user.familyId },
      data: {
        baseAllowance: new Decimal(baseAllowance),
        stretchAllowance: new Decimal(stretchAllowance),
        allowBudgetOverrun: Boolean(allowBudgetOverrun)
      }
    })

    // Update individual chore values if provided
    if (choreUpdates && Array.isArray(choreUpdates)) {
      for (const update of choreUpdates) {
        await prisma.chore.update({
          where: { 
            id: update.choreId,
            familyId: session.user.familyId // Security: ensure chore belongs to this family
          },
          data: {
            points: new Decimal(update.points),
            priority: update.priority || 'MEDIUM'
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Allowance settings updated successfully!',
      settings: {
        baseAllowance: Number(updatedFamily.baseAllowance),
        stretchAllowance: Number(updatedFamily.stretchAllowance),
        allowBudgetOverrun: updatedFamily.allowBudgetOverrun
      }
    })

  } catch (error) {
    console.error('Family allowance PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update allowance settings' },
      { status: 500 }
    )
  }
}

// POST: Auto-calculate chore values based on allowance
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Only parents can auto-calculate chore values' }, { status: 403 })
    }

    const { baseAllowance, stretchAllowance } = await request.json()

    // Get all family chores
    const chores = await prisma.chore.findMany({
      where: { familyId: session.user.familyId },
      include: {
        assignments: {
          select: { userId: true }
        }
      }
    })

    // Calculate total weekly chore instances
    let totalWeeklyChoreInstances = 0
    chores.forEach(chore => {
      let weeklyOccurrences = 1
      
      if (chore.frequency === 'DAILY') {
        weeklyOccurrences = chore.scheduledDays?.length || 1
      } else if (chore.frequency === 'WEEKLY') {
        weeklyOccurrences = 1
      }
      
      totalWeeklyChoreInstances += weeklyOccurrences * chore.assignments.length
    })

    if (totalWeeklyChoreInstances === 0) {
      return NextResponse.json({
        success: false,
        error: 'No chores found to calculate values for'
      }, { status: 400 })
    }

    // Calculate base value per chore (stretch allowance divided by total instances)
    const stretchBudget = Number(stretchAllowance) || 0
    const baseValuePerChore = stretchBudget / totalWeeklyChoreInstances

    // Apply priority multipliers
    const priorityMultipliers = {
      'LOW': 0.75,
      'MEDIUM': 1.0,
      'HIGH': 1.5
    }

    // Calculate recommended values
    const recommendations = chores.map(chore => {
      let weeklyOccurrences = 1
      
      if (chore.frequency === 'DAILY') {
        weeklyOccurrences = chore.scheduledDays?.length || 1
      }
      
      const priority = chore.priority || 'MEDIUM'
      const multiplier = priorityMultipliers[priority] || 1.0
      const recommendedValue = Math.round((baseValuePerChore * multiplier) * 100) / 100

      return {
        choreId: chore.id,
        title: chore.title,
        currentPoints: Number(chore.points),
        recommendedPoints: recommendedValue,
        priority: priority,
        weeklyOccurrences,
        assigneeCount: chore.assignments.length
      }
    })

    // Calculate totals for verification
    const totalRecommendedWeekly = recommendations.reduce((total, rec) => 
      total + (rec.recommendedPoints * rec.weeklyOccurrences * rec.assigneeCount), 0
    )

    return NextResponse.json({
      success: true,
      recommendations,
      analysis: {
        totalChoreInstances: totalWeeklyChoreInstances,
        baseValuePerChore: Math.round(baseValuePerChore * 100) / 100,
        totalRecommendedWeekly: Math.round(totalRecommendedWeekly * 100) / 100,
        stretchBudget: stretchBudget,
        isWithinBudget: totalRecommendedWeekly <= stretchBudget
      }
    })

  } catch (error) {
    console.error('Auto-calculate chore values error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate recommended chore values' },
      { status: 500 }
    )
  }
}