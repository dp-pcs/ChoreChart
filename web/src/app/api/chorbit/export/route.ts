import { NextRequest, NextResponse } from 'next/server'
import { chorbit } from '@/lib/chorbit'

export async function POST(request: NextRequest) {
  try {
    const { schedule, startDate, format } = await request.json()

    if (!schedule) {
      return NextResponse.json(
        { error: 'Schedule is required' },
        { status: 400 }
      )
    }

    const exportStartDate = startDate ? new Date(startDate) : new Date()
    
    if (format === 'ics' || !format) {
      const icsContent = chorbit.generateiOSCalendarFile(schedule, exportStartDate)
      
      return new NextResponse(icsContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/calendar',
          'Content-Disposition': `attachment; filename="chorbit-schedule-${schedule.id}.ics"`
        }
      })
    }

    // Future: Add support for iOS Shortcuts format
    if (format === 'shortcuts') {
      const shortcutsData = {
        schedule,
        startDate: exportStartDate,
        appName: 'ChoreChart',
        generatedBy: 'Chorbit AI'
      }
      
      return NextResponse.json(shortcutsData)
    }

    return NextResponse.json(
      { error: 'Unsupported export format' },
      { status: 400 }
    )
    
  } catch (error) {
    console.error('Chorbit export error:', error)
    return NextResponse.json(
      { error: 'Failed to export schedule' },
      { status: 500 }
    )
  }
} 