import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      DIRECT_URL: process.env.DIRECT_URL ? 'SET' : 'NOT SET',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ? 'SET' : 'NOT SET',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET',
      // Show last 10 chars of DATABASE_URL for debugging (without exposing secrets)
      DATABASE_URL_SUFFIX: process.env.DATABASE_URL ? process.env.DATABASE_URL.slice(-10) : 'NOT SET'
    }
    
    return NextResponse.json({
      status: 'success',
      environment: envVars,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 