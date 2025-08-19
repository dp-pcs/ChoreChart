import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Debug NextAuth URL configuration
  const debug = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '[SET]' : '[NOT SET]',
      VERCEL_URL: process.env.VERCEL_URL,
      VERCEL_BRANCH_URL: process.env.VERCEL_BRANCH_URL,
      AMPLIFY_URL: process.env._AMPLIFY_HOSTING_ENV
    },
    request: {
      protocol: request.nextUrl.protocol,
      host: request.nextUrl.host,
      origin: request.nextUrl.origin,
      headers: {
        host: request.headers.get('host'),
        'x-forwarded-proto': request.headers.get('x-forwarded-proto'),
        'x-forwarded-host': request.headers.get('x-forwarded-host'),
        'user-agent': request.headers.get('user-agent')?.substring(0, 100)
      }
    },
    nextAuth: {
      // What NextAuth would construct as base URL
      calculatedUrl: process.env.NEXTAUTH_URL || 
                    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
                    `${request.nextUrl.protocol}//${request.nextUrl.host}`,
      fallbackUrl: `http://localhost:3000`
    }
  }

  return NextResponse.json(debug)
}
