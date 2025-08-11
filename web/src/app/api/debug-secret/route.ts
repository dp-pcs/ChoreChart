import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const secret = process.env.NEXTAUTH_SECRET
    
    // Test if the secret can be used to sign a JWT
    const jwt = require('jsonwebtoken')
    
    const testPayload = { test: 'data', iat: Math.floor(Date.now() / 1000) }
    const token = jwt.sign(testPayload, secret, { expiresIn: '1m' })
    const decoded = jwt.verify(token, secret)
    
    return NextResponse.json({
      secretExists: !!secret,
      secretLength: secret?.length || 0,
      secretEnding: secret?.slice(-10) || 'N/A',
      canSign: !!token,
      canVerify: !!decoded,
      status: 'OK'
    })
    
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
      secretExists: !!process.env.NEXTAUTH_SECRET,
      secretLength: process.env.NEXTAUTH_SECRET?.length || 0,
      status: 'ERROR'
    }, { status: 500 })
  }
}
