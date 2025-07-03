import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const switchFamilySchema = z.object({
  familyId: z.string()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { familyId } = switchFamilySchema.parse(body)

    // Verify user has membership in the target family
    const membership = await prisma.familyMembership.findUnique({
      where: {
        userId_familyId: {
          userId: session.user.id,
          familyId: familyId
        }
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

    if (!membership || !membership.isActive) {
      return NextResponse.json(
        { success: false, error: 'Not a member of this family' },
        { status: 403 }
      )
    }

    // The switching logic would typically update session data
    // For now, we'll return success with the membership info
    return NextResponse.json({
      success: true,
      data: {
        activeFamilyId: familyId,
        membership: membership
      }
    })

  } catch (error: unknown) {
    console.error('Error switching family:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid data provided', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to switch family' },
      { status: 500 }
    )
  }
}