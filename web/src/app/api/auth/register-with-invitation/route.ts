import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { parentName, email, password, inviteToken } = await request.json()

    // Validate input
    if (!parentName || !email || !password || !inviteToken) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Find the invitation
    const invitation = await prisma.familyInvitation.findUnique({
      where: { inviteToken },
      include: {
        family: true
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

    // Check if email matches invitation
    if (email !== invitation.email) {
      return NextResponse.json(
        { error: 'Email must match the invitation email address' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists. Try signing in instead.' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user and family membership in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          name: parentName,
          email,
          password: hashedPassword,
          role: invitation.role,
          familyId: invitation.familyId,
        }
      })

      // Create family membership
      await tx.familyMembership.create({
        data: {
          userId: user.id,
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

      return { user }
    })

    return NextResponse.json({
      message: `Welcome to ChoreChart! Your account has been created and you've joined the ${invitation.family.name} family.`,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
      },
      family: {
        id: invitation.family.id,
        name: invitation.family.name,
      }
    })

  } catch (error) {
    console.error('Registration with invitation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}