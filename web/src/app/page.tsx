import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  // Redirect authenticated users to their respective dashboards
  if (session) {
    if (session.user.role === "PARENT") {
      redirect("/dashboard/parent")
    } else {
      redirect("/dashboard/child")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">ChoreChart</span>
          </div>
          <div className="space-x-4">
            <Button variant="outline" asChild>
              <Link href="/auth/signin">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-gray-900 leading-tight">
              Make Chores Fun with{" "}
              <span className="text-blue-600">AI-Powered</span>{" "}
              Family Management
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Create structure, accountability, and rewards for your family. 
              ChoreChart uses artificial intelligence to help parents and children 
              build better habits together.
            </p>
          </div>

          <div className="flex justify-center space-x-4">
            <Button size="lg" asChild>
              <Link href="/auth/signup">Start Free Trial</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/demo">See Demo</Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span className="text-2xl">👨‍👩‍👧‍👦</span>
                <span>Dual Interfaces</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Separate, age-appropriate interfaces for parents and children. 
                Parents manage and approve, children submit and track progress.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span className="text-2xl">🤖</span>
                <span>AI Insights</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Get intelligent recommendations on chore schedules, difficulty, 
                and rewards based on your family's completion patterns.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span className="text-2xl">💰</span>
                <span>Smart Rewards</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Flexible reward system with base allowances and performance bonuses. 
                Track potential vs. actual earnings automatically.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span className="text-2xl">📅</span>
                <span>Flexible Scheduling</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Create daily, weekly, or custom chore schedules. Set reminders 
                and track completion patterns over time.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span className="text-2xl">✅</span>
                <span>Approval Workflow</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Children submit completed chores for parent review. Choose 
                auto-approval or manual verification with feedback.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span className="text-2xl">📊</span>
                <span>Weekly Reports</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Automated email summaries with completion rates, insights, 
                and AI-powered recommendations for improvement.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16 p-8 bg-blue-50 rounded-lg">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Transform Your Family's Chore Experience?
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Join families who have made chores engaging, educational, and rewarding.
          </p>
          <Button size="lg" asChild>
            <Link href="/auth/signup">Get Started Today</Link>
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t">
        <div className="text-center text-gray-500">
          <p>&copy; 2024 ChoreChart. Built with ❤️ for families.</p>
        </div>
      </footer>
    </div>
  )
}
