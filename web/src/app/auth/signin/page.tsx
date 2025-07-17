'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'PARENT' | 'CHILD'>('PARENT')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
        return
      }

      // Get the session to determine role-based routing
      const session = await getSession()
      if (session?.user) {
        if (session.user.role === 'PARENT') {
          router.push('/dashboard/parent')
        } else {
          router.push('/dashboard/child')
        }
      }
    } catch (error) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const demoAccounts = [
    { email: 'parent@demo.com', password: 'password', role: 'PARENT' as const, name: 'Demo Parent' },
    { email: 'child@demo.com', password: 'password', role: 'CHILD' as const, name: 'Noah (Demo Child)' }
  ]

  const fillDemoAccount = (account: typeof demoAccounts[0]) => {
    setEmail(account.email)
    setPassword(account.password)
    setRole(account.role)
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
          <p className="text-gray-600 text-sm sm:text-base">Smart family chore management with AI</p>
        </div>

        {/* Demo Account Quick Access */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              🚀 Try Demo Accounts
            </CardTitle>
            <CardDescription className="text-sm">
              Quick access to test the app
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {demoAccounts.map((account, index) => (
              <Button
                key={index}
                variant="outline"
                onClick={() => fillDemoAccount(account)}
                className="w-full h-12 text-left justify-start bg-white hover:bg-blue-50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{account.role === 'PARENT' ? '👨‍👩‍👧‍👦' : '🧒'}</span>
                  <div className="text-left">
                    <div className="font-medium text-sm">{account.name}</div>
                    <div className="text-xs text-gray-500">{account.email}</div>
                  </div>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Sign In Form */}
        <Card className="bg-white shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl sm:text-2xl font-bold text-center">Welcome Back!</CardTitle>
            <CardDescription className="text-center text-sm sm:text-base">
              Sign in to your Chorbie account
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
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="h-12 text-base"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <Link 
                    href="/auth/forgot-password" 
                    className="text-sm text-blue-600 hover:text-blue-500 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="h-12 text-base"
                  autoComplete="current-password"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-center text-sm text-gray-600">
                Don't have an account?{' '}
                <Link 
                  href="/auth/signup" 
                  className="font-medium text-blue-600 hover:text-blue-500 hover:underline"
                >
                  Sign up here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* App Features Preview */}
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="font-semibold text-gray-900 mb-2">✨ What's New in ChoreChart</h3>
              <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <span>🤖</span>
                  <span>AI Assistant "Chorbit"</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📊</span>
                  <span>Behavior Tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📱</span>
                  <span>Mobile Optimized</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>💰</span>
                  <span>Smart Allowance</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 