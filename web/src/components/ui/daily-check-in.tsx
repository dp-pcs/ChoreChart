"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ChorbieChat } from '@/components/ui/chorbit-chat'
import type { DailyCheckIn } from '@/lib/behavior-tracking'

interface QuickCheckInProps {
  userId: string
  userName: string
  onSubmit: (checkIn: Partial<DailyCheckIn>) => void
  existingCheckIn?: Partial<DailyCheckIn>
}

export function DailyCheckIn({ userId, userName, onSubmit, existingCheckIn }: QuickCheckInProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [checkInData, setCheckInData] = useState<Partial<DailyCheckIn>>(existingCheckIn || {})
  const [calendarEvents, setCalendarEvents] = useState<any[]>([])
  const [showChorbieHelper, setShowChorbieHelper] = useState(false)

  // Quick selection options
  const energyLevels = [
    { value: 1, emoji: '😴', label: 'Sleepy' },
    { value: 2, emoji: '😐', label: 'Okay' },
    { value: 3, emoji: '😊', label: 'Good' },
    { value: 4, emoji: '🚀', label: 'Energized!' }
  ]

  const moodLevels = [
    { value: 1, emoji: '😤', label: 'Frustrated' },
    { value: 2, emoji: '😐', label: 'Meh' },
    { value: 3, emoji: '😊', label: 'Good' },
    { value: 4, emoji: '😇', label: 'Great' },
    { value: 5, emoji: '🤩', label: 'Amazing!' }
  ]

  const commonActivities = [
    { category: 'school', items: ['homework', 'test', 'project', 'presentation', 'study_group'] },
    { category: 'sports', items: ['soccer', 'basketball', 'swim', 'bike', 'run', 'gym'] },
    { category: 'social', items: ['friends_hangout', 'playdate', 'party', 'video_call', 'texting'] },
    { category: 'hobbies', items: ['reading', 'gaming', 'music', 'art', 'cooking', 'coding'] },
    { category: 'family', items: ['family_dinner', 'movie_night', 'outing', 'helping_parent', 'sibling_time'] },
    { category: 'screen', items: ['youtube', 'netflix', 'video_games', 'social_media', 'educational_videos'] }
  ]

  const commonTodos = [
    'finish_homework', 'study_for_test', 'work_on_project', 'practice_instrument', 
    'read_book', 'organize_room', 'call_friend', 'plan_weekend', 'pack_bag'
  ]

  const stressors = [
    'homework_pressure', 'friend_conflict', 'test_anxiety', 'schedule_change', 
    'family_tension', 'too_busy', 'tired', 'bored', 'overwhelmed'
  ]

  // Calendar integration function
  const requestCalendarAccess = async () => {
    try {
      // This would integrate with device calendar API
      // For demo, we'll simulate calendar events
      const mockEvents = [
        { title: 'Math Class', time: '9:00 AM', type: 'school' },
        { title: 'Soccer Practice', time: '3:30 PM', type: 'sports' },
        { title: 'Dinner with Family', time: '6:00 PM', type: 'family' }
      ]
      setCalendarEvents(mockEvents)
    } catch (error) {
      console.log('Calendar access not available')
    }
  }

  const toggleTag = (category: keyof DailyCheckIn, value: string) => {
    const currentValues = checkInData[category] as string[] || []
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value]
    
    setCheckInData(prev => ({ ...prev, [category]: newValues }))
  }

  const toggleActivity = (activity: string) => toggleTag('physicalActivity', activity)
  const toggleStressor = (stressor: string) => toggleTag('stressors', stressor)

  const steps = [
    {
      title: "Welcome to your daily check-in! ✨",
      component: (
        <div className="space-y-6 text-center">
          <div className="space-y-4">
            <div className="text-6xl">🌟</div>
            <h2 className="text-2xl font-bold text-gray-800">Quick Daily Check-in</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Just a few quick questions to help you reflect on your day and see if Chorbie can help you with anything! 
              This takes less than 2 minutes.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg max-w-md mx-auto">
              <p className="text-sm text-blue-700">
                <strong>What this does:</strong> Helps track your sleep, mood, and plans so Chorbie can give you 
                personalized study help, sports tips, or just celebrate your wins! 🎉
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "How are you feeling today? 😊",
      component: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-3 text-center">Pick the emoji that matches your energy right now</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {energyLevels.map((level) => (
                <Button
                  key={level.value}
                  variant={checkInData.morningEnergy === level.value ? "default" : "outline"}
                  onClick={() => setCheckInData(prev => ({ ...prev, morningEnergy: level.value as any }))}
                  className="h-20 flex flex-col"
                >
                  <span className="text-3xl">{level.emoji}</span>
                  <span className="text-sm font-medium">{level.label}</span>
                </Button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3 text-center">How's your day going overall?</h3>
            <div className="grid grid-cols-5 gap-2">
              {moodLevels.map((mood) => (
                <Button
                  key={mood.value}
                  variant={checkInData.overallMood === mood.value ? "default" : "outline"}
                  onClick={() => setCheckInData(prev => ({ ...prev, overallMood: mood.value as any }))}
                  className="h-20 flex flex-col"
                >
                  <span className="text-2xl">{mood.emoji}</span>
                  <span className="text-xs">{mood.label}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      title: "What time did you go to bed last night? 🌙",
      component: (
        <div className="space-y-6 text-center">
          <div>
            <div className="text-4xl mb-4">😴</div>
            <h3 className="text-xl font-medium mb-6">When did you go to sleep?</h3>
            <div className="max-w-xs mx-auto">
              <Input 
                type="time"
                value={checkInData.bedtimeLastNight || ''}
                onChange={(e) => setCheckInData(prev => ({ 
                  ...prev, 
                  bedtimeLastNight: e.target.value 
                }))}
                className="text-center text-lg h-12"
              />
            </div>
            <p className="text-sm text-gray-500 mt-3">
              Don't worry if it's not exact - just your best guess! 💤
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Do you have anything to do today? 📝",
      component: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🎯</div>
            <h3 className="text-xl font-medium">What's on your agenda?</h3>
            <p className="text-gray-600">Tell me about homework, sports, or anything else you're planning!</p>
          </div>
          
          <div>
            <Input 
              placeholder="E.g., 'Math homework', 'Basketball practice', 'Study for science test'..."
              value={checkInData.todaysPlan || ''}
              onChange={(e) => setCheckInData(prev => ({ 
                ...prev, 
                todaysPlan: e.target.value 
              }))}
              className="text-center text-lg h-12"
            />
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500">
              💡 Based on what you tell me, Chorbie might offer to help with study plans, practice tips, or other useful stuff!
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Let me help you with that! 🤖",
      component: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-4xl mb-3">🚀</div>
            <h3 className="text-xl font-medium mb-4">Chorbie's here to help!</h3>
            {checkInData.todaysPlan ? (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="font-medium text-blue-800">You said: "{checkInData.todaysPlan}"</p>
                </div>
                
                {/* Smart suggestions based on what they said */}
                <div className="space-y-3">
                  {checkInData.todaysPlan.toLowerCase().includes('homework') || 
                   checkInData.todaysPlan.toLowerCase().includes('study') || 
                   checkInData.todaysPlan.toLowerCase().includes('test') ? (
                    <div className="space-y-3">
                      <p className="text-lg">I can help you study! Want me to:</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        <Button 
                          variant="outline" 
                          onClick={() => setShowChorbieHelper(true)}
                          className="bg-green-50 border-green-200 hover:bg-green-100"
                        >
                          📚 Create a Study Plan
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowChorbieHelper(true)}
                          className="bg-purple-50 border-purple-200 hover:bg-purple-100"
                        >
                          🃏 Make Flashcards
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowChorbieHelper(true)}
                          className="bg-blue-50 border-blue-200 hover:bg-blue-100"
                        >
                          📝 Create Practice Test
                        </Button>
                      </div>
                    </div>
                  ) : checkInData.todaysPlan.toLowerCase().includes('basketball') ||
                        checkInData.todaysPlan.toLowerCase().includes('soccer') ||
                        checkInData.todaysPlan.toLowerCase().includes('sports') ||
                        checkInData.todaysPlan.toLowerCase().includes('practice') ? (
                    <div className="space-y-3">
                      <p className="text-lg">Sports practice! Want me to:</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        <Button 
                          variant="outline" 
                          onClick={() => setShowChorbieHelper(true)}
                          className="bg-orange-50 border-orange-200 hover:bg-orange-100"
                        >
                          🏀 Find Coaching Tips
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowChorbieHelper(true)}
                          className="bg-red-50 border-red-200 hover:bg-red-100"
                        >
                          💪 Suggest Drills
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-lg">Sounds interesting! Want to:</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        <Button 
                          variant="outline" 
                          onClick={() => setShowChorbieHelper(true)}
                          className="bg-blue-50 border-blue-200 hover:bg-blue-100"
                        >
                          💬 Chat with Chorbie
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-lg text-gray-600">No plans today? That's totally fine!</p>
                <Button 
                  variant="outline" 
                  onClick={() => setShowChorbieHelper(true)}
                  className="bg-blue-50 border-blue-200 hover:bg-blue-100"
                >
                  💬 Chat with Chorbie anyway
                </Button>
              </div>
            )}
            
            <div className="mt-6">
              <Button 
                variant="outline"
                onClick={() => handleNext()}
                className="bg-gray-50 border-gray-200 hover:bg-gray-100"
              >
                ✅ No thanks, finish check-in
              </Button>
            </div>
          </div>
          
          {showChorbieHelper && (
            <Card className="mt-4">
              <CardContent className="p-4">
                <div className="h-80 overflow-hidden">
                  <ChorbieChat
                    userId={userId}
                    userRole="CHILD"
                    userName={userName}
                    currentChores={[]}
                    weeklyEarnings={0}
                    completionRate={0}
                    onScheduleGenerated={() => {}}
                    onExportRequest={() => {}}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )
    }
  ]

  const handleNext = () => {
    console.log('🎯 handleNext called, currentStep:', currentStep, 'total steps:', steps.length)
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Submit the check-in
      const finalCheckInData = {
        ...checkInData,
        id: `checkin-${Date.now()}`,
        userId,
        date: new Date(), // Keep as Date object for type compatibility
        todaysPlan: checkInData.todaysPlan || '' // Include the new field
      }
      console.log('🎯 Final check-in data being submitted:', finalCheckInData)
      console.log('🎯 userId value:', userId)
      console.log('🎯 checkInData state:', checkInData)
      alert(`About to submit check-in for ${userName || 'user'}! 🎉`)
      onSubmit(finalCheckInData)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const isStepComplete = () => {
    switch (currentStep) {
      case 0: return true // Welcome step - no requirements
      case 1: return checkInData.morningEnergy && checkInData.overallMood // How are you feeling
      case 2: return checkInData.bedtimeLastNight // Bedtime is required
      case 3: return true // Plans step - optional, they can skip
      case 4: return true // Chorbie help step - always complete
      default: return false
    }
  }

     return (
     <div className="max-w-4xl mx-auto p-4 space-y-6">
       <Card className="min-h-[700px] flex flex-col">
         <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Daily Check-In ✨</CardTitle>
              <CardDescription>
                Step {currentStep + 1} of {steps.length} • {steps[currentStep].title}
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </CardHeader>

                 <CardContent className="min-h-[500px] pb-8">
           <div className="h-full overflow-y-auto">
             {steps[currentStep].component}
           </div>
         </CardContent>

                 <div className="flex justify-between items-center p-6 border-t bg-gray-50 mt-auto">
           <Button 
             variant="outline" 
             onClick={handlePrevious}
             disabled={currentStep === 0}
             size="sm"
           >
             Previous
           </Button>
           
           <div className="flex gap-2">
             {currentStep < steps.length - 1 && (
               <Button 
                 variant="outline"
                 onClick={() => setShowChorbieHelper(!showChorbieHelper)}
                 size="sm"
               >
                 💬 Ask Chorbie
               </Button>
             )}
             
             <Button 
               onClick={handleNext}
               disabled={!isStepComplete()}
               className="bg-blue-500 hover:bg-blue-600"
               size="sm"
             >
               {currentStep === steps.length - 1 ? 'Complete Check-in 🎉' : 'Next'}
             </Button>
           </div>
         </div>
      </Card>

                       {/* Optional Chorbie Helper */}
          {showChorbieHelper && (
         <Card>
           <CardHeader>
                           <CardTitle className="text-lg">Ask Chorbie for Help 🤖</CardTitle>
             <Button 
               variant="ghost" 
               size="sm" 
                               onClick={() => setShowChorbieHelper(false)}
               className="absolute top-4 right-4"
             >
               ✕
             </Button>
           </CardHeader>
           <CardContent>
             <div className="h-64 overflow-hidden">
               <ChorbieChat
                 userId={userId}
                 userRole="CHILD"
                 userName={userName}
                 currentChores={[]}
                 weeklyEarnings={0}
                 completionRate={0}
                 onScheduleGenerated={() => {}}
                 onExportRequest={() => {}}
               />
             </div>
           </CardContent>
         </Card>
       )}
    </div>
  )
} 