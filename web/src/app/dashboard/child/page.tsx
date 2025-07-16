"use client"

import { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChorbieChat } from '@/components/ui/chorbit-chat'
import { DailyCheckIn } from '@/components/ui/daily-check-in'
import type { DailyCheckIn as DailyCheckInType } from '@/lib/behavior-tracking'
import React from 'react'
import { Badge } from '@/components/ui/badge'

// This will be replaced with real data from the database
const mockChildData = {
  user: {
    id: 'child-1',
    name: 'Noah',
    role: 'CHILD' as const,
    weeklyEarnings: 15.50,
    completionRate: 78
  },
  todaysChores: [
    { id: '1', title: 'Make Bed', reward: 2, estimatedMinutes: 5, isRequired: true },
    { id: '2', title: 'Take Out Trash', reward: 3, estimatedMinutes: 10, isRequired: true },
    { id: '3', title: 'Clean Room', reward: 5, estimatedMinutes: 30, isRequired: false },
    { id: '4', title: 'Help with Dishes', reward: 4, estimatedMinutes: 15, isRequired: false }
  ],
  weeklyProgress: {
    completed: 12,
    total: 18,
    earnings: 15.50,
    potential: 25.00
  }
}

export default function ChildDashboard() {
  const [showCheckIn, setShowCheckIn] = useState(false)
  const [todaysCheckIn, setTodaysCheckIn] = useState<Partial<DailyCheckInType> | null>(null)
  const [submittedChores, setSubmittedChores] = useState<Set<string>>(new Set())
  const [approvedChores, setApprovedChores] = useState<Set<string>>(new Set()) // Mock parent approvals

  const { user, todaysChores, weeklyProgress } = mockChildData

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
    .filter(chore => submittedChores.has(chore.id))
    .reduce((sum, chore) => sum + chore.reward, 0)

  const approvedEarnings = todaysChores
    .filter(chore => approvedChores.has(chore.id))
    .reduce((sum, chore) => sum + chore.reward, 0)

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
        console.log('✅ Check-in saved:', result)
      }
    } catch (error) {
      console.error('❌ Check-in failed:', error)
    }
  }

  // Check if today's check-in is complete
  const isCheckInComplete = todaysCheckIn && 
    new Date(todaysCheckIn.date!).toDateString() === new Date().toDateString()

  if (showCheckIn) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DailyCheckIn 
          userId={user.id}
          userName={user.name}
          onSubmit={(data) => {
            setTodaysCheckIn(data)
            setShowCheckIn(false)
          }}
          existingCheckIn={todaysCheckIn || undefined}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
              {todaysChores.map((chore) => {
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
                        ${todaysChores.reduce((sum, chore) => sum + chore.reward, 0) - approvedEarnings}
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
      </div>
    </div>
  )
} 