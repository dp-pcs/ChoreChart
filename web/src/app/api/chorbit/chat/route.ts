import { NextRequest, NextResponse } from 'next/server'
import { chorbit } from '@/lib/chorbit'

export async function POST(request: NextRequest) {
  try {
    const { message, userId, userContext } = await request.json()

    if (!message || !userId) {
      return NextResponse.json(
        { error: 'Message and userId are required' },
        { status: 400 }
      )
    }

    const response = await chorbit.chat(message, userId, userContext)
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Chorbit chat error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    )
  }
} 