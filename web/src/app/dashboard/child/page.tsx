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
import { ThemeToggle } from '@/components/ui/theme-toggle'

export default function ChildDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // State management
  const [showCheckIn, setShowCheckIn] = useState(false)
  const [showCheckInReminder, setShowCheckInReminder] = useState(false)
  const [showImpromptuDialog, setShowImpromptuDialog] = useState(false)
  const [showBankingDialog, setShowBankingDialog] = useState(false)
  const [feedbackFilter, setFeedbackFilter] = useState<'day' | 'week' | 'month' | 'all'>('day')
  const [feedback, setFeedback] = useState<any[]>([])
  const [todaysCheckIn, setTodaysCheckIn] = useState<Partial<DailyCheckInType> | null>(null)
  const [submittedChores, setSubmittedChores] = useState<Set<string>>(new Set())
  const [approvedChores, setApprovedChores] = useState<Set<string>>(new Set())
  const [pendingChores, setPendingChores] = useState<Set<string>>(new Set())
  const [submittingChores, setSubmittingChores] = useState<Set<string>>(new Set())
  const [isCheckingToday, setIsCheckingToday] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  // Real data state
  const [loading, setLoading] = useState(true)
  const [todaysChores, setTodaysChores] = useState<any[]>([])
  const [allWeeklyChores, setAllWeeklyChores] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'today' | 'week'>('today')
  const [weeklyProgress, setWeeklyProgress] = useState({
    completed: 0,
    total: 0,
    earnings: 0,
    potential: 0,
    pointsEarned: 0,
    pointsPotential: 0
  })
  const [user, setUser] = useState<any>(null)
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([])

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
      completionRate: 0,  // Will be calculated from submissions
      availablePoints: 0, // Will be loaded from API
      bankedMoney: 0, // Will be loaded from API
      pointRate: 1.00 // Will be loaded from family settings
    })

    // Load dashboard data
    fetchChoresData()
    checkTodaysCheckInStatus()
    fetchUpcomingEvents()
    fetchUserData()
    fetchFeedback()
  }, [session, status, router])

  const fetchUpcomingEvents = async () => {
    try {
      const response = await fetch('/api/important-events?upcoming=true&limit=3')
      if (response.ok) {
        const result = await response.json()
        setUpcomingEvents(result.events || [])
      }
    } catch (error) {
      console.error('Error fetching upcoming events:', error)
    }
  }

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/dashboard/child')
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setUser(prev => ({
            ...prev,
            availablePoints: result.data.user.availablePoints || 0,
            bankedMoney: result.data.user.bankedMoney || 0,
            pointRate: result.data.family.pointsToMoneyRate || 1.00
          }))
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  const fetchFeedback = async () => {
    try {
      const today = new Date()
      let startDate: Date
      
      switch (feedbackFilter) {
        case 'day':
          startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
          break
        case 'week':
          startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(today.getFullYear(), today.getMonth(), 1)
          break
        default:
          startDate = new Date(0) // All time
      }

      const response = await fetch(
        `/api/parental-feedback?startDate=${startDate.toISOString()}&endDate=${today.toISOString()}`
      )
      if (response.ok) {
        const result = await response.json()
        setFeedback(result.feedback || [])
      }
    } catch (error) {
      console.error('Error fetching feedback:', error)
    }
  }

  const fetchChoresData = async () => {
    try {
      setLoading(true)
      
      // Fetch assigned chores and their submission status
      const response = await fetch('/api/chores')
      if (response.ok) {
        const result = await response.json()
        const chores = result.chores || []
        
        // Filter chores assigned to this child
        const myChores = chores.filter((chore: any) => 
          chore.assignments?.some((assignment: any) => assignment.userId === session?.user?.id)
        )
        
        // Get today's day index
        const today = new Date().getDay() // 0 = Sunday, 1 = Monday, etc.
        
        // Create a comprehensive list of weekly chores with day information
        const weeklyChoresWithDays: any[] = []
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        
        myChores.forEach((chore: any) => {
          if (chore.frequency === 'DAILY' && chore.scheduledDays?.length > 0) {
            // Daily chores: add one entry for each scheduled day
            chore.scheduledDays.forEach((dayIndex: number) => {
              weeklyChoresWithDays.push({
                ...chore,
                scheduledDay: dayIndex,
                scheduledDayName: dayNames[dayIndex],
                isToday: dayIndex === today,
                isOverdue: dayIndex < today,
                dueDate: getDayDate(dayIndex)
              })
            })
          } else if (chore.frequency === 'WEEKLY' && chore.scheduledDays?.length > 0) {
            // Weekly chores: add one entry for each scheduled day
            chore.scheduledDays.forEach((dayIndex: number) => {
              weeklyChoresWithDays.push({
                ...chore,
                scheduledDay: dayIndex,
                scheduledDayName: dayNames[dayIndex],
                isToday: dayIndex === today,
                isOverdue: dayIndex < today,
                dueDate: getDayDate(dayIndex)
              })
            })
          } else if (chore.frequency === 'AS_NEEDED' || chore.type === 'ONE_TIME') {
            // One-time/as-needed chores: available any day
            weeklyChoresWithDays.push({
              ...chore,
              scheduledDay: null,
              scheduledDayName: 'Any time',
              isToday: true,
              isOverdue: false,
              dueDate: null
            })
          }
        })
        
        // Filter for today's chores (same logic as before)
        const actualTodaysChores = weeklyChoresWithDays.filter((chore: any) => chore.isToday)
        
        setTodaysChores(actualTodaysChores)
        setAllWeeklyChores(weeklyChoresWithDays)
        
        // Calculate weekly progress based on all assigned chores
        const totalPotential = myChores.reduce((sum: number, chore: any) => sum + (chore.reward || 0), 0)
        const totalPointsPotential = myChores.reduce((sum: number, chore: any) => sum + (chore.points || 0), 0)
        setWeeklyProgress({
          completed: 0, // Will be updated based on submissions from backend
          total: weeklyChoresWithDays.length,
          earnings: 0,  // Will be updated based on approved submissions from backend
          potential: totalPotential,
          pointsEarned: 0, // Will be updated based on approved submissions from backend
          pointsPotential: totalPointsPotential
        })
      }

      // Fetch submission status for assigned chores
      await fetchSubmissionStatus()
    } catch (error) {
      console.error('Error fetching chores:', error)
      setMessage({
        type: 'error',
        text: 'Failed to load chores. Please refresh the page.'
      })
    } finally {
      setLoading(false)
    }
  }

  // Helper function to get the date for a given day of the week
  const getDayDate = (dayIndex: number) => {
    const today = new Date()
    const currentDay = today.getDay()
    const diff = dayIndex - currentDay
    const targetDate = new Date(today)
    targetDate.setDate(today.getDate() + diff)
    return targetDate
  }

  const fetchSubmissionStatus = async () => {
    try {
      // Get current week's submissions for this user
      const response = await fetch('/api/dashboard/child')
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          const { submissions } = result.data
          
          // Update chore status based on backend data
          const newSubmitted = new Set<string>()
          const newApproved = new Set<string>()
          const newPending = new Set<string>()
          
          submissions.forEach((submission: any) => {
            const choreId = submission.choreId
            newSubmitted.add(choreId)
            
            if (submission.status === 'APPROVED' || submission.status === 'AUTO_APPROVED') {
              newApproved.add(choreId)
            } else if (submission.status === 'PENDING') {
              newPending.add(choreId)
            }
          })
          
          setSubmittedChores(newSubmitted)
          setApprovedChores(newApproved)
          setPendingChores(newPending)
          
          // Update earnings from approved submissions
          const approvedEarnings = submissions
            .filter((s: any) => s.status === 'APPROVED' || s.status === 'AUTO_APPROVED')
            .reduce((sum: number, s: any) => sum + (s.reward || 0), 0)
          
          const approvedPoints = submissions
            .filter((s: any) => s.status === 'APPROVED' || s.status === 'AUTO_APPROVED')
            .reduce((sum: number, s: any) => sum + (s.pointsAwarded || 0), 0)
          
          setWeeklyProgress(prev => ({
            ...prev,
            completed: newApproved.size,
            earnings: approvedEarnings,
            pointsEarned: approvedPoints
          }))
        }
      }
    } catch (error) {
      console.error('Error fetching submission status:', error)
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

  const handleChoreSubmit = async (choreId: string, customCompletedDate?: Date) => {
    // Prevent double submissions
    if (submittingChores.has(choreId) || submittedChores.has(choreId)) {
      return
    }
    
    try {
      setSubmittingChores(prev => new Set([...prev, choreId]))
      
      const response = await fetch('/api/chore-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          choreId: choreId,
          completedAt: customCompletedDate ? customCompletedDate.toISOString() : new Date().toISOString()
        })
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        // Update local state based on submission status
        setSubmittedChores(prev => new Set([...prev, choreId]))
        
        if (result.submission.status === 'AUTO_APPROVED') {
          setApprovedChores(prev => new Set([...prev, choreId]))
        } else {
          setPendingChores(prev => new Set([...prev, choreId]))
        }
        
        // Show success message
        const dateText = customCompletedDate ? 
          ` (completed ${customCompletedDate.toLocaleDateString()})` : ''
        setMessage({
          type: 'success',
          text: result.message + dateText
        })
        
        // Refresh submission status to get latest data
        await fetchSubmissionStatus()
        
      } else {
        throw new Error(result.error || 'Failed to submit chore')
      }
    } catch (error) {
      console.error('Error submitting chore:', error)
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to submit chore. Please try again.'
      })
    } finally {
      setSubmittingChores(prev => {
        const newSet = new Set(prev)
        newSet.delete(choreId)
        return newSet
      })
    }
  }

  const handleChoreSubmitWithDatePicker = async (choreId: string, choreName: string, dueDate?: Date) => {
    const today = new Date()
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    // Create date options for the last week
    const dateOptions = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      dateOptions.push(date)
    }
    
    let selectedDate = dueDate || today
    
    // If the chore is overdue, suggest the due date
    if (dueDate && dueDate < today) {
      const confirmBackdate = confirm(
        `This chore was due on ${dueDate.toLocaleDateString()}. ` +
        `When did you actually complete "${choreName}"?\n\n` +
        `Click OK to select from recent dates, or Cancel to mark as completed today.`
      )
      
      if (confirmBackdate) {
        const dateChoice = prompt(
          `Select completion date for "${choreName}":\n\n` +
          dateOptions.map((date, index) => 
            `${index + 1}. ${date.toLocaleDateString()} (${
              date.toDateString() === today.toDateString() ? 'Today' :
              date.toDateString() === new Date(today.getTime() - 24 * 60 * 60 * 1000).toDateString() ? 'Yesterday' :
              date.toLocaleDateString('en-US', { weekday: 'long' })
            })`
          ).join('\n') +
          `\n\nEnter a number (1-7):`
        )
        
        const choiceIndex = parseInt(dateChoice || '') - 1
        if (choiceIndex >= 0 && choiceIndex < dateOptions.length) {
          selectedDate = dateOptions[choiceIndex]
        }
      }
    }
    
    await handleChoreSubmit(choreId, selectedDate)
  }

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

  // Refresh feedback when filter changes
  useEffect(() => {
    if (user?.id) {
      fetchFeedback()
    }
  }, [feedbackFilter, user?.id])

  // Check if today's check-in is complete
  const isCheckInComplete = todaysCheckIn && 
    new Date(todaysCheckIn.date!).toDateString() === new Date().toDateString()

  // Show loading state while authenticating or fetching data
  if (status === 'loading' || loading || isCheckingToday || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">👋</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
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
        <div className="min-h-screen bg-background">
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
      <div className="min-h-screen bg-background">
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
    <div className="min-h-screen bg-background">
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
            <div className="flex items-center gap-2">
              <ThemeToggle />
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
      </div>

      <div className="px-4 py-4 sm:px-6 space-y-4 sm:space-y-6 max-w-4xl mx-auto">
        {/* Points Balance & Conversion Display */}
        <Card className="bg-gradient-to-r from-green-400 to-blue-500 text-white shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <div className="text-center">
              <div className="text-sm sm:text-base opacity-90 mb-2">Your Point Balance</div>
              <div className="text-3xl sm:text-4xl font-bold mb-3">{weeklyProgress.pointsEarned || 0} Points</div>
              <div className="text-lg sm:text-xl opacity-90">
                = ${((weeklyProgress.pointsEarned || 0) * (user?.pointRate || 1)).toFixed(2)} Value
              </div>
              <div className="text-xs sm:text-sm opacity-75 mt-2">
                1 point = ${(user?.pointRate || 1).toFixed(2)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats - Mobile Optimized Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <Card className="bg-white shadow-sm">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-lg sm:text-2xl font-bold text-green-600">{weeklyProgress.pointsEarned || 0}</div>
              <div className="text-xs sm:text-sm text-gray-600">Points This Week</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-sm">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-lg sm:text-2xl font-bold text-blue-600">
                {weeklyProgress.total > 0 ? Math.round((weeklyProgress.completed / weeklyProgress.total) * 100) : 0}%
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Complete</div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-lg sm:text-2xl font-bold text-purple-600">{user?.availablePoints || 0}</div>
              <div className="text-xs sm:text-sm text-gray-600">Available Points</div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-lg sm:text-2xl font-bold text-orange-600">{user?.bankedMoney || 0}</div>
              <div className="text-xs sm:text-sm text-gray-600">Banked Money</div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons - Mobile Friendly */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

          <Button 
            onClick={() => setShowBankingDialog(true)}
            variant="outline"
            className="h-12 sm:h-14 text-base sm:text-lg border-2 hover:bg-yellow-50 border-yellow-300 text-yellow-700"
            disabled={(user?.availablePoints || 0) === 0}
          >
            🏦 Bank Points
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <Button
            variant={activeTab === 'today' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('today')}
            className="flex-1 h-10"
          >
            📅 Today ({todaysChores.length})
          </Button>
          <Button
            variant={activeTab === 'week' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('week')}
            className="flex-1 h-10"
          >
            📋 This Week ({allWeeklyChores.length})
          </Button>
        </div>

        {/* Conditional Chore Sections */}
        {activeTab === 'today' ? (
          /* Today's Chores - Touch Friendly */
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
                  const isPending = pendingChores.has(chore.id)
                  const isSubmitting = submittingChores.has(chore.id)
                  
                  return (
                    <div 
                      key={`${chore.id}-${chore.scheduledDay}`}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 touch-manipulation ${
                        isApproved 
                          ? 'bg-green-50 border-green-200' 
                          : isPending
                          ? 'bg-yellow-50 border-yellow-200'
                          : isSubmitting
                          ? 'bg-blue-50 border-blue-200'
                          : chore.isOverdue
                          ? 'bg-red-50 border-red-200 hover:border-red-300 active:border-red-400'
                          : 'bg-white border-gray-200 hover:border-blue-300 active:border-blue-400'
                      }`}
                      onClick={() => !isSubmitted && !isSubmitting && handleChoreSubmitWithDatePicker(chore.id, chore.title, chore.dueDate)}
                    >
                      <div className="flex items-center space-x-4">
                        <div 
                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                            isApproved 
                              ? 'bg-green-500 border-green-500' 
                              : isPending 
                              ? 'bg-yellow-400 border-yellow-400'
                              : isSubmitting
                              ? 'bg-blue-400 border-blue-400'
                              : chore.isOverdue
                              ? 'border-red-400 hover:border-red-500'
                              : 'border-gray-300 hover:border-blue-500'
                          }`}
                        >
                          {isApproved && (
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                          {isPending && (
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                          )}
                          {isSubmitting && (
                            <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                          )}
                          {chore.isOverdue && !isSubmitted && !isSubmitting && (
                            <span className="text-red-500 text-xs">!</span>
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
                            {chore.isOverdue && !isSubmitted && (
                              <>
                                <span>•</span>
                                <span className="text-red-600 font-medium">⚠️ Overdue</span>
                              </>
                            )}
                            {isApproved && (
                              <>
                                <span>•</span>
                                <span className="text-green-600 font-medium">✓ Approved!</span>
                              </>
                            )}
                            {isPending && (
                              <>
                                <span>•</span>
                                <span className="text-yellow-600 font-medium">⏳ Pending...</span>
                              </>
                            )}
                            {isSubmitting && (
                              <>
                                <span>•</span>
                                <span className="text-blue-600 font-medium">📤 Submitting...</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-base sm:text-lg font-bold text-green-600">
                          {chore.points || 0} pts
                        </div>
                        <div className="text-xs text-gray-500">
                          ${((chore.points || 0) * (user?.pointRate || 1)).toFixed(2)}
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
                        {weeklyProgress.pointsEarned || 0} pts
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600">Points Earned</div>
                      <div className="text-xs text-gray-500">
                        ${((weeklyProgress.pointsEarned || 0) * (user?.pointRate || 1)).toFixed(2)}
                      </div>
                    </div>
                    
                    {(submittedChores.size > approvedChores.size) && (
                      <div>
                        <div className="text-xl sm:text-2xl font-bold text-yellow-600">
                          {(weeklyProgress.pointsPotential || 0) - (weeklyProgress.pointsEarned || 0)} pts
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600">Pending Review</div>
                      </div>
                    )}
                    
                    {(submittedChores.size === approvedChores.size) && (
                      <div>
                        <div className="text-xl sm:text-2xl font-bold text-gray-400">
                          {(weeklyProgress.pointsPotential || 0) - (weeklyProgress.pointsEarned || 0)} pts
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600">Still Possible</div>
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
        ) : (
          /* Weekly Chores View */
          <Card className="bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                This Week's Chores
                <Badge variant="secondary" className="text-xs">
                  {allWeeklyChores.length} total
                </Badge>
              </CardTitle>
              <CardDescription className="text-sm">
                All your chores for the week - tap to complete
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                // Group chores by day
                const choresByDay = allWeeklyChores.reduce((acc: any, chore: any) => {
                  const dayKey = chore.scheduledDayName || 'Any time'
                  if (!acc[dayKey]) acc[dayKey] = []
                  acc[dayKey].push(chore)
                  return acc
                }, {})

                const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Any time']
                
                return (
                  <div className="space-y-6">
                    {dayOrder.map(dayName => {
                      if (!choresByDay[dayName]) return null
                      const dayChores = choresByDay[dayName]
                      const today = new Date().getDay()
                      const dayIndex = dayOrder.indexOf(dayName)
                      const isToday = dayIndex === today
                      const isPast = dayIndex < today && dayIndex !== 7 // 7 is "Any time"
                      
                      return (
                        <div key={dayName} className="space-y-3">
                          <div className={`flex items-center gap-2 text-sm font-medium p-2 rounded-lg ${
                            isToday ? 'bg-blue-100 text-blue-800' :
                            isPast ? 'bg-red-50 text-red-700' :
                            'bg-gray-50 text-gray-700'
                          }`}>
                            <span className="text-lg">
                              {isToday ? '📅' : isPast ? '⚠️' : '📋'}
                            </span>
                            <span>{dayName}</span>
                            <Badge variant="outline" className="text-xs">
                              {dayChores.length}
                            </Badge>
                            {isToday && <span className="text-xs">(Today)</span>}
                            {isPast && <span className="text-xs">(Past due)</span>}
                          </div>
                          
                          <div className="space-y-2 ml-4">
                            {dayChores.map((chore: any) => {
                              const isSubmitted = submittedChores.has(chore.id)
                              const isApproved = approvedChores.has(chore.id)
                              const isPending = pendingChores.has(chore.id)
                              const isSubmitting = submittingChores.has(chore.id)
                              
                              return (
                                <div
                                  key={`${chore.id}-${chore.scheduledDay}`}
                                  className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                                    isApproved 
                                      ? 'bg-green-50 border-green-200' 
                                      : isPending
                                      ? 'bg-yellow-50 border-yellow-200'
                                      : isSubmitting
                                      ? 'bg-blue-50 border-blue-200'
                                      : chore.isOverdue
                                      ? 'bg-red-50 border-red-200 hover:border-red-300'
                                      : 'bg-white border-gray-200 hover:border-blue-300'
                                  }`}
                                  onClick={() => !isSubmitted && !isSubmitting && handleChoreSubmitWithDatePicker(chore.id, chore.title, chore.dueDate)}
                                >
                                  <div className="flex items-center gap-3 flex-1">
                                    <div 
                                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                        isApproved 
                                          ? 'bg-green-500 border-green-500' 
                                          : isPending 
                                          ? 'bg-yellow-400 border-yellow-400'
                                          : isSubmitting
                                          ? 'bg-blue-400 border-blue-400'
                                          : chore.isOverdue
                                          ? 'border-red-400'
                                          : 'border-gray-300'
                                      }`}
                                    >
                                      {isApproved && (
                                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      )}
                                      {isPending && (
                                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                        </svg>
                                      )}
                                      {isSubmitting && (
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <p className={`text-sm font-medium ${isApproved ? 'line-through text-green-700' : 'text-gray-900'}`}>
                                        {chore.title}
                                      </p>
                                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                        <span>{chore.estimatedMinutes}min</span>
                                        <span>•</span>
                                        <span>{chore.isRequired ? 'Required' : 'Optional'}</span>
                                        {isApproved && <span className="text-green-600">• ✓ Done</span>}
                                        {isPending && <span className="text-yellow-600">• ⏳ Pending</span>}
                                        {chore.isOverdue && !isSubmitted && <span className="text-red-600">• ⚠️ Overdue</span>}
                                      </div>
                                    </div>
                                  </div>
                                                                      <div className="text-sm font-bold text-green-600">
                                      {chore.points || 0} pts
                                    </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        )}

        {/* Feedback Section */}
        <Card className="bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              💬 Feedback from Parents
              {feedback.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {feedback.length}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-sm">
              See what your parents have noticed about your behavior
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filter Buttons */}
            <div className="flex gap-2 mb-4 overflow-x-auto">
              {(['day', 'week', 'month', 'all'] as const).map((filter) => (
                <Button
                  key={filter}
                  size="sm"
                  variant={feedbackFilter === filter ? 'default' : 'outline'}
                  onClick={() => {
                    setFeedbackFilter(filter)
                    fetchFeedback()
                  }}
                  className="whitespace-nowrap"
                >
                  {filter === 'day' ? 'Today' : 
                   filter === 'week' ? 'This Week' :
                   filter === 'month' ? 'This Month' : 'All Time'}
                </Button>
              ))}
            </div>

            {/* Feedback List */}
            <div className="space-y-3">
              {feedback.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>📝 No feedback yet for this period.</p>
                  <p className="text-sm mt-2">Keep up the great work!</p>
                </div>
              ) : (
                feedback.map((item: any) => (
                  <div 
                    key={item.id}
                    className={`p-3 rounded-lg border-2 ${
                      item.type === 'POSITIVE' ? 'bg-green-50 border-green-200' :
                      item.type === 'NEGATIVE' ? 'bg-red-50 border-red-200' :
                      'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl">
                        {item.type === 'POSITIVE' ? '👍' : item.type === 'NEGATIVE' ? '👎' : '📝'}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{item.title}</p>
                          {item.points && item.points !== 0 && (
                            <Badge 
                              variant={item.points > 0 ? 'default' : 'destructive'}
                              className="text-xs"
                            >
                              {item.points > 0 ? '+' : ''}{item.points} pts
                            </Badge>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          <span>{new Date(item.occurredAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>from {item.parent.name}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
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
                    You've earned {weeklyProgress.pointsEarned || 0} points today! That's worth ${((weeklyProgress.pointsEarned || 0) * (user?.pointRate || 1)).toFixed(2)}! Your parents will be so proud of you!
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

        {/* Upcoming Events - Mobile Optimized */}
        {upcomingEvents.length > 0 && (
          <Card className="bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                📅 Upcoming Events
                <Badge variant="secondary" className="text-xs">
                  {upcomingEvents.length}
                </Badge>
              </CardTitle>
              <CardDescription className="text-sm">
                Important family dates coming up
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingEvents.map((event: any) => {
                  const eventTypeEmojis: { [key: string]: string } = {
                    'GENERAL': '📅',
                    'BIRTHDAY': '🎂',
                    'ANNIVERSARY': '💕',
                    'MEETING': '👥',
                    'REMINDER': '⏰',
                    'OTHER': '📝'
                  }

                  return (
                    <div 
                      key={event.id}
                      className={`p-3 rounded-lg border-2 ${
                        event.daysUntil === 0 ? 'bg-red-50 border-red-300' :
                        event.daysUntil === 1 ? 'bg-orange-50 border-orange-300' :
                        event.daysUntil <= 7 ? 'bg-yellow-50 border-yellow-300' :
                        'bg-blue-50 border-blue-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{eventTypeEmojis[event.eventType] || '📅'}</span>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm sm:text-base">{event.title}</h4>
                          {event.description && (
                            <p className="text-xs sm:text-sm text-gray-600 mt-1">{event.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs sm:text-sm text-gray-500">
                              {new Date(event.eventDate).toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                month: 'short', 
                                day: 'numeric'
                              })}
                            </span>
                            <span className="text-xs sm:text-sm text-gray-400">•</span>
                            <span className={`text-xs sm:text-sm font-medium ${
                              event.daysUntil === 0 ? 'text-red-600' :
                              event.daysUntil === 1 ? 'text-orange-600' :
                              event.daysUntil <= 7 ? 'text-yellow-600' :
                              'text-blue-600'
                            }`}>
                              {event.daysUntil === 0 ? '🔥 Today!' :
                               event.daysUntil === 1 ? '⏰ Tomorrow' :
                               `⏳ ${event.daysUntil} days`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

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
                weeklyEarnings={weeklyProgress.earnings}
                completionRate={weeklyProgress.total > 0 ? Math.round((weeklyProgress.completed / weeklyProgress.total) * 100) : 0}
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

        {/* Banking Dialog */}
        {showBankingDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md bg-white shadow-2xl">
              <CardHeader>
                <CardTitle>🏦 Bank Your Points</CardTitle>
                <CardDescription>Request to convert your points to money</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-800">
                      Available: {user?.availablePoints || 0} points
                    </div>
                    <div className="text-sm text-blue-600">
                      Worth: ${((user?.availablePoints || 0) * (user?.pointRate || 1)).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Points to Bank:</label>
                  <input
                    type="number"
                    min="0.01"
                    max={user?.availablePoints || 0}
                    step="0.01"
                    placeholder="Enter points amount"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    id="bankingAmount"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Reason (optional):</label>
                  <textarea
                    placeholder="What do you want to save for?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    id="bankingReason"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowBankingDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={async () => {
                      const amount = parseFloat((document.getElementById('bankingAmount') as HTMLInputElement)?.value || '0')
                      const reason = (document.getElementById('bankingReason') as HTMLTextAreaElement)?.value || ''
                      
                      if (amount > 0 && amount <= (user?.availablePoints || 0)) {
                        try {
                          const response = await fetch('/api/banking/request', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ amount, reason })
                          })
                          
                          if (response.ok) {
                            setMessage({ type: 'success', text: `Banking request sent! ${amount} points (${((amount) * (user?.pointRate || 1)).toFixed(2)}) pending approval.` })
                            setShowBankingDialog(false)
                            fetchUserData()
                          } else {
                            throw new Error('Failed to submit banking request')
                          }
                        } catch (error) {
                          setMessage({ type: 'error', text: 'Failed to submit banking request. Please try again.' })
                        }
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Request Banking
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
} 