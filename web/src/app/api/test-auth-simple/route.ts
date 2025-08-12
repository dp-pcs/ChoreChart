import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth-simple-simple'

export async function GET() {
  try {
    // Test if the auth configuration can be loaded without errors
    const hasProviders = authOptions.providers && authOptions.providers.length > 0
    const hasSecret = !!authOptions.secret
    const hasJWT = authOptions.session?.strategy === 'jwt'
    
    return NextResponse.json({
      status: 'OK',
      authConfigLoaded: true,
      hasProviders,
      hasSecret,
      hasJWT,
      providerCount: authOptions.providers?.length || 0,
      secretLength: authOptions.secret?.length || 0
    })
  } catch (error) {
    return NextResponse.json({
      status: 'ERROR',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
