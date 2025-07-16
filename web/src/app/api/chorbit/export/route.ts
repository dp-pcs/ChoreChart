import { NextRequest, NextResponse } from 'next/server'
import { chorbie } from '@/lib/chorbit'

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
      const icsContent = chorbie.generateiOSCalendarFile(schedule, exportStartDate)
      
      return new NextResponse(icsContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/calendar',
          'Content-Disposition': `attachment; filename="chorbie-schedule-${schedule.id}.ics"`
        }
      })
    }

    // Future: Add support for iOS Shortcuts format
    if (format === 'shortcuts') {
      const shortcutsData = {
        schedule,
        startDate: exportStartDate,
        appName: 'ChoreChart',
        generatedBy: 'Chorbie AI'
      }
      
      return NextResponse.json(shortcutsData)
    }

    return NextResponse.json(
      { error: 'Unsupported export format' },
      { status: 400 }
    )
    
  } catch (error) {
    console.error('Chorbie export error:', error)
    return NextResponse.json(
      { error: 'Failed to export schedule' },
      { status: 500 }
    )
  }
} 