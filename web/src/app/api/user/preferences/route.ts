import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { UserPreferences } from '@/lib/chorbit'

// GET user preferences
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, preferences: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Return preferences or default empty preferences
    const preferences: UserPreferences = user.preferences as UserPreferences || {
      interests: [],
      motivationalStyle: 'encouraging',
      preferredGreeting: 'energetic',
      learningTopics: [],
      sportsTeams: [],
      personalityTraits: [],
      conversationStyle: 'interactive',
      learnedFacts: {}
    }

    return NextResponse.json({
      status: 'success',
      preferences,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Get preferences error:', error)
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Failed to fetch user preferences',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST/PUT update user preferences
export async function POST(request: NextRequest) {
  try {
    const { userId, preferences } = await request.json()
    
    if (!userId || !preferences) {
      return NextResponse.json(
        { error: 'Missing userId or preferences' },
        { status: 400 }
      )
    }

    // Update user preferences
    const user = await prisma.user.update({
      where: { id: userId },
      data: { 
        preferences: preferences,
        updatedAt: new Date()
      },
      select: { id: true, name: true, preferences: true }
    })

    return NextResponse.json({
      status: 'success',
      message: 'Preferences updated successfully',
      preferences: user.preferences,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Update preferences error:', error)
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Failed to update user preferences',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// PATCH for partial updates (learning new facts)
export async function PATCH(request: NextRequest) {
  try {
    const { userId, learnedFact } = await request.json()
    
    if (!userId || !learnedFact) {
      return NextResponse.json(
        { error: 'Missing userId or learnedFact' },
        { status: 400 }
      )
    }

    // Get current preferences
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true }
    })

    const currentPrefs = (user?.preferences as UserPreferences) || {
      interests: [],
      motivationalStyle: 'encouraging',
      preferredGreeting: 'energetic',
      learningTopics: [],
      sportsTeams: [],
      personalityTraits: [],
      conversationStyle: 'interactive',
      learnedFacts: {}
    }

    // Add new learned fact
    const updatedPrefs = {
      ...currentPrefs,
      learnedFacts: {
        ...currentPrefs.learnedFacts,
        [learnedFact.key]: {
          ...learnedFact.value,
          learnedAt: new Date().toISOString()
        }
      }
    }

    // Update user
    await prisma.user.update({
      where: { id: userId },
      data: { 
        preferences: updatedPrefs,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      status: 'success',
      message: 'Learned new fact about user',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Learn fact error:', error)
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Failed to learn new fact',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 