import { NextRequest, NextResponse } from 'next/server'
import { chorbit } from '@/lib/chorbit'
import type { ChorbitMessage } from '@/lib/chorbit'

export async function POST(request: NextRequest) {
  let parsedUserId = 'unknown'
  
  try {
    const { 
      message, 
      userId, 
      conversationHistory = [],
      userContext 
    } = await request.json()

    parsedUserId = userId || 'unknown'

    // Validate input
    if (!message || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: message and userId' },
        { status: 400 }
      )
    }

    // Clear chorbit's history and set it to the conversation history from frontend
    chorbit.clearHistory()
    
    // Add conversation history to chorbit instance
    if (conversationHistory && conversationHistory.length > 0) {
      // Set the conversation history (excluding the welcome message)
      const chatHistory = conversationHistory
        .filter((msg: ChorbitMessage) => msg.id !== 'welcome')
        .slice(-10) // Keep last 10 messages for context
      
      // Manually set the history in chorbit instance
      chatHistory.forEach((msg: ChorbitMessage) => {
        chorbit.getHistory().push(msg)
      })
    }

    // Get response from Chorbit
    const response = await chorbit.chat(message, userId, userContext)

    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Chorbit chat error:', error)
    
    // Return a helpful fallback response
    const fallbackResponse = {
      id: `fallback-${Date.now()}`,
      role: 'assistant' as const,
      content: "I'm here to help with your chores and time management! What would you like to work on today? 😊",
      timestamp: new Date(),
      userId: parsedUserId
    }
    
    return NextResponse.json(fallbackResponse)
  }
} 