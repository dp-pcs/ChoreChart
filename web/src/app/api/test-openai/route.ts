import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing OpenAI connection...')
    console.log('🔑 API Key exists:', !!process.env.OPENAI_API_KEY)
    console.log('🔑 API Key prefix:', process.env.OPENAI_API_KEY?.substring(0, 20) + '...')
    
    // Try to import and initialize OpenAI
    const OpenAI = require('openai')
    console.log('📦 OpenAI module loaded:', !!OpenAI)
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
    console.log('🤖 OpenAI client created:', !!openai)
    
    // Test a simple completion
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say "Hello from Chorbit!" in exactly those words.' }
      ],
      max_tokens: 50,
      temperature: 0,
    })
    
    console.log('✅ OpenAI API call successful!')
    console.log('📝 Response:', response.choices[0]?.message?.content)
    
    return NextResponse.json({
      status: 'success',
      message: 'OpenAI is working correctly!',
      response: response.choices[0]?.message?.content,
      apiKeyConfigured: !!process.env.OPENAI_API_KEY,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ OpenAI test failed:', error)
    
    return NextResponse.json({
      status: 'error',
      message: 'OpenAI connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      apiKeyConfigured: !!process.env.OPENAI_API_KEY,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 