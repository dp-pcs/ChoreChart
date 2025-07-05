import React, { useState } from 'react'
import { Button } from './button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Badge } from './badge'

interface Child {
  id: string
  name: string
  age?: number
  avatar?: string
}

interface Chore {
  id: string
  title: string
  description?: string
  assignedTo: string[]
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom' | 'once'
  reward: number
  estimatedMinutes: number
  category: string
  isRequired: boolean
  scheduledDays?: number[]
  isActive: boolean
}

interface ScheduleViewProps {
  children: Child[]
  chores: Chore[]
  selectedChild?: string
  onChildSelect: (childId: string) => void
}

export function ScheduleView({ children, chores, selectedChild, onChildSelect }: ScheduleViewProps) {
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily')
  const [selectedDate, setSelectedDate] = useState(new Date())

  const weekDays = [
    { id: 0, name: 'Sunday', short: 'Sun' },
    { id: 1, name: 'Monday', short: 'Mon' },
    { id: 2, name: 'Tuesday', short: 'Tue' },
    { id: 3, name: 'Wednesday', short: 'Wed' },
    { id: 4, name: 'Thursday', short: 'Thu' },
    { id: 5, name: 'Friday', short: 'Fri' },
    { id: 6, name: 'Saturday', short: 'Sat' }
  ]

  const getCategoryEmoji = (category: string) => {
    const emojis = {
      bedroom: '🛏️',
      kitchen: '🍽️',
      bathroom: '🚿',
      household: '🏠',
      outdoor: '🌳',
      pets: '🐕',
      general: '📋'
    }
    return emojis[category as keyof typeof emojis] || '📋'
  }

  const getChoresForDay = (dayIndex: number, childId?: string) => {
    return chores.filter(chore => {
      // Filter by child if specified
      if (childId && !chore.assignedTo.includes(childId)) return false
      
      // Filter by active status
      if (!chore.isActive) return false

      // Check if chore is scheduled for this day
      if (chore.frequency === 'daily' && chore.scheduledDays?.includes(dayIndex)) return true
      if (chore.frequency === 'weekly' && chore.scheduledDays?.includes(dayIndex)) return true
      
      return false
    })
  }

  const getTodaysChores = (childId?: string) => {
    const today = new Date().getDay()
    return getChoresForDay(today, childId)
  }

  const getWeeklyTotalRewards = (childId?: string) => {
    return chores
      .filter(chore => {
        if (!chore.isActive) return false
        if (childId && !chore.assignedTo.includes(childId)) return false
        return true
      })
      .reduce((total, chore) => {
        const multiplier = chore.frequency === 'daily' ? 
          (chore.scheduledDays?.length || 0) : 
          chore.frequency === 'weekly' ? 1 :
          chore.frequency === 'biweekly' ? 0.5 : 1
        return total + (chore.reward * multiplier)
      }, 0)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const getThisWeekDates = () => {
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())
    
    return weekDays.map((day, index) => {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + index)
      return date
    })
  }

  if (viewMode === 'daily') {
    const todaysChores = getTodaysChores(selectedChild)
    const todayIndex = new Date().getDay()
    const todayName = weekDays[todayIndex].name
    
    return (
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">📅 Daily Schedule</CardTitle>
                <CardDescription>
                  {formatDate(new Date())}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setViewMode('daily')}
                >
                  📅 Daily
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode('weekly')}
                >
                  🗓️ Weekly
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Child Filter */}
            <div className="flex gap-2 flex-wrap mb-4">
              <Button
                variant={!selectedChild ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChildSelect('')}
              >
                👨‍👩‍👧‍👦 All Children
              </Button>
              {children.map(child => (
                <Button
                  key={child.id}
                  variant={selectedChild === child.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onChildSelect(child.id)}
                >
                  🧒 {child.name}
                </Button>
              ))}
            </div>

            {/* Today's Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{todaysChores.length}</p>
                <p className="text-sm text-blue-800">Chores Today</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  ${todaysChores.reduce((sum, chore) => sum + chore.reward, 0).toFixed(2)}
                </p>
                <p className="text-sm text-green-800">Potential Earnings</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">
                  {todaysChores.reduce((sum, chore) => sum + chore.estimatedMinutes, 0)} min
                </p>
                <p className="text-sm text-purple-800">Estimated Time</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Chores */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Chores - {todayName}</CardTitle>
            <CardDescription>
              {selectedChild ? 
                `Showing chores for ${children.find(c => c.id === selectedChild)?.name}` :
                'Showing all children\'s chores'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {todaysChores.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-lg">🎉 No chores scheduled for today!</p>
                <p>Enjoy your free time or check the weekly view for upcoming chores.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todaysChores.map(chore => (
                  <div 
                    key={chore.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{getCategoryEmoji(chore.category)}</span>
                      <div>
                        <h3 className="font-medium">{chore.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>💰 ${chore.reward}</span>
                          <span>⏱️ {chore.estimatedMinutes} min</span>
                          {chore.isRequired && (
                            <Badge variant="destructive" className="text-xs">Required</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      Assigned to: {chore.assignedTo.length} 
                      {chore.assignedTo.length === 1 ? ' child' : ' children'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Weekly View
  const weekDates = getThisWeekDates()
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">🗓️ Weekly Schedule</CardTitle>
              <CardDescription>
                Week of {weekDates[0].toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric' 
                })} - {weekDates[6].toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </CardDescription>
            </div>
                         <div className="flex gap-2">
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() => setViewMode('daily')}
               >
                 📅 Daily
               </Button>
               <Button
                 variant="default"
                 size="sm"
                 onClick={() => setViewMode('weekly')}
               >
                 🗓️ Weekly
               </Button>
             </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Child Filter */}
          <div className="flex gap-2 flex-wrap mb-4">
            <Button
              variant={!selectedChild ? 'default' : 'outline'}
              size="sm"
              onClick={() => onChildSelect('')}
            >
              👨‍👩‍👧‍👦 All Children
            </Button>
            {children.map(child => (
              <Button
                key={child.id}
                variant={selectedChild === child.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChildSelect(child.id)}
              >
                🧒 {child.name}
              </Button>
            ))}
          </div>

          {/* Weekly Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                ${getWeeklyTotalRewards(selectedChild).toFixed(2)}
              </p>
              <p className="text-sm text-green-800">
                {selectedChild ? 'Potential Weekly Earnings' : 'Total Weekly Allowance'}
              </p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {chores
                  .filter(c => c.isActive && (selectedChild ? c.assignedTo.includes(selectedChild) : true))
                  .reduce((sum, chore) => {
                    const multiplier = chore.frequency === 'daily' ? 
                      (chore.scheduledDays?.length || 0) : 1
                    return sum + multiplier
                  }, 0)
                }
              </p>
              <p className="text-sm text-blue-800">Weekly Chores</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Calendar */}
      <Card>
        <CardHeader>
          <CardTitle>Week at a Glance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {weekDays.map((day, index) => {
              const dayChores = getChoresForDay(index, selectedChild)
              const dayDate = weekDates[index]
              const isToday = dayDate.toDateString() === new Date().toDateString()
              
              return (
                <div 
                  key={day.id}
                  className={`p-3 border rounded-lg ${
                    isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="text-center mb-2">
                    <h3 className={`font-medium ${isToday ? 'text-blue-700' : 'text-gray-700'}`}>
                      {day.short}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {dayDate.getDate()}
                    </p>
                    {isToday && (
                      <Badge variant="default" className="text-xs mt-1">Today</Badge>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    {dayChores.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center">No chores</p>
                    ) : (
                      dayChores.slice(0, 3).map(chore => (
                        <div 
                          key={chore.id}
                          className="text-xs p-2 bg-white rounded border"
                        >
                          <div className="flex items-center gap-1">
                            <span className="text-sm">{getCategoryEmoji(chore.category)}</span>
                            <span className="truncate">{chore.title}</span>
                          </div>
                          <div className="text-gray-500 mt-1">
                            ${chore.reward} • {chore.estimatedMinutes}min
                          </div>
                        </div>
                      ))
                    )}
                    {dayChores.length > 3 && (
                      <p className="text-xs text-gray-500 text-center">
                        +{dayChores.length - 3} more
                      </p>
                    )}
                  </div>
                  
                  {dayChores.length > 0 && (
                    <div className="mt-2 pt-2 border-t text-center">
                      <p className="text-xs font-medium text-green-600">
                        ${dayChores.reduce((sum, c) => sum + c.reward, 0).toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 