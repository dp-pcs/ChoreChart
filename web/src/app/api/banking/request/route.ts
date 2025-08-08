import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getActiveFamilyId } from '@/lib/family'
import { convertDecimalsDeep } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'CHILD') {
      return NextResponse.json({ error: 'Only children can request banking' }, { status: 403 })
    }

    const { amount, reason } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      )
    }

    // Get user's current available points
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        availablePoints: true, 
        familyId: true,
        family: {
          select: {
            pointsToMoneyRate: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const availablePoints = Number(user.availablePoints)
    const requestedAmount = Number(amount)

    if (requestedAmount > availablePoints) {
      return NextResponse.json(
        { error: 'Insufficient points available' },
        { status: 400 }
      )
    }

    const pointRate = Number(user.family.pointsToMoneyRate) || 1.00
    const moneyValue = requestedAmount * pointRate

    // Create banking request transaction
    const transaction = await prisma.pointTransaction.create({
      data: {
        userId: session.user.id,
        familyId: user.familyId,
        amount: requestedAmount,
        type: 'BANKING_REQUEST',
        status: 'PENDING',
        reason: reason || null,
        description: `Banking request for ${requestedAmount} points`,
        moneyValue: moneyValue,
        pointRate: pointRate
      }
    })

    // Temporarily reduce available points while request is pending
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        availablePoints: availablePoints - requestedAmount
      }
    })

    return NextResponse.json(convertDecimalsDeep({ 
      success: true, 
      transaction,
      message: `Banking request submitted for ${requestedAmount} points ($${moneyValue.toFixed(2)})`
    }))

  } catch (error) {
    console.error('Banking request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET: Get user's banking requests and history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const limit = parseInt(url.searchParams.get('limit') || '10')

    const whereClause: any = {
      userId: session.user.id,
      type: {
        in: ['BANKING_REQUEST', 'BANKING_APPROVED', 'BANKING_DENIED']
      }
    }

    if (status) {
      whereClause.status = status
    }

    const transactions = await prisma.pointTransaction.findMany({
      where: whereClause,
      orderBy: { submittedAt: 'desc' },
      take: limit,
      include: {
        processor: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(convertDecimalsDeep({ success: true, transactions }))

  } catch (error) {
    console.error('Banking history error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}