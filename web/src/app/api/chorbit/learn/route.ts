import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { EnhancedUserPreferences, Interest, LearnedFact } from '@/lib/types'

// OpenAI for natural language processing
let openai: any = null
if (typeof window === 'undefined' && process.env.OPENAI_API_KEY) {
  try {
    openai = require('openai')
    if (openai.default) openai = openai.default
    openai = new openai({ apiKey: process.env.OPENAI_API_KEY })
  } catch (error) {
    console.log('OpenAI not available for learning:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, conversation, source } = await request.json()

    // For now, just log the learning data
    // In a full implementation, you'd save this to a database
    console.log('Chorbit Learning:', {
      userId,
      conversation: conversation.substring(0, 100) + '...',
      source,
      timestamp: new Date().toISOString()
    })

    // Mock response for successful learning
    return NextResponse.json({ 
      success: true, 
      message: 'Learning data processed' 
    })
    
  } catch (error) {
    console.error('Chorbit learn error:', error)
    return NextResponse.json(
      { error: 'Failed to process learning data' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // Mock validation response
    return NextResponse.json({
      validationDue: false,
      interestsNeedingValidation: []
    })
    
  } catch (error) {
    console.error('Chorbit validation check error:', error)
    return NextResponse.json(
      { error: 'Failed to check validation status' },
      { status: 500 }
    )
  }
}

async function extractInterestsFromConversation(conversation: string, userName: string): Promise<Interest[]> {
  if (!openai) return []

  try {
    const prompt = `Analyze this conversation and extract interests, hobbies, or preferences mentioned by ${userName}. 
    Look for:
    - Sports teams they like/support
    - Hobbies they enjoy
    - Activities they do
    - Things they're excited about
    - Food preferences
    - Entertainment preferences (games, shows, etc.)

    Conversation: "${conversation}"

    Return a JSON array of interests with this structure:
    [
      {
        "name": "basketball",
        "confidence": 0.8,
        "category": "sports",
        "context": "mentioned loving to play basketball after school",
        "details": {
          "favoriteTeam": "Lakers",
          "favoritePlayer": "LeBron"
        }
      }
    ]
    
    Only include things you're confident about (confidence > 0.5). If no clear interests, return empty array.`

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are an expert at identifying interests and preferences from conversations. Return valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 400,
      temperature: 0.3,
    })

    const content = response.choices[0]?.message?.content
    if (!content) return []

    const parsed = JSON.parse(content)
    return Array.isArray(parsed) ? parsed.map(interest => ({
      ...interest,
      learnedAt: new Date().toISOString(),
      needsValidation: false
    })) : []

  } catch (error) {
    console.error('Interest extraction failed:', error)
    return []
  }
}

async function updatePreferencesWithLearning(
  currentPrefs: EnhancedUserPreferences,
  newInterests: Interest[],
  source: string
): Promise<EnhancedUserPreferences> {
  
  const now = new Date().toISOString()
  const existingInterests = currentPrefs.interests || []
  const updatedInterests = [...existingInterests]

  for (const newInterest of newInterests) {
    const existingIndex = updatedInterests.findIndex(
      interest => interest.name.toLowerCase() === newInterest.name.toLowerCase()
    )

    if (existingIndex >= 0) {
      // Update existing interest - boost confidence
      const existing = updatedInterests[existingIndex]
      updatedInterests[existingIndex] = {
        ...existing,
        confidence: Math.min(1.0, existing.confidence + 0.2), // Boost confidence
        lastValidated: now,
        details: { ...existing.details, ...newInterest.details }
      }
    } else {
      // Add new interest
      updatedInterests.push({
        ...newInterest,
        learnedAt: now,
        needsValidation: false
      })
    }
  }

  // Decay confidence for interests not mentioned recently (over 60 days)
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
  updatedInterests.forEach(interest => {
    if (interest.lastValidated && interest.lastValidated < sixtyDaysAgo) {
      interest.confidence = Math.max(0.1, interest.confidence - 0.1)
      if (interest.confidence < 0.3) {
        interest.needsValidation = true
      }
    }
  })

  return {
    ...currentPrefs,
    interests: updatedInterests,
    lastValidationDate: now,
    nextValidationDue: new Date(Date.now() + (currentPrefs.validationFrequency || 60) * 24 * 60 * 60 * 1000).toISOString()
  }
}

function checkIfValidationDue(prefs: EnhancedUserPreferences): boolean {
  if (!prefs.nextValidationDue) return false
  return new Date(prefs.nextValidationDue) <= new Date()
}

function getDefaultPreferences(): EnhancedUserPreferences {
  return {
    interests: [],
    motivationalStyle: 'encouraging',
    preferredGreeting: 'energetic',
    conversationStyle: 'interactive',
    learningTopics: [],
    personalityTraits: [],
    learnedFacts: {},
    sportsTeams: [],
    validationFrequency: 60, // 60 days
    wantsNewsUpdates: true,
    newsCategories: []
  }
} 