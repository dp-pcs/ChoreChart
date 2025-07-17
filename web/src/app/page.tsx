'use client'
// Force rebuild - updated Amplify config

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🏡</div>
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    )
  }

  // If no session, show landing page
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/chorbie_logo_transparent.png" alt="Chorbie Logo" className="w-10 h-10" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Chorbie</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/signin">
              <Button variant="outline" className="hidden sm:inline-flex">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-6xl sm:text-8xl mb-6">🤖👨‍👩‍👧‍👦</div>
          <h2 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
            Meet <span className="text-blue-600">Chorbie</span>
          </h2>
          <p className="text-xl sm:text-2xl text-gray-600 mb-8 leading-relaxed">
            The first AI assistant designed specifically for kids to make chores fun, 
            teach responsibility, and help families thrive together.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/auth/signup">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                Start Free Family Account
              </Button>
            </Link>
            <Link href="/check-in-demo">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-4">
                Try Demo First
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <span>✓</span> Free to use
            </span>
            <span className="flex items-center gap-1">
              <span>✓</span> No ads
            </span>
            <span className="flex items-center gap-1">
              <span>✓</span> Privacy-first
            </span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Why Families Love Chorbie
            </h3>
            <p className="text-lg text-gray-600">
              More than just a chore app - it's a complete family development platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Feature Cards */}
            <Card className="border-2 hover:border-blue-200 transition-colors">
              <CardHeader className="text-center pb-3">
                <div className="text-4xl mb-3">🤖</div>
                <CardTitle className="text-xl">Chorbie AI Assistant</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center text-sm sm:text-base">
                  The first AI specifically designed for kids. Helps with scheduling, motivation, 
                  and turning chores into fun challenges.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-green-200 transition-colors">
              <CardHeader className="text-center pb-3">
                <div className="text-4xl mb-3">💰</div>
                <CardTitle className="text-xl">Smart Allowance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center text-sm sm:text-base">
                  Automated allowance tracking with submit/approve workflow. 
                  Kids submit work, parents approve, money gets tracked.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-purple-200 transition-colors">
              <CardHeader className="text-center pb-3">
                <div className="text-4xl mb-3">📊</div>
                <CardTitle className="text-xl">Behavior Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center text-sm sm:text-base">
                  Daily check-ins reveal patterns in mood, energy, and motivation. 
                  Help your kids understand themselves better.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-yellow-200 transition-colors">
              <CardHeader className="text-center pb-3">
                <div className="text-4xl mb-3">📱</div>
                <CardTitle className="text-xl">Mobile-First</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center text-sm sm:text-base">
                  Works perfectly on phones and tablets. Install as an app 
                  or use in any browser. Kids can access anywhere.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-red-200 transition-colors">
              <CardHeader className="text-center pb-3">
                <div className="text-4xl mb-3">🎯</div>
                <CardTitle className="text-xl">Time Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center text-sm sm:text-base">
                  Chorbie teaches kids how to estimate time, prioritize tasks, 
                  and build routines that stick.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-indigo-200 transition-colors">
              <CardHeader className="text-center pb-3">
                <div className="text-4xl mb-3">👨‍👩‍👧‍👦</div>
                <CardTitle className="text-xl">Family Connection</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center text-sm sm:text-base">
                  Separate parent and kid interfaces. Parents get insights, 
                  kids get encouragement. Everyone wins.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
            See ChoreChart in Action
          </h3>
          <p className="text-lg text-gray-600 mb-8">
            Try our interactive demos to see how Chorbie helps families
          </p>

          <div className="grid sm:grid-cols-2 gap-6">
            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center">
                <div className="text-5xl mb-3">🧒</div>
                <CardTitle className="text-xl">Kid Experience</CardTitle>
                <CardDescription>
                  See how Noah interacts with Chorbie
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard/child">
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    Try Kid Dashboard
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center">
                <div className="text-5xl mb-3">📝</div>
                <CardTitle className="text-xl">Daily Check-In</CardTitle>
                <CardDescription>
                  Experience the behavioral tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/check-in-demo">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">
                    Try Check-In Demo
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Transform Your Family's Routine?
          </h3>
          <p className="text-xl mb-8 text-blue-100">
            Join families who are building better habits with AI-powered assistance
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-4 bg-white text-blue-600 hover:bg-gray-100">
                Create Free Account
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-blue-600">
                Sign In
              </Button>
            </Link>
          </div>

          <p className="text-sm text-blue-200 mt-6">
            No credit card required • Free forever • Set up in under 2 minutes
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 sm:px-6 lg:px-8 py-12 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <img src="/chorbie_logo_transparent.png" alt="Chorbie Logo" className="w-8 h-8" />
              <span className="text-xl font-bold">Chorbie</span>
            </div>
            <div className="text-sm text-gray-400 text-center md:text-right">
              <p>© 2024 Chorbie. Built with ❤️ for families.</p>
              <p className="mt-1">Empowering kids with AI • Teaching responsibility • Building better habits</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
