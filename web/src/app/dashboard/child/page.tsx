"use client"

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChorbieChat } from '@/components/ui/chorbit-chat'
import { DailyCheckIn } from '@/components/ui/daily-check-in'
import { DailyCheckInReminder } from '@/components/ui/daily-check-in-reminder'
import { ImpromptuSubmissionDialog } from '@/components/ui/impromptu-submission-dialog'
import type { DailyCheckIn as DailyCheckInType } from '@/lib/behavior-tracking'
import React from 'react'
import { Badge } from '@/components/ui/badge'

export default function ChildDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // State management
  const [showCheckIn, setShowCheckIn] = useState(false)
  const [showCheckInReminder, setShowCheckInReminder] = useState(false)
  const [showImpromptuDialog, setShowImpromptuDialog] = useState(false)
  const [todaysCheckIn, setTodaysCheckIn] = useState<Partial<DailyCheckInType> | null>(null)
  const [submittedChores, setSubmittedChores] = useState<Set<string>>(new Set())
  const [approvedChores, setApprovedChores] = useState<Set<string>>(new Set())
  const [isCheckingToday, setIsCheckingToday] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  // Real data state
  const [loading, setLoading] = useState(true)
  const [todaysChores, setTodaysChores] = useState<any[]>([])
  const [weeklyProgress, setWeeklyProgress] = useState({
    completed: 0,
    total: 0,
    earnings: 0,
    potential: 0
  })
  const [user, setUser] = useState<any>(null)

  // Authentication and data loading
  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (!session) {
      router.push('/auth/signin')
      return
    }

    if (session.user.role !== 'CHILD') {
      router.push('/dashboard/parent')
      return
    }

    // Set user data from session
    setUser({
      id: session.user.id,
      name: session.user.name,
      role: session.user.role,
      weeklyEarnings: 0, // Will be calculated from chores
      completionRate: 0  // Will be calculated from submissions
    })

    // Load dashboard data
    fetchChoresData()
    checkTodaysCheckInStatus()
  }, [session, status, router])

  const fetchChoresData = async () => {
    try {
      setLoading(true)
      
      // Fetch assigned chores
      const response = await fetch('/api/chores')
      if (response.ok) {
        const result = await response.json()
        const chores = result.chores || []
        
        // Filter chores assigned to this child
        const myChores = chores.filter((chore: any) => 
          chore.assignments?.some((assignment: any) => assignment.userId === session?.user?.id)
        )
        
        setTodaysChores(myChores)
        
        // Calculate weekly progress (mock calculation for now)
        const totalPotential = myChores.reduce((sum: number, chore: any) => sum + (chore.reward || 0), 0)
        setWeeklyProgress({
          completed: 0, // Will be updated based on submissions
          total: myChores.length,
          earnings: 0,  // Will be updated based on approved submissions
          potential: totalPotential
        })
      }
    } catch (error) {
      console.error('Error fetching chores:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkTodaysCheckInStatus = async () => {
    if (!session?.user?.id) return
    
    try {
      setIsCheckingToday(true)
      
      // Check localStorage first for today's skip status
      const today = new Date().toISOString().split('T')[0]
      const skipKey = `checkin-skip-${session.user.id}-${today}`
      const hasSkippedToday = localStorage.getItem(skipKey) === 'true'
      
      if (hasSkippedToday) {
        setShowCheckInReminder(false)
        setIsCheckingToday(false)
        return
      }

      // Check API for completed check-in
      const response = await fetch(`/api/check-in?userId=${session.user.id}&checkToday=true`)
      if (response.ok) {
        const result = await response.json()
        
        // Show reminder if they haven't checked in today and haven't skipped
        if (!result.hasCheckedInToday && !result.hasSkippedToday) {
          setShowCheckInReminder(true)
        }
      }
    } catch (error) {
      console.error('Failed to check today\'s check-in status:', error)
      // On error, don't show reminder to avoid blocking access
    } finally {
      setIsCheckingToday(false)
    }
  }

  const handleStartCheckIn = () => {
    setShowCheckInReminder(false)
    setShowCheckIn(true)
  }

  const handleSkipCheckIn = async () => {
    if (!session?.user?.id) return
    
    try {
      // Call API to log the skip
      await fetch('/api/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'skip',
          userId: session.user.id
        })
      })

      // Store skip status in localStorage
      const today = new Date().toISOString().split('T')[0]
      const skipKey = `checkin-skip-${session.user.id}-${today}`
      localStorage.setItem(skipKey, 'true')
      
      setShowCheckInReminder(false)
    } catch (error) {
      console.error('Failed to skip check-in:', error)
      // Even if API fails, close the reminder
      setShowCheckInReminder(false)
    }
  }

  const handleChoreSubmit = (choreId: string) => {
    setSubmittedChores(prev => {
      const newSubmitted = new Set(prev)
      if (newSubmitted.has(choreId)) {
        newSubmitted.delete(choreId)
      } else {
        newSubmitted.add(choreId)
      }
      return newSubmitted
    })
  }

  // Simulate parent approval after a delay (for demo purposes)
  const simulateParentApproval = (choreId: string) => {
    setTimeout(() => {
      setApprovedChores(prev => new Set([...prev, choreId]))
    }, 3000) // 3 second delay to simulate parent review
  }

  // Trigger approval simulation when chore is submitted
  useEffect(() => {
    submittedChores.forEach(choreId => {
      if (!approvedChores.has(choreId)) {
        simulateParentApproval(choreId)
      }
    })
  }, [submittedChores, approvedChores])

  // Calculate earnings
  const submittedEarnings = todaysChores
    .filter((chore: any) => submittedChores.has(chore.id))
    .reduce((sum: number, chore: any) => sum + (chore.reward || 0), 0)

  const approvedEarnings = todaysChores
    .filter((chore: any) => approvedChores.has(chore.id))
    .reduce((sum: number, chore: any) => sum + (chore.reward || 0), 0)

  const handleScheduleGenerated = (schedule: any) => {
    console.log('Schedule generated:', schedule)
    // Could show a toast notification or update UI
  }

  const handleExportRequest = async (schedule: any) => {
    try {
      const response = await fetch('/api/chorbie/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schedule,
          startDate: new Date(),
          format: 'ics'
        })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `chorbie-schedule-${schedule.id}.ics`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const handleCheckInSubmit = async (checkIn: Partial<DailyCheckInType>) => {
    try {
      const response = await fetch('/api/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkIn)
      })
      
      if (response.ok) {
        const result = await response.json()
        setTodaysCheckIn(result)
        setShowCheckIn(false)
        setShowCheckInReminder(false) // Hide reminder after completing check-in
        console.log('✅ Check-in saved:', result)
      }
    } catch (error) {
      console.error('❌ Check-in failed:', error)
    }
  }

  const handleImpromptuSuccess = (successMessage: string) => {
    setMessage({
      type: 'success',
      text: successMessage
    })
  }

  // Clear messages after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  // Check if today's check-in is complete
  const isCheckInComplete = todaysCheckIn && 
    new Date(todaysCheckIn.date!).toDateString() === new Date().toDateString()

  // Show loading state while authenticating or fetching data
  if (status === 'loading' || loading || isCheckingToday || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">👋</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {!user ? 'Loading your dashboard...' : `Getting ready for ${user.name}...`}
          </p>
        </div>
      </div>
    )
  }

  // Show daily check-in reminder overlay if needed
  if (showCheckInReminder) {
    return (
      <>
        <div className="min-h-screen bg-gray-50">
          {/* Main dashboard content (blurred) */}
          <div className="filter blur-sm pointer-events-none">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <div className="px-4 py-6 sm:px-6">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col space-y-2">
                    <h1 className="text-2xl sm:text-3xl font-bold">Hey {user.name}! 👋</h1>
                    <p className="text-blue-100 text-sm sm:text-base">Ready to crush today's goals?</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Check-in reminder overlay */}
        <DailyCheckInReminder 
          userName={user.name}
          onStartCheckIn={handleStartCheckIn}
          onSkip={handleSkipCheckIn}
        />
      </>
    )
  }

  if (showCheckIn) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DailyCheckIn 
          userId={user.id}
          userName={user.name}
          onSubmit={handleCheckInSubmit}
          existingCheckIn={todaysCheckIn || undefined}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success/Error Message */}
      {message && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
          message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {message.text}
        </div>
      )}

      {/* Mobile-Optimized Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <div className="px-4 py-6 sm:px-6">
          <div className="flex justify-between items-start">
            <div className="flex flex-col space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold">Hey {user.name}! 👋</h1>
              <p className="text-blue-100 text-sm sm:text-base">Ready to crush today's goals?</p>
            </div>
            <Button 
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 sm:px-6 space-y-4 sm:space-y-6 max-w-4xl mx-auto">
        {/* Quick Stats - Mobile Optimized Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <Card className="bg-white shadow-sm">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-lg sm:text-2xl font-bold text-green-600">${user.weeklyEarnings}</div>
              <div className="text-xs sm:text-sm text-gray-600">This Week</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-sm">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-lg sm:text-2xl font-bold text-blue-600">{user.completionRate}%</div>
              <div className="text-xs sm:text-sm text-gray-600">Complete</div>
            </CardContent>
          </Card>

                     <Card className="bg-white shadow-sm col-span-2 sm:col-span-2">
             <CardContent className="p-3 sm:p-4 text-center">
               <div className="text-lg sm:text-2xl font-bold text-purple-600">Champion</div>
               <div className="text-xs sm:text-sm text-gray-600">Current Level</div>
             </CardContent>
           </Card>
        </div>

        {/* Action Buttons - Mobile Friendly */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button 
            onClick={() => setShowCheckIn(true)}
            className="h-12 sm:h-14 text-base sm:text-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
          >
            📝 Daily Check-In
          </Button>
          
          <Button 
            onClick={() => setShowImpromptuDialog(true)}
            variant="outline"
            className="h-12 sm:h-14 text-base sm:text-lg border-2 hover:bg-purple-50 border-purple-200 text-purple-700"
          >
            ✨ Tell Parents!
          </Button>
        </div>

        {/* New section for additional actions */}
        <div className="grid grid-cols-1 gap-3">
          <Button 
            variant="outline"
            className="h-12 sm:h-14 text-base sm:text-lg border-2 hover:bg-gray-50"
          >
            📅 My Schedule
          </Button>
        </div>

        {/* Today's Chores - Touch Friendly */}
        <Card className="bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              Today's Chores
              <Badge variant="secondary" className="text-xs">
                {todaysChores.length} tasks
              </Badge>
            </CardTitle>
            <CardDescription className="text-sm">
              Tap to submit completed chores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todaysChores.map((chore: any) => {
                const isSubmitted = submittedChores.has(chore.id)
                const isApproved = approvedChores.has(chore.id)
                
                return (
                  <div 
                    key={chore.id}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 touch-manipulation ${
                      isApproved 
                        ? 'bg-green-50 border-green-200' 
                        : isSubmitted 
                        ? 'bg-yellow-50 border-yellow-200' 
                        : 'bg-white border-gray-200 hover:border-blue-300 active:border-blue-400'
                    }`}
                    onClick={() => !isApproved && handleChoreSubmit(chore.id)}
                  >
                    <div className="flex items-center space-x-4">
                      <div 
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                          isApproved 
                            ? 'bg-green-500 border-green-500' 
                            : isSubmitted 
                            ? 'bg-yellow-400 border-yellow-400' 
                            : 'border-gray-300 hover:border-blue-500'
                        }`}
                      >
                        {isApproved && (
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        {isSubmitted && !isApproved && (
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium text-sm sm:text-base ${isApproved ? 'line-through text-green-700' : 'text-gray-900'}`}>
                          {chore.title}
                        </p>
                        <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-500 mt-1">
                          <span>{chore.estimatedMinutes} minutes</span>
                          <span>•</span>
                          <span>{chore.isRequired ? 'Required' : 'Optional'}</span>
                          {isApproved && (
                            <>
                              <span>•</span>
                              <span className="text-green-600 font-medium">✓ Approved!</span>
                            </>
                          )}
                          {isSubmitted && !isApproved && (
                            <>
                              <span>•</span>
                              <span className="text-yellow-600 font-medium">⏳ Pending...</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base sm:text-lg font-bold text-green-600">
                        ${chore.reward}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Earnings Summary - Mobile Optimized */}
            <div className="mt-6 pt-4 border-t">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-green-600">
                      ${approvedEarnings}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">Approved</div>
                  </div>
                  
                  {submittedEarnings > approvedEarnings && (
                    <div>
                      <div className="text-xl sm:text-2xl font-bold text-yellow-600">
                        ${submittedEarnings - approvedEarnings}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600">Pending</div>
                    </div>
                  )}
                  
                  {submittedEarnings === approvedEarnings && (
                    <div>
                      <div className="text-xl sm:text-2xl font-bold text-gray-400">
                        ${todaysChores.reduce((sum: number, chore: any) => sum + (chore.reward || 0), 0) - approvedEarnings}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600">Possible</div>
                    </div>
                  )}
                </div>
                
                <Button 
                  className="w-full mt-4 h-12 text-base font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  disabled={submittedChores.size === 0}
                >
                  {submittedChores.size === 0 ? 'Select chores to start! 🚀' : 
                   approvedChores.size === todaysChores.length ? '🎉 All chores complete!' :
                   submittedChores.size > 0 ? `${submittedChores.size} chores submitted! 💪` : 
                   'Start working! 🚀'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Motivational Section - Mobile Optimized */}
        <Card className={`text-white ${
          approvedChores.size === todaysChores.length 
            ? 'bg-gradient-to-r from-green-400 to-emerald-500' 
            : submittedChores.size > 0
            ? 'bg-gradient-to-r from-blue-400 to-purple-500'
            : 'bg-gradient-to-r from-yellow-400 to-orange-500'
        }`}>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {approvedChores.size === todaysChores.length ? (
                  <>
                    <h3 className="text-lg sm:text-xl font-bold mb-2">Amazing work! All chores approved! 🎉</h3>
                    <p className="text-green-100 text-sm sm:text-base">
                      You've earned ${approvedEarnings} today! Your parents will be so proud of you!
                    </p>
                  </>
                ) : submittedChores.size > 0 ? (
                  <>
                    <h3 className="text-lg sm:text-xl font-bold mb-2">Great progress! Keep it up! 💪</h3>
                    <p className="text-blue-100 text-sm sm:text-base">
                      You've submitted {submittedChores.size} out of {todaysChores.length} chores. You're doing awesome!
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg sm:text-xl font-bold mb-2">You're doing great! 🌟</h3>
                    <p className="text-yellow-100 text-sm sm:text-base">
                      Every chore you complete helps your family and builds great habits.
                    </p>
                  </>
                )}
              </div>
              <div className="text-4xl sm:text-6xl ml-4">
                {approvedChores.size === todaysChores.length ? '🎉' : submittedChores.size > 0 ? '💪' : '🏆'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chorbit Chat - Mobile Optimized */}
        <Card className="bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              💬 Chat with Chorbie
              <Badge variant="secondary" className="text-xs">AI Assistant</Badge>
            </CardTitle>
            <CardDescription className="text-sm">
              Your personal AI helper for chores and life!
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-64 sm:h-80">
                             <ChorbieChat 
                 userId={user.id}
                 userRole={user.role}
                 userName={user.name}
                 currentChores={todaysChores}
                 weeklyEarnings={user.weeklyEarnings}
                 completionRate={user.completionRate}
                 onScheduleGenerated={() => {}}
                 onExportRequest={() => {}}
               />
            </div>
          </CardContent>
        </Card>

        {/* Impromptu Submission Dialog */}
        <ImpromptuSubmissionDialog
          isOpen={showImpromptuDialog}
          onClose={() => setShowImpromptuDialog(false)}
          onSuccess={handleImpromptuSuccess}
        />
      </div>
    </div>
  )
} 