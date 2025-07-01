import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { UserPreferences } from '@/lib/chorbit'

export async function POST(request: NextRequest) {
  try {
    // Use the demo child user email for this demo setup
    const userEmail = 'child@demo.com'

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Set up basketball preferences for your son
    const basketballPreferences: UserPreferences = {
      interests: ['basketball', 'sports', 'NBA'],
      motivationalStyle: 'competitive',
      preferredGreeting: 'sports',
      learningTopics: ['basketball skills', 'teamwork', 'perseverance'],
      sportsTeams: [
        { sport: 'basketball', team: 'Lakers', league: 'NBA' },
        // You could add his local team too:
        // { sport: 'basketball', team: 'School Team', league: 'Local' }
      ],
      personalityTraits: ['athletic', 'competitive', 'dedicated'],
      conversationStyle: 'interactive',
      learnedFacts: {
        'loves_basketball': {
          fact: 'Really passionate about basketball',
          confidence: 'high',
          source: 'parent_setup'
        },
        'morning_energy': {
          fact: 'Most energetic in the morning',
          confidence: 'medium',
          source: 'observed_pattern'
        }
      }
    }

    // Update user preferences
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { 
        preferences: basketballPreferences as any,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      status: 'success',
      message: `✅ Basketball preferences set up for ${user.name}!`,
      preferences: basketballPreferences,
      examples: {
        morningGreeting: "🏀 Good morning, champ! Did you see the Lakers game last night? LeBron had 28 points! Speaking of champions, ready to tackle your chores today?",
        motivation: "You've got this! 🏀 Just like shooting free throws, consistency is key. Every chore you complete is like making a shot - you're building skills!",
        schedule: "Let's create your Championship Chore Game Plan! 🏀 We'll strategize these tasks like setting up plays."
      },
      nextSteps: [
        "Now when your son chats with Chorbit, it will:",
        "• Start conversations with basketball references",
        "• Use sports metaphors for motivation",
        "• Occasionally mention Lakers scores",
        "• Frame chores as 'training' or 'plays'",
        "• Learn more about his interests over time"
      ]
    })

  } catch (error) {
    console.error('Setup basketball demo error:', error)
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Failed to set up basketball preferences',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 