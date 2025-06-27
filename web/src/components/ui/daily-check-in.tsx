"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ChorbitChat } from '@/components/ui/chorbit-chat'
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
  const [showChorbitHelper, setShowChorbitHelper] = useState(false)

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
      title: "How are you feeling? 😊",
      component: (
        <div className="space-y-6">
          {/* Morning Energy */}
          <div>
            <h3 className="text-lg font-medium mb-3">Morning Energy Level</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {energyLevels.map((level) => (
                <Button
                  key={level.value}
                  variant={checkInData.morningEnergy === level.value ? "default" : "outline"}
                  onClick={() => setCheckInData(prev => ({ ...prev, morningEnergy: level.value as any }))}
                  className="h-16 flex flex-col"
                >
                  <span className="text-2xl">{level.emoji}</span>
                  <span className="text-xs">{level.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Overall Mood */}
          <div>
            <h3 className="text-lg font-medium mb-3">How's your day going overall?</h3>
            <div className="grid grid-cols-5 gap-2">
              {moodLevels.map((mood) => (
                <Button
                  key={mood.value}
                  variant={checkInData.overallMood === mood.value ? "default" : "outline"}
                  onClick={() => setCheckInData(prev => ({ ...prev, overallMood: mood.value as any }))}
                  className="h-16 flex flex-col"
                >
                  <span className="text-xl">{mood.emoji}</span>
                  <span className="text-xs">{mood.label}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      title: "What did you do today? 📅",
      component: (
        <div className="space-y-6">
          {/* Calendar Import */}
          <Card className="bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Import from Calendar</p>
                  <p className="text-sm text-gray-600">Speed up check-in with your daily schedule</p>
                </div>
                <Button onClick={requestCalendarAccess} size="sm">
                  📅 Import
                </Button>
              </div>
              {calendarEvents.length > 0 && (
                <div className="mt-3 space-y-2">
                  {calendarEvents.map((event, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span>{event.title} at {event.time}</span>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => toggleActivity(event.title.toLowerCase().replace(' ', '_'))}
                      >
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

                     {/* Activity Categories */}
           <div className="space-y-4">
             {commonActivities.map((category) => (
               <div key={category.category} className="space-y-2">
                 <h3 className="text-base font-medium capitalize">{category.category}</h3>
                 <div className="flex flex-wrap gap-2">
                   {category.items.map((activity) => (
                     <Badge
                       key={activity}
                       variant={checkInData.physicalActivity?.includes(activity) ? "default" : "outline"}
                       className="cursor-pointer hover:bg-blue-100 text-xs"
                       onClick={() => toggleActivity(activity)}
                     >
                       {activity.replace('_', ' ')}
                     </Badge>
                   ))}
                 </div>
               </div>
             ))}
           </div>

          {/* Custom Activity */}
          <div>
            <h3 className="text-lg font-medium mb-3">Anything else?</h3>
            <Input 
              placeholder="Type other activities..." 
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value) {
                  toggleActivity(e.currentTarget.value.toLowerCase().replace(' ', '_'))
                  e.currentTarget.value = ''
                }
              }}
            />
          </div>
        </div>
      )
    },
    {
      title: "To-dos & Projects 📝",
      component: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-3">What's on your to-do list?</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {commonTodos.map((todo) => (
                <Badge
                  key={todo}
                  variant={checkInData.specialEvents?.includes(todo) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-green-100"
                  onClick={() => toggleTag('specialEvents', todo)}
                >
                  {todo.replace('_', ' ')}
                </Badge>
              ))}
            </div>
          </div>

          {/* Homework/Project Progress */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Homework Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['Math', 'English', 'Science', 'History'].map((subject) => (
                    <div key={subject} className="flex items-center justify-between">
                      <span className="text-sm">{subject}</span>
                      <div className="flex gap-1">
                        {['❌', '⏳', '✅'].map((status, i) => (
                          <button
                            key={i}
                            className="text-lg hover:scale-110 transition-transform"
                            onClick={() => {
                              const hwKey = `homework_${subject.toLowerCase()}_${['incomplete', 'in_progress', 'complete'][i]}`
                              toggleTag('specialEvents', hwKey)
                            }}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Social Plans</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Who did you hang out with?</label>
                    <Input 
                      placeholder="Friends, family members..."
                      onChange={(e) => setCheckInData(prev => ({ 
                        ...prev, 
                        parentNotes: e.target.value 
                      }))}
                    />
                  </div>
                  <div className="flex gap-2">
                    {['friends', 'family', 'solo', 'mixed'].map((social) => (
                      <Button
                        key={social}
                        size="sm"
                        variant={checkInData.socialTime === social ? "default" : "outline"}
                        onClick={() => setCheckInData(prev => ({ ...prev, socialTime: social as any }))}
                      >
                        {social}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },
    {
      title: "Any challenges today? 🤔",
      component: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-3">What made things tough today?</h3>
            <div className="flex flex-wrap gap-2">
              {stressors.map((stressor) => (
                <Badge
                  key={stressor}
                  variant={checkInData.stressors?.includes(stressor) ? "destructive" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleStressor(stressor)}
                >
                  {stressor.replace('_', ' ')}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3">Screen time today (rough estimate)</h3>
            <div className="flex gap-2">
              {[30, 60, 120, 240, 360].map((minutes) => (
                <Button
                  key={minutes}
                  size="sm"
                  variant={checkInData.screenTime === minutes ? "default" : "outline"}
                  onClick={() => setCheckInData(prev => ({ ...prev, screenTime: minutes }))}
                >
                  {minutes < 60 ? `${minutes}m` : `${minutes/60}h`}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3">When did you go to bed last night?</h3>
            <Input 
              type="time"
              value={checkInData.bedtimeLastNight || ''}
              onChange={(e) => setCheckInData(prev => ({ 
                ...prev, 
                bedtimeLastNight: e.target.value 
              }))}
            />
          </div>
        </div>
      )
    },
    {
      title: "Quick reflection with Chorbit 🤖",
      component: (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-lg text-gray-600 mb-4">
              Chorbit wants to hear about your day! This helps us understand patterns and give you better advice.
            </p>
          </div>
          
                     <Card>
             <CardContent className="p-4">
               <div className="h-80 overflow-hidden">
                 <ChorbitChat
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
        </div>
      )
    }
  ]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Submit the check-in
      onSubmit({
        ...checkInData,
        id: `checkin-${Date.now()}`,
        userId,
        date: new Date()
      })
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const isStepComplete = () => {
    switch (currentStep) {
      case 0: return checkInData.morningEnergy && checkInData.overallMood
      case 1: return checkInData.physicalActivity && checkInData.physicalActivity.length > 0
      case 2: return checkInData.socialTime
      case 3: return checkInData.screenTime !== undefined && checkInData.bedtimeLastNight
      case 4: return true // Chorbit chat is optional
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
                 onClick={() => setShowChorbitHelper(!showChorbitHelper)}
                 size="sm"
               >
                 💬 Ask Chorbit
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

             {/* Optional Chorbit Helper */}
       {showChorbitHelper && (
         <Card>
           <CardHeader>
             <CardTitle className="text-lg">Ask Chorbit for Help 🤖</CardTitle>
             <Button 
               variant="ghost" 
               size="sm" 
               onClick={() => setShowChorbitHelper(false)}
               className="absolute top-4 right-4"
             >
               ✕
             </Button>
           </CardHeader>
           <CardContent>
             <div className="h-64 overflow-hidden">
               <ChorbitChat
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