'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession, signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function AcceptInvitationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const [invitation, setInvitation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const inviteToken = searchParams.get('token')

  useEffect(() => {
    if (!inviteToken) {
      setError('Invalid invitation link')
      setLoading(false)
      return
    }

    fetchInvitationDetails()
  }, [inviteToken])

  const fetchInvitationDetails = async () => {
    try {
      const response = await fetch(`/api/auth/accept-invitation?token=${inviteToken}`)
      const result = await response.json()

      if (response.ok) {
        setInvitation(result.invitation)
      } else {
        setError(result.error || 'Failed to load invitation')
      }
    } catch (error) {
      console.error('Error fetching invitation:', error)
      setError('Failed to load invitation')
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptInvitation = async () => {
    if (!session) {
      // User needs to sign in first
      await signIn('credentials', { 
        callbackUrl: `/auth/accept-invitation?token=${inviteToken}` 
      })
      return
    }

    setAccepting(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/accept-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inviteToken
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setMessage(result.message)
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/dashboard/parent')
        }, 2000)
      } else {
        setError(result.error || 'Failed to accept invitation')
      }
    } catch (error) {
      console.error('Error accepting invitation:', error)
      setError('Failed to accept invitation')
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">❌ Invalid Invitation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600 mb-4">{error}</p>
            <div className="text-center">
              <Button onClick={() => router.push('/auth/signin')}>
                Go to Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (message) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-green-600">✅ Success!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600 mb-4">{message}</p>
            <p className="text-center text-sm text-gray-500">
              Redirecting to dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">🏡 Family Invitation</CardTitle>
          <CardDescription className="text-center">
            You've been invited to join a ChoreChart family
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <h3 className="font-semibold text-lg">{invitation?.familyName}</h3>
            <p className="text-gray-600">
              <strong>{invitation?.inviterName}</strong> has invited you to join their family as a parent.
            </p>
            <p className="text-sm text-gray-500">
              Invitation sent to: {invitation?.email}
            </p>
          </div>

          {invitation?.canInvite || invitation?.canManage ? (
            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Permissions included:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                {invitation?.canInvite && (
                  <li>• Can invite other parents</li>
                )}
                {invitation?.canManage && (
                  <li>• Can manage family settings</li>
                )}
              </ul>
            </div>
          ) : null}

          <div className="space-y-3">
            {!session ? (
              <div className="text-center space-y-3">
                <p className="text-sm text-gray-600">
                  You need to sign in with the email address <strong>{invitation?.email}</strong> to accept this invitation.
                </p>
                <Button 
                  onClick={() => signIn('credentials', { 
                    callbackUrl: `/auth/accept-invitation?token=${inviteToken}` 
                  })}
                  className="w-full"
                >
                  Sign In to Accept
                </Button>
                <div className="text-center">
                  <Button 
                    variant="outline" 
                    onClick={() => router.push(`/auth/signup?invite=${inviteToken}`)}
                    className="w-full"
                  >
                    Create Account Instead
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 text-center">
                  Signed in as: <strong>{session.user.email}</strong>
                </p>
                <Button 
                  onClick={handleAcceptInvitation}
                  disabled={accepting}
                  className="w-full"
                >
                  {accepting ? 'Accepting...' : 'Accept Invitation'}
                </Button>
              </div>
            )}
          </div>

          <div className="text-center">
            <Button 
              variant="outline" 
              onClick={() => router.push('/')}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <AcceptInvitationContent />
    </Suspense>
  )
}