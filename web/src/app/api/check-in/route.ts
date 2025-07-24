import { NextRequest, NextResponse } from 'next/server'
import { analyzeCheckInData } from '@/lib/behavior-tracking'
import type { DailyCheckIn } from '@/lib/behavior-tracking'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId, ...checkInData } = body
    
    // Handle "skip" action separately
    if (action === 'skip') {
      if (!userId) {
        return NextResponse.json(
          { error: 'Missing required field: userId' },
          { status: 400 }
        )
      }

      // Store skip status in localStorage on client side or session
      // For now, just return success response
      const response = {
        id: `skip-${Date.now()}`,
        userId,
        date: new Date().toISOString(),
        action: 'skipped',
        success: true,
        message: 'Check-in skipped for today'
      }

      return NextResponse.json(response)
    }
    
    // Validate required fields for regular check-in
    if (!checkInData.userId || !checkInData.date) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and date' },
        { status: 400 }
      )
    }

    // TODO: Save to database
    // const savedCheckIn = await prisma.dailyCheckIn.create({
    //   data: checkInData
    // })

    // Generate AI insights based on the check-in data
    const insights = await analyzeCheckInData(checkInData)

    // Mock response for demo
    const response = {
      id: `checkin-${Date.now()}`,
      ...checkInData,
      insights,
      timestamp: new Date().toISOString(),
      success: true
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Check-in submission error:', error)
    return NextResponse.json(
      { error: 'Failed to process check-in' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const date = searchParams.get('date')
    const checkToday = searchParams.get('checkToday')

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      )
    }

    // Special endpoint to check if user has done today's check-in
    if (checkToday === 'true') {
      const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
      
      // TODO: Check database for today's check-in
      // For now, always return false to show the reminder
      return NextResponse.json({
        hasCheckedInToday: false,
        hasSkippedToday: false,
        date: today
      })
    }

    // TODO: Fetch from database
    // const checkIns = await prisma.dailyCheckIn.findMany({
    //   where: {
    //     userId,
    //     ...(date && { date: new Date(date) })
    //   },
    //   orderBy: { date: 'desc' },
    //   take: 30 // Last 30 days
    // })

    // Mock response for demo
    const mockCheckIns = [
      {
        id: 'checkin-1',
        userId,
        date: new Date().toISOString(),
        morningEnergy: 3,
        overallMood: 4,
        physicalActivity: ['homework', 'soccer', 'gaming'],
        socialTime: 'friends',
        screenTime: 120,
        bedtimeLastNight: '21:30',
        stressors: ['homework_pressure'],
        specialEvents: ['finish_homework', 'soccer_practice']
      }
    ]

    return NextResponse.json(mockCheckIns)
  } catch (error) {
    console.error('Check-in fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch check-ins' },
      { status: 500 }
    )
  }
} 