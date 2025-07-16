import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the user is a parent
    if (session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Only parents can add children' }, { status: 403 })
    }

    const { childName, email, password } = await request.json()

    // Validate input
    if (!childName || !email || !password) {
      return NextResponse.json(
        { error: 'Child name, email, and password are required' },
        { status: 400 }
      )
    }

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      )
    }

    // Get the parent's family ID
    const parentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { familyId: true }
    })

    if (!parentUser) {
      return NextResponse.json({ error: 'Parent user not found' }, { status: 404 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create child user
    const childUser = await prisma.user.create({
      data: {
        name: childName,
        email,
        password: hashedPassword,
        role: 'CHILD',
        familyId: parentUser.familyId,
      }
    })

    // Create family membership for the child (if using multiple families system)
    try {
      await prisma.familyMembership.create({
        data: {
          userId: childUser.id,
          familyId: parentUser.familyId,
          role: 'CHILD',
          isActive: true,
          isPrimary: true,
          canInvite: false,
          canManage: false,
          permissions: {
            canSubmitChores: true,
            canViewOwnProgress: true
          }
        }
      })
    } catch (membershipError) {
      // Family membership might not exist yet, that's okay
      console.log('Family membership creation failed, continuing...')
    }

    return NextResponse.json({
      success: true,
      message: `Child account created successfully for ${childName}!`,
      child: {
        id: childUser.id,
        name: childUser.name,
        email: childUser.email,
        role: childUser.role,
      }
    })

  } catch (error) {
    console.error('Error creating child account:', error)
    return NextResponse.json(
      { error: 'Failed to create child account' },
      { status: 500 }
    )
  }
} 