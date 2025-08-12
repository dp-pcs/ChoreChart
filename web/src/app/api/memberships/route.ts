import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-simple'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Get user's family memberships
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const memberships = await prisma.familyMembership.findMany({
      where: {
        userId: session.user.id,
        isActive: true
      },
      include: {
        family: {
          select: {
            id: true,
            name: true,
            allowMultipleParents: true,
            shareReports: true,
            crossFamilyApproval: true
          }
        }
      },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      data: memberships
    })
  } catch (error) {
    console.error('Error fetching memberships:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch memberships' },
      { status: 500 }
    )
  }
}

// Create new family membership (invite response)
const createMembershipSchema = z.object({
  familyId: z.string(),
  role: z.enum(['PARENT', 'CHILD']),
  canInvite: z.boolean().optional(),
  canManage: z.boolean().optional(),
  permissions: z.record(z.any()).optional()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createMembershipSchema.parse(body)

    // Check if user is already a member of this family
    const existingMembership = await prisma.familyMembership.findUnique({
      where: {
        userId_familyId: {
          userId: session.user.id,
          familyId: validatedData.familyId
        }
      }
    })

    if (existingMembership) {
      return NextResponse.json(
        { success: false, error: 'Already a member of this family' },
        { status: 400 }
      )
    }

    // Check if family allows multiple parents if user is joining as parent
    if (validatedData.role === 'PARENT') {
      const family = await prisma.family.findUnique({
        where: { id: validatedData.familyId },
        select: { allowMultipleParents: true }
      })

      if (!family?.allowMultipleParents) {
        const existingParents = await prisma.familyMembership.count({
          where: {
            familyId: validatedData.familyId,
            role: 'PARENT',
            isActive: true
          }
        })

        if (existingParents > 0) {
          return NextResponse.json(
            { success: false, error: 'Family does not allow multiple parents' },
            { status: 400 }
          )
        }
      }
    }

    // Create the membership
    const membership = await prisma.familyMembership.create({
      data: {
        userId: session.user.id,
        familyId: validatedData.familyId,
        role: validatedData.role,
        canInvite: validatedData.canInvite || false,
        canManage: validatedData.canManage || false,
        permissions: validatedData.permissions || {},
        isPrimary: false // New memberships are not primary by default
      },
      include: {
        family: {
          select: {
            id: true,
            name: true,
            allowMultipleParents: true,
            shareReports: true,
            crossFamilyApproval: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: membership
    })
  } catch (error: unknown) {
    console.error('Error creating membership:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid data provided', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create membership' },
      { status: 500 }
    )
  }
}