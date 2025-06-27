import { NextRequest, NextResponse } from 'next/server'
import { chorbit } from '@/lib/chorbit'

export async function POST(request: NextRequest) {
  try {
    const { userInput, availableTime, currentChores, userPreferences } = await request.json()

    if (!userInput || !availableTime) {
      return NextResponse.json(
        { error: 'User input and available time are required' },
        { status: 400 }
      )
    }

    const schedule = await chorbit.generateSchedule(
      userInput,
      availableTime,
      currentChores || [],
      userPreferences
    )
    
    return NextResponse.json(schedule)
    
  } catch (error) {
    console.error('Chorbit schedule generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate schedule' },
      { status: 500 }
    )
  }
} 