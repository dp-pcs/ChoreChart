"use client"

import { useState } from 'react'
import { DailyCheckIn } from '@/components/ui/daily-check-in'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { DailyCheckIn as DailyCheckInType } from '@/lib/behavior-tracking'

export default function CheckInDemo() {
  const [submittedCheckIn, setSubmittedCheckIn] = useState<Partial<DailyCheckInType> | null>(null)
  const [showResults, setShowResults] = useState(false)

  const handleCheckInSubmit = (checkIn: Partial<DailyCheckInType>) => {
    setSubmittedCheckIn(checkIn)
    setShowResults(true)
    console.log('📊 Check-in submitted:', checkIn)
  }

  const mockAIInsights = {
    patterns: [
      "You seem to have more energy on days when you do physical activity! 🏃‍♂️",
      "Your mood is typically higher when you spend time with friends 👫",
      "Late bedtimes seem to affect your morning energy the next day 😴"
    ],
    recommendations: [
      "Try to include some physical activity every day for better energy",
      "Consider a consistent bedtime routine to improve morning mood",
      "Balance screen time with other activities for better overall mood"
    ]
  }

  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="bg-green-100 border-green-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🎉 Check-in Complete!
              </CardTitle>
              <CardDescription>
                Thanks for sharing about your day! Here's what we learned:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Your Day Summary:</h3>
                  <div className="space-y-2 text-sm">
                    <p>• Morning Energy: {['😴', '😐', '😊', '🚀'][submittedCheckIn!.morningEnergy! - 1]} {['Sleepy', 'Okay', 'Good', 'Energized!'][submittedCheckIn!.morningEnergy! - 1]}</p>
                    <p>• Overall Mood: {['😤', '😐', '😊', '😇', '🤩'][submittedCheckIn!.overallMood! - 1]} {['Frustrated', 'Meh', 'Good', 'Great', 'Amazing!'][submittedCheckIn!.overallMood! - 1]}</p>
                    <p>• Activities: {submittedCheckIn!.physicalActivity?.map(a => a.replace('_', ' ')).join(', ')}</p>
                    <p>• Social Time: {submittedCheckIn!.socialTime}</p>
                    <p>• Screen Time: {submittedCheckIn!.screenTime} minutes</p>
                    <p>• Bedtime Last Night: {submittedCheckIn!.bedtimeLastNight}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3">Chorbit's Quick Insights:</h3>
                  <div className="space-y-2">
                    {mockAIInsights.patterns.map((pattern, i) => (
                      <div key={i} className="p-2 bg-white rounded text-sm">
                        {pattern}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded">
                <h4 className="font-medium mb-2">📈 What This Data Helps Us Learn:</h4>
                <ul className="text-sm space-y-1">
                  <li>• Patterns between activities and mood</li>
                  <li>• How sleep affects your energy levels</li>
                  <li>• What activities make you happiest</li>
                  <li>• Social interactions and their impact</li>
                  <li>• Screen time balance with other activities</li>
                </ul>
              </div>
              
              <div className="mt-4 flex gap-2">
                <button 
                  onClick={() => {
                    setShowResults(false)
                    setSubmittedCheckIn(null)
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Try Another Check-in
                </button>
                <button 
                  onClick={() => window.location.href = '/dashboard/child'}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Go to Dashboard
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            📝 Daily Check-In Demo
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Experience our quick and engaging daily check-in that captures activities, 
            mood, and patterns to help families understand what works best!
          </p>
        </div>

        {/* Features Preview */}
                 <div className="grid md:grid-cols-3 gap-6 mb-8 max-w-6xl mx-auto">
           <Card className="h-full">
             <CardHeader>
               <CardTitle className="text-lg flex items-center gap-2">
                 📅 Smart Activity Tracking
               </CardTitle>
             </CardHeader>
             <CardContent>
               <ul className="text-sm space-y-1">
                 <li>• Calendar integration</li>
                 <li>• Quick activity tags</li>
                 <li>• Homework/project progress</li>
                 <li>• Social interaction tracking</li>
               </ul>
             </CardContent>
           </Card>

           <Card className="h-full">
             <CardHeader>
               <CardTitle className="text-lg flex items-center gap-2">
                 🧠 Mood & Energy Insights
               </CardTitle>
             </CardHeader>
             <CardContent>
               <ul className="text-sm space-y-1">
                 <li>• Morning energy levels</li>
                 <li>• Overall mood tracking</li>
                 <li>• Stress factor identification</li>
                 <li>• Sleep pattern correlation</li>
               </ul>
             </CardContent>
           </Card>

           <Card className="h-full">
             <CardHeader>
               <CardTitle className="text-lg flex items-center gap-2">
                 🤖 AI-Powered Analysis
               </CardTitle>
             </CardHeader>
             <CardContent>
               <ul className="text-sm space-y-1">
                 <li>• Pattern recognition</li>
                 <li>• Behavioral correlations</li>
                 <li>• Personalized insights</li>
                 <li>• Family conversation starters</li>
               </ul>
             </CardContent>
           </Card>
         </div>

        {/* Demo Check-in */}
        <DailyCheckIn
          userId="demo-user"
          userName="Demo Kid"
          onSubmit={handleCheckInSubmit}
        />

        {/* Benefits Section */}
        <div className="mt-12 max-w-4xl mx-auto">
          <Card className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
            <CardContent className="p-8">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-4">🚀 Why Daily Check-ins are Game-Changing</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">For Kids:</h4>
                    <ul className="text-yellow-100 text-sm space-y-1">
                      <li>• Learn self-awareness and reflection</li>
                      <li>• Understand their own patterns</li>
                      <li>• Quick and fun (not a chore!)</li>
                      <li>• Connect with Chorbit AI for support</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">For Parents:</h4>
                    <ul className="text-yellow-100 text-sm space-y-1">
                      <li>• Data-driven family conversations</li>
                      <li>• Identify triggers and patterns</li>
                      <li>• Celebrate positive trends</li>
                      <li>• Better understand your child</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 