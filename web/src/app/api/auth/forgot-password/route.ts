import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { sendEmailWithSES } from '@/lib/aws-communication'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    // Validate input
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        message: 'If a user with this email exists, a password reset link has been sent.'
      })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour from now

    // Save reset token to database
    await prisma.user.update({
      where: { email },
      data: {
        resetToken,
        resetTokenExpiry
      }
    })

    // Send reset email (skip in development if AWS not configured)
    try {
      await sendPasswordResetEmail(email, resetToken)
    } catch (emailError) {
      console.error('Email sending failed (likely AWS not configured):', emailError)
      if (process.env.NODE_ENV === 'development') {
        // In development, provide the reset URL directly
        const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`
        return NextResponse.json({
          message: 'Password reset token generated. In development mode, use this URL:',
          resetUrl: resetUrl,
          token: resetToken
        })
      }
      throw emailError // Re-throw in production
    }

    return NextResponse.json({
      message: 'If a user with this email exists, a password reset link has been sent.'
    })

  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function sendPasswordResetEmail(email: string, resetToken: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`

  const htmlContent = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #333; font-size: 28px; margin-bottom: 10px;">🏡 ChoreChart</h1>
        <p style="color: #666; font-size: 16px;">Smart family chore management with AI</p>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
        <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>
        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
          We received a request to reset your password for your ChoreChart account. 
          If you didn't make this request, you can safely ignore this email.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background: linear-gradient(45deg, #3b82f6, #8b5cf6); 
                    color: white; 
                    padding: 14px 30px; 
                    text-decoration: none; 
                    border-radius: 8px; 
                    font-weight: bold; 
                    font-size: 16px; 
                    display: inline-block;">
            Reset My Password
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          This link will expire in 1 hour for security reasons.
        </p>
        
        <p style="color: #666; font-size: 14px; margin-top: 10px;">
          If the button doesn't work, copy and paste this link into your browser:
          <br>
          <a href="${resetUrl}" style="color: #3b82f6; word-break: break-all;">${resetUrl}</a>
        </p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
        <p>This email was sent from ChoreChart. If you have any questions, please contact support.</p>
      </div>
    </div>
  `

  await sendEmailWithSES({
    to: email,
    subject: 'ChoreChart - Password Reset Request',
    htmlContent,
  })
}