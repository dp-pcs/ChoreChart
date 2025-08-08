import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getActiveFamilyId } from '@/lib/family'
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

    // Validate base input
    if (!childName || !email) {
      return NextResponse.json(
        { error: 'Child name and email are required' },
        { status: 400 }
      )
    }

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    // Resolve parent's active family; auto-provision if missing
    let familyId = await getActiveFamilyId(session.user.id)
    if (!familyId) {
      const self = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, name: true, email: true } })
      const familyName = self?.name ? `${self.name.split(' ')[0]} Family` : 'My Family'
      const family = await prisma.family.create({ data: { name: familyName } })
      await prisma.user.update({ where: { id: session.user.id }, data: { familyId: family.id } })
      await prisma.familyMembership.create({
        data: {
          userId: session.user.id,
          familyId: family.id,
          role: 'PARENT',
          isActive: true,
          isPrimary: true,
          canInvite: true,
          canManage: true,
          permissions: {}
        }
      })
      familyId = family.id
    }

    // If child exists already, link to family instead of erroring
    if (existingUser) {
      if (existingUser.role !== 'CHILD') {
        return NextResponse.json(
          { error: 'This email belongs to a non-child user' },
          { status: 400 }
        )
      }

      // Ensure membership with this family
      const existingMembership = await prisma.familyMembership.findUnique({
        where: {
          userId_familyId: {
            userId: existingUser.id,
            familyId
          }
        }
      })

      if (!existingMembership) {
        // Clear previous primary memberships and set this as primary
        await prisma.familyMembership.updateMany({
          where: { userId: existingUser.id, isPrimary: true },
          data: { isPrimary: false }
        })
        await prisma.familyMembership.create({
          data: {
            userId: existingUser.id,
            familyId,
            role: 'CHILD',
            isActive: true,
            isPrimary: true,
            canInvite: false,
            canManage: false,
            permissions: { canSubmitChores: true, canViewOwnProgress: true }
          }
        })
      }

      // Set child's primary family
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { familyId }
      })

      return NextResponse.json({
        success: true,
        message: `Linked existing child ${existingUser.name || childName} to your family`,
        child: {
          id: existingUser.id,
          name: existingUser.name || childName,
          email: existingUser.email,
          role: existingUser.role,
        }
      })
    }

    // Creating a new child requires a password
    if (!password) {
      return NextResponse.json(
        { error: 'Password is required to create a new child account' },
        { status: 400 }
      )
    }

    // Hash password for new child creation
    const hashedPassword = await bcrypt.hash(password, 12)

    const childUser = await prisma.user.create({
      data: {
        name: childName,
        email,
        password: hashedPassword,
        role: 'CHILD',
        familyId,
      }
    })

    // Create family membership for the new child
    await prisma.familyMembership.create({
      data: {
        userId: childUser.id,
        familyId,
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