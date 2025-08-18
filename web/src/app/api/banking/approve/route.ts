import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-simple'
import { prisma } from '@/lib/prisma'
import { getActiveFamilyId } from '@/lib/family'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Only parents can approve banking requests' }, { status: 403 })
    }

    const { transactionId, approved } = await request.json()

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      )
    }

    // Get the banking request
    const transaction = await prisma.pointTransaction.findFirst({
      where: {
        id: transactionId,
        type: 'BANKING_REQUEST',
        status: 'PENDING'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            familyId: true,
            availablePoints: true,
            bankedPoints: true,
            bankedMoney: true
          }
        }
      }
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Banking request not found or already processed' },
        { status: 404 }
      )
    }

    // Verify parent is in same family
    const familyId = await getActiveFamilyId(session.user.id)
    if (transaction.user.familyId !== familyId) {
      return NextResponse.json(
        { error: 'Cannot approve requests from other families' },
        { status: 403 }
      )
    }

    const amount = Number(transaction.amount)
    const moneyValue = Number(transaction.moneyValue)

    if (approved) {
      // Approve banking request
      await prisma.$transaction(async (tx) => {
        // Update the transaction status
        await tx.pointTransaction.update({
          where: { id: transactionId },
          data: {
            status: 'APPROVED',
            processedAt: new Date(),
            processedBy: session.user.id,
            type: 'BANKING_APPROVED'
          }
        })

        // Update user's banked amounts (points were already deducted from available)
        await tx.user.update({
          where: { id: transaction.userId },
          data: {
            bankedPoints: Number(transaction.user.bankedPoints) + amount,
            bankedMoney: Number(transaction.user.bankedMoney) + moneyValue
          }
        })

        // Create completion record
        await tx.pointTransaction.create({
          data: {
            userId: transaction.userId,
            familyId: transaction.familyId,
            amount: -amount, // Negative to show money withdrawn from points
            type: 'BANKING_APPROVED',
            status: 'COMPLETED',
            description: `Banking approved: ${amount} points converted to $${moneyValue.toFixed(2)}`,
            moneyValue: moneyValue,
            pointRate: transaction.pointRate,
            processedBy: session.user.id,
            processedAt: new Date()
          }
        })
      })

      return NextResponse.json({ 
        success: true, 
        message: `Banking request approved! ${amount} points converted to $${moneyValue.toFixed(2)} for ${transaction.user.name}`
      })

    } else {
      // Deny banking request - return points to user
      await prisma.$transaction(async (tx) => {
        // Update the transaction status
        await tx.pointTransaction.update({
          where: { id: transactionId },
          data: {
            status: 'DENIED',
            processedAt: new Date(),
            processedBy: session.user.id,
            type: 'BANKING_DENIED'
          }
        })

        // Return points to user's available balance
        await tx.user.update({
          where: { id: transaction.userId },
          data: {
            availablePoints: Number(transaction.user.availablePoints) + amount
          }
        })
      })

      return NextResponse.json({ 
        success: true, 
        message: `Banking request denied. ${amount} points returned to ${transaction.user.name}`
      })
    }

  } catch (error) {
    console.error('Banking approval error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}