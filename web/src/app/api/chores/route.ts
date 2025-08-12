import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-simple'
import { prisma } from '@/lib/prisma'
import { getWeekStart, convertDecimalsDeep } from '@/lib/utils'
import { getActiveFamilyId } from '@/lib/family'

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Resolve active family context
    const familyId = await getActiveFamilyId(session.user.id)
    if (!familyId) {
      return NextResponse.json({ error: 'User has no family' }, { status: 400 })
    }
    
    // Get all chores for the family
    const chores = await prisma.chore.findMany({
      where: { familyId },
      include: {
        assignments: {
          include: {
            user: {
              select: { name: true, id: true }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    return NextResponse.json(convertDecimalsDeep({ chores }))
    
  } catch (error) {
    console.error('Error fetching chores:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chores' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Only parents can create chores' }, { status: 403 })
    }

    const {
      title,
      description,
      reward,
      estimatedMinutes,
      frequency,
      selectedDays,
      isRequired,
      assignedChildIds
    } = await request.json()

    // Validate required fields only
    if (!title) {
      return NextResponse.json(
        { error: 'Missing required field: title' },
        { status: 400 }
      )
    }

    const familyId = await getActiveFamilyId(session.user.id)
    if (!familyId) {
      return NextResponse.json({ error: 'User has no family' }, { status: 400 })
    }

    // Map frequency to proper enum values
    const choreType = frequency === 'once' ? 'ONE_TIME' : 
                     frequency === 'daily' ? 'DAILY' : 
                     frequency === 'weekly' ? 'WEEKLY' : 'CUSTOM'
    
    const choreFrequency = frequency === 'once' ? 'AS_NEEDED' : 
                          frequency === 'daily' ? 'DAILY' : 
                          frequency === 'weekly' ? 'WEEKLY' :
                          frequency === 'monthly' ? 'MONTHLY' : 'AS_NEEDED'

    // Get family children for auto-assignment if no specific children selected
    let targetChildIds = assignedChildIds
    if (!assignedChildIds || assignedChildIds.length === 0) {
      // Auto-assign to all children in the family
        const familyChildren = await prisma.user.findMany({
        where: {
          familyId,
          role: 'CHILD'
        },
        select: { id: true }
      })
      targetChildIds = familyChildren.map(child => child.id)
    }

    // Create the chore
    const chore = await prisma.chore.create({
      data: {
        title,
        description: description || '',
        reward: reward || 0,
        estimatedMinutes: estimatedMinutes || 15,
        isRequired: Boolean(isRequired),
        familyId,
        type: choreType,
        frequency: choreFrequency,
        scheduledDays: selectedDays || [],
        assignments: {
          create: targetChildIds.map((childId: string) => ({
            userId: childId,
            familyId,
            weekStart: getWeekStart(new Date())
          }))
        }
      },
      include: {
        assignments: {
          include: {
            user: {
              select: { name: true, id: true }
            }
          }
        }
      }
    })

    return NextResponse.json(convertDecimalsDeep({ 
      success: true, 
      chore,
      message: `Chore "${title}" created successfully!`
    }))
    
  } catch (error) {
    console.error('Error creating chore:', error)
    return NextResponse.json(
      { error: 'Failed to create chore' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Only parents can edit chores' }, { status: 403 })
    }

    const {
      choreId,
      title,
      description,
      reward,
      estimatedMinutes,
      frequency,
      selectedDays,
      isRequired,
      assignedChildIds
    } = await request.json()

    if (!choreId) {
      return NextResponse.json(
        { error: 'Missing required field: choreId' },
        { status: 400 }
      )
    }

    const familyId = await getActiveFamilyId(session.user.id)
    if (!familyId) {
      return NextResponse.json({ error: 'User has no family' }, { status: 400 })
    }

    // Verify chore belongs to user's family
    const existingChore = await prisma.chore.findFirst({ where: { id: choreId, familyId } })

    if (!existingChore) {
      return NextResponse.json({ error: 'Chore not found or access denied' }, { status: 404 })
    }

    // Map frequency to proper enum values
    const choreType = frequency === 'once' ? 'ONE_TIME' : 
                     frequency === 'daily' ? 'DAILY' : 
                     frequency === 'weekly' ? 'WEEKLY' : 'CUSTOM'
    
    const choreFrequency = frequency === 'once' ? 'AS_NEEDED' : 
                          frequency === 'daily' ? 'DAILY' : 
                          frequency === 'weekly' ? 'WEEKLY' :
                          frequency === 'monthly' ? 'MONTHLY' : 'AS_NEEDED'

    // Update the chore
    const updatedChore = await prisma.chore.update({
      where: { id: choreId },
      data: {
        title: title || existingChore.title,
        description: description !== undefined ? description : existingChore.description,
        reward: reward !== undefined ? reward : existingChore.reward,
        estimatedMinutes: estimatedMinutes !== undefined ? estimatedMinutes : existingChore.estimatedMinutes,
        isRequired: isRequired !== undefined ? isRequired : existingChore.isRequired,
        type: choreType,
        frequency: choreFrequency,
        scheduledDays: selectedDays || existingChore.scheduledDays,
      },
      include: {
        assignments: {
          include: {
            user: {
              select: { name: true, id: true }
            }
          }
        }
      }
    })

    // Update assignments if provided
    if (assignedChildIds !== undefined) {
      // Delete existing assignments
      await prisma.choreAssignment.deleteMany({
        where: { choreId }
      })

      // Determine target children
      let targetChildIds = assignedChildIds
      if (!assignedChildIds || assignedChildIds.length === 0) {
        // Auto-assign to all children in the family
        const familyChildren = await prisma.user.findMany({
          where: {
            familyId,
            role: 'CHILD'
          },
          select: { id: true }
        })
        targetChildIds = familyChildren.map(child => child.id)
      }

      // Create new assignments
      if (targetChildIds.length > 0) {
        await prisma.choreAssignment.createMany({
          data: targetChildIds.map((childId: string) => ({
            choreId,
            userId: childId,
            familyId,
            weekStart: getWeekStart(new Date())
          }))
        })
      }
    }

    return NextResponse.json({ 
      success: true, 
      chore: updatedChore,
      message: `Chore "${title || existingChore.title}" updated successfully!`
    })
    
  } catch (error) {
    console.error('Error updating chore:', error)
    return NextResponse.json(
      { error: 'Failed to update chore' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Only parents can delete chores' }, { status: 403 })
    }

    const { choreId } = await request.json()

    if (!choreId) {
      return NextResponse.json(
        { error: 'Missing required field: choreId' },
        { status: 400 }
      )
    }

    // Get user's family
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { familyId: true }
    })

    if (!user?.familyId) {
      return NextResponse.json({ error: 'User has no family' }, { status: 400 })
    }

    // Verify chore belongs to user's family
    const existingChore = await prisma.chore.findFirst({
      where: {
        id: choreId,
        familyId: user.familyId
      }
    })

    if (!existingChore) {
      return NextResponse.json({ error: 'Chore not found or access denied' }, { status: 404 })
    }

    // Delete assignments first (due to foreign key constraints)
    await prisma.choreAssignment.deleteMany({
      where: { choreId }
    })

    // Delete submissions and approvals
    const submissions = await prisma.choreSubmission.findMany({
      where: {
        assignment: {
          choreId: choreId
        }
      },
      select: { id: true }
    })

    if (submissions.length > 0) {
      const submissionIds = submissions.map(s => s.id)
      
      await prisma.choreApproval.deleteMany({
        where: { submissionId: { in: submissionIds } }
      })
      
      await prisma.choreSubmission.deleteMany({
        where: { id: { in: submissionIds } }
      })
    }

    // Delete the chore
    await prisma.chore.delete({
      where: { id: choreId }
    })

    return NextResponse.json({ 
      success: true, 
      message: `Chore "${existingChore.title}" deleted successfully!`
    })
    
  } catch (error) {
    console.error('Error deleting chore:', error)
    return NextResponse.json(
      { error: 'Failed to delete chore' },
      { status: 500 }
    )
  }
}