import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-simple'
import { prisma } from '@/lib/prisma'
import { getActiveFamilyId } from '@/lib/family'
import { convertDecimalsDeep } from '@/lib/utils'

// GET: Fetch important events
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const upcoming = url.searchParams.get('upcoming') === 'true'
    const limit = url.searchParams.get('limit')

    const familyId = await getActiveFamilyId(session.user.id)
    if (!familyId) {
      return NextResponse.json({ error: 'User has no family' }, { status: 400 })
    }

    // Build where clause
    const whereClause: any = { familyId }

    // If upcoming=true, only get future events
    if (upcoming) {
      whereClause.eventDate = {
        gte: new Date()
      }
    }

    const events = await prisma.importantEvent.findMany({
      where: whereClause,
      include: {
        creator: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { eventDate: 'asc' },
      take: limit ? parseInt(limit) : undefined
    })

    // Calculate days until each event
    const eventsWithCountdown = events.map((event: any) => {
      const now = new Date()
      const eventDate = new Date(event.eventDate)
      const timeDiff = eventDate.getTime() - now.getTime()
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))
      
      return {
        ...event,
        daysUntil: daysDiff,
        isPast: daysDiff < 0,
        isToday: daysDiff === 0,
        isUpcoming: daysDiff > 0,
        shouldShowReminder: event.reminderDays.includes(daysDiff)
      }
    })

    return NextResponse.json(convertDecimalsDeep({
      success: true,
      events: eventsWithCountdown
    }))

  } catch (error) {
    console.error('Important events fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch important events' },
      { status: 500 }
    )
  }
}

// POST: Create new important event (parents only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Only parents can create important events' }, { status: 403 })
    }

    const { 
      title, 
      description, 
      eventDate,
      eventType,
      priority,
      isAllDay,
      reminderDays
    } = await request.json()

    if (!title || !eventDate) {
      return NextResponse.json(
        { error: 'Title and event date are required' },
        { status: 400 }
      )
    }

    const familyId = await getActiveFamilyId(session.user.id)
    if (!familyId) {
      return NextResponse.json({ error: 'User has no family' }, { status: 400 })
    }

    const event = await prisma.importantEvent.create({
      data: {
        familyId,
        title: title.trim(),
        description: description?.trim() || null,
        eventDate: new Date(eventDate),
        eventType: eventType || 'GENERAL',
        priority: priority || 'MEDIUM',
        isAllDay: isAllDay !== false, // Default to true
        reminderDays: reminderDays || [7, 3, 1],
        createdBy: session.user.id
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(convertDecimalsDeep({
      success: true,
      event,
      message: `Event "${title}" created successfully!`
    }))

  } catch (error) {
    console.error('Important event creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create important event' },
      { status: 500 }
    )
  }
}

// PUT: Update important event (parents only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Only parents can update important events' }, { status: 403 })
    }

    const { 
      eventId,
      title, 
      description, 
      eventDate,
      eventType,
      priority,
      isAllDay,
      reminderDays
    } = await request.json()

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      )
    }

    // Verify event exists and belongs to user's family
    const existingEvent = await prisma.importantEvent.findFirst({
      where: {
        id: eventId,
        family: {
          users: {
            some: {
              id: session.user.id
            }
          }
        }
      }
    })

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Event not found or access denied' },
        { status: 404 }
      )
    }

    const updatedEvent = await prisma.importantEvent.update({
      where: { id: eventId },
      data: {
        title: title?.trim() || existingEvent.title,
        description: description !== undefined ? description?.trim() : existingEvent.description,
        eventDate: eventDate ? new Date(eventDate) : existingEvent.eventDate,
        eventType: eventType || existingEvent.eventType,
        priority: priority || existingEvent.priority,
        isAllDay: isAllDay !== undefined ? isAllDay : existingEvent.isAllDay,
        reminderDays: reminderDays || existingEvent.reminderDays
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      event: updatedEvent,
      message: `Event "${updatedEvent.title}" updated successfully!`
    })

  } catch (error) {
    console.error('Important event update error:', error)
    return NextResponse.json(
      { error: 'Failed to update important event' },
      { status: 500 }
    )
  }
}

// DELETE: Remove important event (parents only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Only parents can delete important events' }, { status: 403 })
    }

    const url = new URL(request.url)
    const eventId = url.searchParams.get('eventId')

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      )
    }

    // Verify event exists and belongs to user's family
    const event = await prisma.importantEvent.findFirst({
      where: {
        id: eventId,
        family: {
          users: {
            some: {
              id: session.user.id
            }
          }
        }
      }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found or access denied' },
        { status: 404 }
      )
    }

    await prisma.importantEvent.delete({
      where: { id: eventId }
    })

    return NextResponse.json({
      success: true,
      message: `Event "${event.title}" deleted successfully!`
    })

  } catch (error) {
    console.error('Important event deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete important event' },
      { status: 500 }
    )
  }
}