'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (session) {
      // Redirect based on user role
      if (session.user.role === 'PARENT') {
        router.push('/dashboard/parent')
      } else if (session.user.role === 'CHILD') {
        router.push('/dashboard/child')
      }
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show landing page for non-authenticated users
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 py-20">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Welcome to{' '}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  ChoreChart
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                The AI-powered family management platform that makes chores fun, builds responsibility, 
                and brings families together. Featuring Chorbit, your family's personal AI assistant!
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Link href="/auth/signup">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3">
                    Start Your Family Journey
                  </Button>
                </Link>
                <Link href="/auth/signin">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-3">
                    Sign In
                  </Button>
                </Link>
              </div>

              {/* Demo Links */}
              <div className="inline-block">
                <Card className="bg-white/70 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Try the Demo</CardTitle>
                    <CardDescription>
                      Experience ChoreChart with our demo accounts
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Link href="/check-in-demo">
                        <Button variant="outline" size="sm" className="w-full sm:w-auto">
                          Daily Check-In Demo
                        </Button>
                      </Link>
                      <Link href="/chorbit-demo">
                        <Button variant="outline" size="sm" className="w-full sm:w-auto">
                          Chat with Chorbit
                        </Button>
                      </Link>
                    </div>
                    <div className="mt-3 text-xs text-gray-500">
                      Demo accounts: parent@demo.com / child@demo.com (password: password)
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  🤖
                </div>
                <CardTitle>Meet Chorbit</CardTitle>
                <CardDescription>
                  Your family's AI assistant that helps kids learn time management, 
                  stay motivated, and develop good habits.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  ✅
                </div>
                <CardTitle>Smart Chore Management</CardTitle>
                <CardDescription>
                  Submit, approve, and track chores with our intelligent system. 
                  Parents get insights, kids get rewards.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  📊
                </div>
                <CardTitle>Family Development</CardTitle>
                <CardDescription>
                  Daily check-ins, behavioral tracking, and AI-powered insights 
                  help your family grow together.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-8 border-t border-gray-200 bg-white/50">
          <p className="text-gray-500 text-sm">
            Built with ❤️ for families who want to grow together
          </p>
        </div>
      </div>
    )
  }

  // This shouldn't render, but just in case
  return null
}
