'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function SignUp() {
  const [familyName, setFamilyName] = useState('')
  const [parentName, setParentName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyName,
          parentName,
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/auth/signin')
      }, 2000)

    } catch (error: any) {
      setError(error.message || 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to ChoreChart!</h2>
            <p className="text-gray-600 mb-4">
              Your family account has been created successfully.
            </p>
            <p className="text-sm text-gray-500">
              Redirecting you to sign in...
            </p>
            <div className="mt-6">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        {/* App Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/chorbie_logo_transparent.png" alt="Chorbie Logo" className="w-16 h-16" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Chorbie</h1>
          <p className="text-gray-600 text-sm sm:text-base">Create your family account</p>
        </div>

        {/* Features Preview */}
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3 text-center">🚀 What you'll get:</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3">
                <span className="text-lg">🤖</span>
                <span>AI assistant "Chorbit" for kids</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg">📊</span>
                <span>Behavior tracking & insights</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg">💰</span>
                <span>Smart allowance management</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg">📱</span>
                <span>Mobile-friendly interface</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sign Up Form */}
        <Card className="bg-white shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl sm:text-2xl font-bold text-center">Start Your Journey</CardTitle>
            <CardDescription className="text-center text-sm sm:text-base">
              Set up your family's Chorbie account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="familyName" className="text-sm font-medium text-gray-700">
                  Family Name
                </label>
                <Input
                  id="familyName"
                  type="text"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="The Smith Family"
                  required
                  className="h-12 text-base"
                  autoComplete="organization"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="parentName" className="text-sm font-medium text-gray-700">
                  Your Name (Parent)
                </label>
                <Input
                  id="parentName"
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="John Smith"
                  required
                  className="h-12 text-base"
                  autoComplete="name"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  required
                  className="h-12 text-base"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Choose a secure password"
                  required
                  className="h-12 text-base"
                  autoComplete="new-password"
                />
                <p className="text-xs text-gray-500">Must be at least 6 characters long</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  className="h-12 text-base"
                  autoComplete="new-password"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating your account...
                  </div>
                ) : (
                  'Create Family Account'
                )}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-center text-sm text-gray-600">
                Already have an account?{' '}
                <Link 
                  href="/auth/signin" 
                  className="font-medium text-blue-600 hover:text-blue-500 hover:underline"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Security Notice */}
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-4">
            <div className="text-center text-xs text-gray-500 space-y-1">
              <p className="flex items-center justify-center gap-2">
                <span>🔒</span>
                <span>Your data is secure and private</span>
              </p>
              <p>Free to use • No ads • Family-focused design</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 