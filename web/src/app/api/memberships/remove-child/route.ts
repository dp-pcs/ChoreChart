import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-simple'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Only parents can remove children' }, { status: 403 })
    }

    const { childId } = await request.json()

    if (!childId) {
      return NextResponse.json(
        { error: 'Child ID is required' },
        { status: 400 }
      )
    }

    // Verify the child exists and belongs to the parent's family
    const parentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { familyId: true }
    })

    if (!parentUser) {
      return NextResponse.json({ error: 'Parent user not found' }, { status: 404 })
    }

    const childUser = await prisma.user.findUnique({
      where: { id: childId },
      include: {
        familyMemberships: true
      }
    })

    if (!childUser) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 })
    }

    // Check if child is in the same family as parent
    const isInSameFamily = childUser.familyId === parentUser.familyId || 
      childUser.familyMemberships.some((membership: { familyId: string }) => membership.familyId === parentUser.familyId)

    if (!isInSameFamily) {
      return NextResponse.json({ error: 'Child is not in your family' }, { status: 403 })
    }

    // Start transaction to clean up all child data
    await prisma.$transaction(async (tx) => {
      // 1. Delete chore submissions and approvals
      const submissions = await tx.choreSubmission.findMany({
        where: { userId: childId },
        select: { id: true }
      })

      if (submissions.length > 0) {
        const submissionIds = submissions.map((s: { id: string }) => s.id)
        
        // Delete approvals for these submissions
        await tx.choreApproval.deleteMany({
          where: { submissionId: { in: submissionIds } }
        })
        
        // Delete submissions
        await tx.choreSubmission.deleteMany({
          where: { userId: childId }
        })
      }

      // 2. Delete chore assignments
      await tx.choreAssignment.deleteMany({
        where: { userId: childId }
      })

      // 3. Delete rewards
      await tx.reward.deleteMany({
        where: { userId: childId }
      })

      // 4. Delete messages
      await tx.message.deleteMany({
        where: { fromId: childId }
      })

      // 5. Delete user achievements
      await tx.userAchievement.deleteMany({
        where: { userId: childId }
      })

      // 6. Delete family memberships
      await tx.familyMembership.deleteMany({
        where: { 
          userId: childId,
          familyId: parentUser.familyId
        }
      })

      // 7. Check if child has other family memberships
      const otherMemberships = await tx.familyMembership.count({
        where: { 
          userId: childId,
          familyId: { not: parentUser.familyId }
        }
      })

      // If no other family memberships, delete the user entirely
      if (otherMemberships === 0) {
        // Optionally mark as inactive instead of deleting
        await tx.user.update({
          where: { id: childId },
          data: { 
            name: `${childUser.name} (Removed)`
          }
        })
      } else {
        // Child has other families, just remove from this family
        if (childUser.familyId === parentUser.familyId) {
          // Find their primary family from remaining memberships
          const newPrimaryMembership = await tx.familyMembership.findFirst({
            where: { 
              userId: childId,
              familyId: { not: parentUser.familyId },
              isPrimary: true
            }
          })

          if (newPrimaryMembership) {
            await tx.user.update({
              where: { id: childId },
              data: { familyId: newPrimaryMembership.familyId }
            })
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: `Child has been successfully removed from the family`,
      removedFromAllFamilies: childUser.familyMemberships.length <= 1
    })

  } catch (error) {
    console.error('Error removing child:', error)
    return NextResponse.json(
      { error: 'Failed to remove child from family' },
      { status: 500 }
    )
  }
} 