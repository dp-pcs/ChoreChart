"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface DailyCheckInReminderProps {
  userName: string
  onStartCheckIn: () => void
  onSkip: () => void
}

export function DailyCheckInReminder({ userName, onStartCheckIn, onSkip }: DailyCheckInReminderProps) {
  const [isSkipping, setIsSkipping] = useState(false)
  
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  })

  const handleSkip = () => {
    setIsSkipping(true)
    setTimeout(() => {
      onSkip()
    }, 500)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-card shadow-2xl animate-in fade-in-50 scale-in-95 duration-300">
        <CardHeader className="text-center pb-4">
          <div className="text-6xl mb-4 animate-bounce">📝</div>
          <CardTitle className="text-2xl text-foreground">
            Good morning, {userName}! 🌅
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            {today}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center space-y-3">
            <h3 className="text-lg font-semibold text-gray-800">
              Ready for your daily check-in?
            </h3>
            <p className="text-gray-600">
              It only takes 2 minutes and helps Chorbie give you better advice throughout the day!
            </p>
          </div>

          {/* Benefits */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">🎯 Quick check-in helps:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Track your mood and energy patterns</li>
              <li>• Get personalized tips from Chorbie</li>
              <li>• Earn streak bonuses and XP points</li>
              <li>• Help parents understand your day better</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={onStartCheckIn}
              size="lg"
              className="w-full h-12 text-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg"
            >
              🚀 Let's do this! (2 min)
            </Button>
            
            <Button 
              onClick={handleSkip}
              variant="outline"
              size="lg"
              disabled={isSkipping}
              className="w-full h-12 text-gray-600 border-2 hover:bg-gray-50"
            >
              {isSkipping ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                  Skipping...
                </>
              ) : (
                'Skip for today'
              )}
            </Button>
          </div>

          {/* Encouragement */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              💡 Tip: Kids who do daily check-ins earn 25% more rewards!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 