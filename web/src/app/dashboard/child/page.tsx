import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChorbitChat } from '@/components/ui/chorbit-chat'

// This will be replaced with real data from the database
const mockChildData = {
  user: {
    id: 'child-1',
    name: 'Alex',
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
  const { user, todaysChores, weeklyProgress } = mockChildData

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
                  {todaysChores.map((chore) => (
                    <div 
                      key={chore.id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 border-2 border-gray-300 rounded-full hover:border-blue-500 cursor-pointer" />
                        <div>
                          <p className="font-medium text-gray-900">{chore.title}</p>
                          <p className="text-sm text-gray-500">
                            {chore.estimatedMinutes} minutes • {chore.isRequired ? 'Required' : 'Optional'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">${chore.reward}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                      Total possible today: <span className="font-bold text-green-600">
                        ${todaysChores.reduce((sum, chore) => sum + chore.reward, 0)}
                      </span>
                    </p>
                    <Button className="bg-blue-500 hover:bg-blue-600">
                      Start Working! 🚀
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
        <Card className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">You're doing great! 🌟</h3>
                <p className="text-yellow-100">
                  Keep up the good work! Every chore you complete helps your family and builds great habits.
                </p>
              </div>
              <div className="text-6xl">
                🏆
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 