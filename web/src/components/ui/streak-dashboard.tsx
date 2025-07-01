"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { StreakData, Achievement, StreakMilestone } from '@/lib/gamification'

interface StreakDashboardProps {
  userId: string
  userName: string
}

export function StreakDashboard({ userId, userName }: StreakDashboardProps) {
  const [streakData, setStreakData] = useState<StreakData | null>(null)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [nextMilestones, setNextMilestones] = useState<StreakMilestone[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCelebration, setShowCelebration] = useState(false)

  useEffect(() => {
    fetchGamificationData()
    // Update login streak when component mounts
    updateLoginStreak()
  }, [userId])

  const fetchGamificationData = async () => {
    try {
      const response = await fetch(`/api/gamification?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setStreakData(data.streaks)
        setAchievements(data.achievements)
        setNextMilestones(data.nextMilestones)
      }
    } catch (error) {
      console.error('Failed to fetch gamification data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateLoginStreak = async () => {
    try {
      await fetch('/api/gamification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'updateLogin'
        })
      })
      // Refresh data after updating
      fetchGamificationData()
    } catch (error) {
      console.error('Failed to update login streak:', error)
    }
  }

  const updateCheckInStreak = async () => {
    try {
      const response = await fetch('/api/gamification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'updateCheckIn'
        })
      })
      
      if (response.ok) {
        setShowCelebration(true)
        setTimeout(() => setShowCelebration(false), 3000)
        fetchGamificationData()
      }
    } catch (error) {
      console.error('Failed to update check-in streak:', error)
    }
  }

  const useStreakFreeze = async (streakType: 'LOGIN' | 'CHECK_IN') => {
    try {
      const response = await fetch('/api/gamification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'useStreakFreeze',
          streakType
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          fetchGamificationData()
          alert('Streak freeze applied! Your streak is safe for today! 🧊')
        } else {
          alert('Could not use streak freeze. You might not have any available.')
        }
      }
    } catch (error) {
      console.error('Failed to use streak freeze:', error)
    }
  }

  const getStreakIcon = (days: number) => {
    if (days >= 365) return '🎉'
    if (days >= 100) return '🌟'
    if (days >= 50) return '👑'
    if (days >= 30) return '💎'
    if (days >= 14) return '🏆'
    if (days >= 7) return '⚡'
    if (days >= 3) return '🔥'
    return '💪'
  }

  const getLevelColor = (level: number) => {
    if (level >= 20) return 'from-purple-500 to-pink-500'
    if (level >= 15) return 'from-indigo-500 to-purple-500'
    if (level >= 10) return 'from-blue-500 to-indigo-500'
    if (level >= 5) return 'from-green-500 to-blue-500'
    return 'from-yellow-500 to-green-500'
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'bg-green-100 text-green-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'HARD': return 'bg-orange-100 text-orange-800'
      case 'LEGENDARY': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-gray-200 rounded-lg h-32"></div>
        <div className="animate-pulse bg-gray-200 rounded-lg h-48"></div>
      </div>
    )
  }

  if (!streakData) return null

  return (
    <div className="space-y-6">
      {/* Celebration Animation */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-8 text-center animate-bounce">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Streak Updated!</h2>
            <p className="text-gray-600">Keep up the amazing work!</p>
          </div>
        </div>
      )}

      {/* User Level & XP */}
      <Card className={`bg-gradient-to-r ${getLevelColor(streakData.level)} text-white`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{userName}</h2>
              <p className="text-white/80">Level {streakData.level} Champion</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{streakData.totalPoints}</div>
              <div className="text-white/80">Total Points</div>
            </div>
          </div>
          
          {/* XP Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-white/80 mb-1">
              <span>Level {streakData.level}</span>
              <span>{streakData.experiencePoints % 100}/100 XP</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-500"
                style={{ width: `${(streakData.experiencePoints % 100)}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Streak Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Login Streak */}
        <Card className="border-2 border-orange-200 bg-orange-50">
          <CardHeader className="text-center">
            <div className="text-4xl mb-2">
              {getStreakIcon(streakData.currentLoginStreak)}
            </div>
            <CardTitle className="text-orange-800">Login Streak</CardTitle>
            <CardDescription>Daily logins in a row</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-3xl font-bold text-orange-600">
              {streakData.currentLoginStreak} days
            </div>
            <div className="text-sm text-gray-600">
              Longest: {streakData.longestLoginStreak} days
            </div>
            
            {streakData.streakFreezes > 0 && (
              <Button
                onClick={() => useStreakFreeze('LOGIN')}
                variant="outline"
                size="sm"
                className="w-full"
              >
                🧊 Use Streak Freeze ({streakData.streakFreezes} left)
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Check-in Streak */}
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader className="text-center">
            <div className="text-4xl mb-2">
              {getStreakIcon(streakData.currentCheckInStreak)}
            </div>
            <CardTitle className="text-blue-800">Check-in Streak</CardTitle>
            <CardDescription>Daily check-ins completed</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-3xl font-bold text-blue-600">
              {streakData.currentCheckInStreak} days
            </div>
            <div className="text-sm text-gray-600">
              Longest: {streakData.longestCheckInStreak} days
            </div>
            
            <Button
              onClick={updateCheckInStreak}
              className="w-full bg-blue-500 hover:bg-blue-600"
            >
              Complete Today's Check-in
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Next Milestones */}
      {nextMilestones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🎯 Next Milestones
            </CardTitle>
            <CardDescription>Keep going to unlock these rewards!</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {nextMilestones.slice(0, 2).map((milestone, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{milestone.icon}</div>
                    <div>
                      <div className="font-medium">{milestone.title}</div>
                      <div className="text-sm text-gray-600">{milestone.days} day streak</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">{milestone.reward}</div>
                    <div className="text-sm text-gray-500">+{milestone.points} points</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Achievements */}
      {achievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🏆 Achievements
            </CardTitle>
            <CardDescription>Your awesome accomplishments!</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {achievements.slice(0, 5).map((achievement) => (
                <div key={achievement.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{achievement.icon}</div>
                    <div>
                      <div className="font-medium">{achievement.title}</div>
                      <div className="text-sm text-gray-600">{achievement.description}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getDifficultyColor(achievement.difficulty)}>
                      {achievement.difficulty}
                    </Badge>
                    <div className="text-sm text-gray-500 mt-1">
                      +{achievement.points} points
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Streak Tips */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50">
        <CardContent className="p-6">
          <h3 className="font-bold text-lg mb-3">🎮 Streak Tips</h3>
          <div className="space-y-2 text-sm">
            <p>• <strong>Daily login:</strong> Just opening the app counts! +10 XP</p>
            <p>• <strong>Daily check-in:</strong> Share how your day went +25 XP</p>
            <p>• <strong>Streak freezes:</strong> Save your streak when life gets busy</p>
            <p>• <strong>Consistency wins:</strong> Small daily actions build big results!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 