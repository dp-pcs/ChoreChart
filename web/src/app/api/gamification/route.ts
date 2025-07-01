import { NextRequest, NextResponse } from 'next/server'
import { gamificationSystem } from '@/lib/gamification'

// GET gamification stats
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      )
    }

    const stats = await gamificationSystem.getGamificationStats(userId)

    return NextResponse.json({
      status: 'success',
      ...stats,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Get gamification stats error:', error)
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Failed to fetch gamification stats',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST update streaks
export async function POST(request: NextRequest) {
  try {
    const { userId, action, streakType } = await request.json()
    
    if (!userId || !action) {
      return NextResponse.json(
        { error: 'Missing userId or action' },
        { status: 400 }
      )
    }

    let result

    switch (action) {
      case 'updateLogin':
        result = await gamificationSystem.updateLoginStreak(userId)
        break
        
      case 'updateCheckIn':
        result = await gamificationSystem.updateCheckInStreak(userId)
        break
        
      case 'useStreakFreeze':
        if (!streakType) {
          return NextResponse.json(
            { error: 'Missing streakType for useStreakFreeze' },
            { status: 400 }
          )
        }
        const freezeSuccess = await gamificationSystem.useStreakFreeze(userId, streakType)
        return NextResponse.json({
          status: 'success',
          action: 'streakFreezeUsed',
          success: freezeSuccess,
          message: freezeSuccess ? 'Streak freeze applied!' : 'Could not use streak freeze'
        })
        
      case 'checkRisk':
        const riskData = await gamificationSystem.checkStreakBreakRisk(userId)
        return NextResponse.json({
          status: 'success',
          action: 'riskCheck',
          ...riskData
        })
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      status: 'success',
      action,
      streakData: result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Gamification action error:', error)
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Failed to perform gamification action',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 