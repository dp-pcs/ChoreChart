import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { inviteToken } = await request.json()

    if (!inviteToken) {
      return NextResponse.json(
        { error: 'Invite token is required' },
        { status: 400 }
      )
    }

    // Find the invitation
    const invitation = await prisma.familyInvitation.findUnique({
      where: { inviteToken },
      include: {
        family: true,
        inviter: true
      }
    })

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation' },
        { status: 400 }
      )
    }

    // Check if invitation has expired
    if (invitation.inviteTokenExpiry < new Date()) {
      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 400 }
      )
    }

    // Check if invitation has already been accepted
    if (invitation.acceptedAt) {
      return NextResponse.json(
        { error: 'This invitation has already been accepted' },
        { status: 400 }
      )
    }

    // Check if user's email matches invitation email
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || user.email !== invitation.email) {
      return NextResponse.json(
        { error: 'This invitation was not sent to your email address' },
        { status: 400 }
      )
    }

    // Check if user is already part of this family
    const existingMembership = await prisma.familyMembership.findUnique({
      where: {
        userId_familyId: {
          userId: session.user.id,
          familyId: invitation.familyId
        }
      }
    })

    if (existingMembership) {
      return NextResponse.json(
        { error: 'You are already a member of this family' },
        { status: 400 }
      )
    }

    // Create family membership for the user
    await prisma.$transaction(async (tx) => {
      // Create family membership
      await tx.familyMembership.create({
        data: {
          userId: session.user.id,
          familyId: invitation.familyId,
          role: invitation.role,
          canInvite: invitation.canInvite,
          canManage: invitation.canManage,
          isActive: true,
          isPrimary: false
        }
      })

      // Mark invitation as accepted
      await tx.familyInvitation.update({
        where: { id: invitation.id },
        data: {
          acceptedAt: new Date()
        }
      })
    })

    return NextResponse.json({
      success: true,
      message: `Successfully joined the ${invitation.family.name} family!`,
      family: {
        id: invitation.family.id,
        name: invitation.family.name
      }
    })

  } catch (error) {
    console.error('Accept invitation error:', error)
    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    )
  }
}

// GET endpoint to validate invitation token and show invitation details
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const inviteToken = url.searchParams.get('token')

    if (!inviteToken) {
      return NextResponse.json(
        { error: 'Invite token is required' },
        { status: 400 }
      )
    }

    // Find the invitation
    const invitation = await prisma.familyInvitation.findUnique({
      where: { inviteToken },
      include: {
        family: true,
        inviter: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid invitation' },
        { status: 400 }
      )
    }

    // Check if invitation has expired
    if (invitation.inviteTokenExpiry < new Date()) {
      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 400 }
      )
    }

    // Check if invitation has already been accepted
    if (invitation.acceptedAt) {
      return NextResponse.json(
        { error: 'This invitation has already been accepted' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      invitation: {
        email: invitation.email,
        familyName: invitation.family.name,
        inviterName: invitation.inviter.name,
        role: invitation.role,
        canInvite: invitation.canInvite,
        canManage: invitation.canManage,
        isForExistingUser: invitation.isForExistingUser,
        expiresAt: invitation.inviteTokenExpiry
      }
    })

  } catch (error) {
    console.error('Get invitation error:', error)
    return NextResponse.json(
      { error: 'Failed to get invitation details' },
      { status: 500 }
    )
  }
}