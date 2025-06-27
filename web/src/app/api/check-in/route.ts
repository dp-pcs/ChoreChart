import { NextRequest, NextResponse } from 'next/server'
import { analyzeCheckInData } from '@/lib/behavior-tracking'
import type { DailyCheckIn } from '@/lib/behavior-tracking'

export async function POST(request: NextRequest) {
  try {
    const checkInData: Partial<DailyCheckIn> = await request.json()
    
    // Validate required fields
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

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      )
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