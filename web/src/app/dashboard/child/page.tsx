"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChorbitChat } from '@/components/ui/chorbit-chat'
import { DailyCheckIn } from '@/components/ui/daily-check-in'
import type { DailyCheckIn as DailyCheckInType } from '@/lib/behavior-tracking'
import React from 'react'

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

  // When a chore is submitted, start the approval simulation
  React.useEffect(() => {
    submittedChores.forEach(choreId => {
      if (!approvedChores.has(choreId)) {
        simulateParentApproval(choreId)
      }
    })
  }, [submittedChores, approvedChores])

  // Calculate earnings: only approved chores count toward actual earnings
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
      const response = await fetch('/api/chorbit/export', {
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
        a.download = `chorbit-schedule-${schedule.id}.ics`
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="container mx-auto py-4">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Daily Check-In</h1>
            <Button 
              variant="outline" 
              onClick={() => setShowCheckIn(false)}
            >
              ← Back to Dashboard
            </Button>
          </div>
          
          <DailyCheckIn
            userId={user.id}
            userName={user.name}
            onSubmit={handleCheckInSubmit}
            existingCheckIn={todaysCheckIn || undefined}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              Hey {user.name}! 👋
            </h1>
            <p className="text-lg text-gray-600 mt-2">
              Ready to earn some money and make your family proud?
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">This Week's Earnings</p>
            <p className="text-3xl font-bold text-green-600">
              ${user.weeklyEarnings.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500">
              of ${weeklyProgress.potential.toFixed(2)} possible
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column: Stats & Today's Chores */}
          <div className="lg:col-span-2 space-y-6">
            {/* Weekly Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>📊</span>
                  <span>This Week's Progress</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {weeklyProgress.completed}
                    </p>
                    <p className="text-sm text-gray-500">Completed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {weeklyProgress.total - weeklyProgress.completed}
                    </p>
                    <p className="text-sm text-gray-500">Remaining</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {user.completionRate}%
                    </p>
                    <p className="text-sm text-gray-500">Success Rate</p>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${(weeklyProgress.completed / weeklyProgress.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {weeklyProgress.completed} of {weeklyProgress.total} chores done this week
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Today's Chores */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>✅</span>
                  <span>Today's Chores</span>
                </CardTitle>
                <CardDescription>
                  Complete these to earn money and make your parents proud!
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
                        className={`flex items-center justify-between p-3 bg-white rounded-lg border transition-all duration-200 ${
                          isApproved 
                            ? 'border-green-300 bg-green-50' 
                            : isSubmitted
                            ? 'border-yellow-300 bg-yellow-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div 
                            className={`w-6 h-6 border-2 rounded-full cursor-pointer transition-all duration-200 flex items-center justify-center ${
                              isApproved
                                ? 'border-green-500 bg-green-500'
                                : isSubmitted
                                ? 'border-yellow-500 bg-yellow-500'
                                : 'border-gray-300 hover:border-blue-500'
                            }`}
                            onClick={() => handleChoreSubmit(chore.id)}
                                                      >
                              {isApproved && (
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                              {isSubmitted && !isApproved && (
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                          <div>
                            <p className={`font-medium ${isApproved ? 'text-green-700 line-through' : isSubmitted ? 'text-yellow-700 line-through' : 'text-gray-900'}`}>
                              {chore.title}
                            </p>
                            <p className="text-sm text-gray-500">
                              {chore.estimatedMinutes} minutes • {chore.isRequired ? 'Required' : 'Optional'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${isApproved ? 'text-green-600' : isSubmitted ? 'text-yellow-600' : 'text-gray-600'}`}>
                            ${chore.reward}
                          </p>
                                                      {isApproved && (
                              <p className="text-xs text-green-600">✓ Approved!</p>
                            )}
                            {isSubmitted && !isApproved && (
                              <p className="text-xs text-yellow-600">⏳ Pending...</p>
                            )}
                          </div>
                      </div>
                    )
                  })}
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      <p>
                        Approved: <span className="font-bold text-green-600">
                          ${approvedEarnings}
                        </span>
                      </p>
                      {submittedEarnings > approvedEarnings && (
                        <p>
                          Pending: <span className="font-bold text-yellow-600">
                            ${submittedEarnings - approvedEarnings}
                          </span>
                        </p>
                      )}
                      <p>
                        Total possible: <span className="font-bold text-gray-500">
                          ${todaysChores.reduce((sum, chore) => sum + chore.reward, 0)}
                        </span>
                      </p>
                    </div>
                    <Button className="bg-blue-500 hover:bg-blue-600">
                      {submittedChores.size === 0 ? 'Start Working! 🚀' : 'Keep Going! 💪'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Chorbit AI Assistant */}
          <div>
            <ChorbitChat
              userId={user.id}
              userRole={user.role}
              userName={user.name}
              currentChores={todaysChores}
              weeklyEarnings={user.weeklyEarnings}
              completionRate={user.completionRate}
              onScheduleGenerated={handleScheduleGenerated}
              onExportRequest={handleExportRequest}
            />
          </div>
        </div>

        {/* Motivational Section */}
        <Card className={`text-white ${
          approvedChores.size === todaysChores.length 
            ? 'bg-gradient-to-r from-green-400 to-emerald-500' 
            : submittedChores.size > 0
            ? 'bg-gradient-to-r from-blue-400 to-purple-500'
            : 'bg-gradient-to-r from-yellow-400 to-orange-500'
        }`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                                  {approvedChores.size === todaysChores.length ? (
                    <>
                      <h3 className="text-xl font-bold mb-2">Amazing work! All chores approved! 🎉</h3>
                      <p className="text-green-100">
                        You've earned ${approvedEarnings} today! Your parents will be so proud of you!
                      </p>
                    </>
                  ) : submittedChores.size > 0 ? (
                    <>
                      <h3 className="text-xl font-bold mb-2">Great progress! Keep it up! 💪</h3>
                      <p className="text-blue-100">
                        You've submitted {submittedChores.size} out of {todaysChores.length} chores. 
                        {approvedChores.size > 0 && ` ${approvedChores.size} approved so far!`}
                      </p>
                    </>
                  ) : (
                  <>
                    <h3 className="text-xl font-bold mb-2">You're doing great! 🌟</h3>
                    <p className="text-yellow-100">
                      Keep up the good work! Every chore you complete helps your family and builds great habits.
                    </p>
                  </>
                )}
              </div>
                              <div className="text-6xl">
                  {approvedChores.size === todaysChores.length ? '🎉' : submittedChores.size > 0 ? '💪' : '🏆'}
                </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 