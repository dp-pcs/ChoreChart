import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { 
  sendEmailWithSES, 
  sendSMSWithSNS, 
  generateInvitationEmailHTML, 
  generateInvitationSMS,
  isValidEmail,
  isValidPhoneNumber 
} from '@/lib/aws-communication'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Only parents can invite other parents' }, { status: 403 })
    }

    const { email, phoneNumber, inviteMethod, canInvite, canManage } = await request.json()

    // Validate input
    if (!email && !phoneNumber) {
      return NextResponse.json(
        { error: 'Either email or phone number is required' },
        { status: 400 }
      )
    }

    // Validate the chosen method has corresponding contact info
    if (inviteMethod === 'EMAIL' && !email) {
      return NextResponse.json(
        { error: 'Email is required for email invitations' },
        { status: 400 }
      )
    }

    if (inviteMethod === 'SMS' && !phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required for SMS invitations' },
        { status: 400 }
      )
    }

    // Validate formats
    if (email && !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    if (phoneNumber && !isValidPhoneNumber(phoneNumber)) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Please use US format (e.g., 555-123-4567)' },
        { status: 400 }
      )
    }

    // Get the inviting parent's family information
    const parentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        family: true
      }
    })

    if (!parentUser?.family) {
      return NextResponse.json({ error: 'Parent family not found' }, { status: 400 })
    }

    // Check if family allows multiple parents
    if (!parentUser.family.allowMultipleParents) {
      return NextResponse.json(
        { error: 'Your family settings do not allow multiple parents. Please enable this in family settings first.' },
        { status: 400 }
      )
    }

    // Check if user already exists (by email if provided)
    const existingUser = email ? await prisma.user.findUnique({
      where: { email }
    }) : null

    // Generate invitation token and expiry
    const inviteToken = crypto.randomBytes(32).toString('hex')
    const inviteTokenExpiry = new Date(Date.now() + 7 * 24 * 3600000) // 7 days from now

    if (existingUser) {
      // Check if they're already part of this family
      const existingMembership = await prisma.familyMembership.findUnique({
        where: {
          userId_familyId: {
            userId: existingUser.id,
            familyId: parentUser.familyId!
          }
        }
      })

      if (existingMembership) {
        return NextResponse.json(
          { error: 'This person is already part of your family' },
          { status: 400 }
        )
      }

      // Store invitation details for existing user
      await prisma.familyInvitation.create({
        data: {
          email,
          phoneNumber,
          familyId: parentUser.familyId!,
          invitedBy: session.user.id,
          inviteToken,
          inviteTokenExpiry,
          role: 'PARENT',
          canInvite: canInvite || false,
          canManage: canManage || false,
          isForExistingUser: true,
          inviteMethod: inviteMethod || 'EMAIL'
        }
      })
    } else {
      // Store invitation details for new user
      await prisma.familyInvitation.create({
        data: {
          email,
          phoneNumber,
          familyId: parentUser.familyId!,
          invitedBy: session.user.id,
          inviteToken,
          inviteTokenExpiry,
          role: 'PARENT',
          canInvite: canInvite || false,
          canManage: canManage || false,
          isForExistingUser: false,
          inviteMethod: inviteMethod || 'EMAIL'
        }
      })
    }

    // Send invitation via chosen method
    if (inviteMethod === 'SMS' && phoneNumber) {
      await sendParentInvitationSMS(
        phoneNumber,
        inviteToken,
        parentUser.name!,
        parentUser.family.name
      )
    } else if (email) {
      await sendParentInvitationEmail(
        email,
        inviteToken,
        parentUser.name!,
        parentUser.family.name,
        existingUser?.name || null,
        !!existingUser
      )
    }

    const contactInfo = inviteMethod === 'SMS' ? phoneNumber : email
    const methodName = inviteMethod === 'SMS' ? 'SMS' : 'email'
    
    return NextResponse.json({
      success: true,
      message: `Parent invitation sent via ${methodName} to ${contactInfo} successfully!`
    })

  } catch (error) {
    console.error('Parent invitation error:', error)
    return NextResponse.json(
      { error: 'Failed to send parent invitation' },
      { status: 500 }
    )
  }
}

async function sendParentInvitationEmail(
  email: string, 
  inviteToken: string, 
  inviterName: string, 
  familyName: string, 
  recipientName: string | null,
  isExistingUser: boolean
) {
  const inviteUrl = isExistingUser 
    ? `${process.env.NEXTAUTH_URL}/auth/accept-invitation?token=${inviteToken}`
    : `${process.env.NEXTAUTH_URL}/auth/signup?invite=${inviteToken}`

  const htmlContent = generateInvitationEmailHTML(
    inviterName,
    familyName,
    recipientName,
    isExistingUser,
    inviteUrl
  )

  await sendEmailWithSES({
    to: email,
    subject: `ChoreChart - You're invited to join the ${familyName} family!`,
    htmlContent,
  })
}

async function sendParentInvitationSMS(
  phoneNumber: string,
  inviteToken: string,
  inviterName: string,
  familyName: string
) {
  const inviteUrl = `${process.env.NEXTAUTH_URL}/auth/accept-invitation?token=${inviteToken}`
  
  const message = generateInvitationSMS(inviterName, familyName, inviteUrl)

  await sendSMSWithSNS({
    phoneNumber,
    message,
  })
}