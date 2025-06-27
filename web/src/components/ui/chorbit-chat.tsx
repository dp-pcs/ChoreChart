"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { ChorbitMessage, ChorbitSchedule } from '@/lib/chorbit'

interface ChorbitChatProps {
  userId: string
  userRole: 'PARENT' | 'CHILD'
  userName: string
  currentChores?: any[]
  weeklyEarnings?: number
  completionRate?: number
  onScheduleGenerated?: (schedule: ChorbitSchedule) => void
  onExportRequest?: (schedule: ChorbitSchedule) => void
}

export function ChorbitChat({
  userId,
  userRole,
  userName,
  currentChores = [],
  weeklyEarnings = 0,
  completionRate = 0,
  onScheduleGenerated,
  onExportRequest
}: ChorbitChatProps) {
  const [messages, setMessages] = useState<ChorbitMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hey ${userName}! 👋 I'm Chorbit, your AI chore assistant! I can help you plan your day, prioritize tasks, and make chores more manageable. What would you like to work on?`,
      timestamp: new Date(),
      userId
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [generatedSchedule, setGeneratedSchedule] = useState<ChorbitSchedule | null>(null)

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: ChorbitMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
      userId
    }

    const currentInput = input.trim()
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chorbit/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentInput,
          userId,
          conversationHistory: messages, // Include full conversation history
          userContext: {
            userRole,
            userName,
            currentChores,
            weeklyEarnings,
            completionRate
          }
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const chorbitResponse = await response.json()
      
      // Ensure timestamp is a proper Date object and validate response
      if (chorbitResponse && chorbitResponse.content) {
        chorbitResponse.timestamp = new Date(chorbitResponse.timestamp || Date.now())
        setMessages(prev => [...prev, chorbitResponse])

        // Check if this was a schedule request
        if (currentInput.toLowerCase().includes('schedule') || currentInput.toLowerCase().includes('plan')) {
          await generateSchedule(currentInput)
        }
      } else {
        throw new Error('Invalid response from Chorbit')
      }

    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: ChorbitMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "I'm having some technical difficulties right now, but I'm still here to help! Could you try asking me that again? 🤖",
        timestamp: new Date(),
        userId
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const generateSchedule = async (userRequest: string) => {
    try {
      const response = await fetch('/api/chorbit/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput: userRequest,
          availableTime: 120, // 2 hours default
          currentChores,
          userPreferences: {
            energyLevels: 'morning',
            difficulty: 'mixed'
          }
        })
      })

      if (!response.ok) throw new Error('Failed to generate schedule')

      const schedule: ChorbitSchedule = await response.json()
      setGeneratedSchedule(schedule)
      onScheduleGenerated?.(schedule)

    } catch (error) {
      console.error('Schedule generation error:', error)
    }
  }

  const handleExportSchedule = () => {
    if (generatedSchedule) {
      onExportRequest?.(generatedSchedule)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const quickPrompts = [
    "Help me plan my morning",
    "What should I do first?",
    "I'm feeling overwhelmed",
    "Make chores more fun",
    "How do I stay motivated?"
  ]

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-t-lg flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-2xl">🤖</span>
          </div>
          <div>
            <CardTitle className="text-xl">Chorbit AI</CardTitle>
            <CardDescription className="text-purple-100">
              Your friendly chore assistant
            </CardDescription>
          </div>
          <Badge variant="secondary" className="ml-auto">
            {userRole === 'CHILD' ? 'Kid Mode' : 'Parent Mode'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden">
        <div 
          className="h-full max-h-[350px] overflow-y-auto p-4" 
          ref={scrollAreaRef}
          style={{ scrollBehavior: 'smooth' }}
        >
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Chorbit is thinking... 🤔</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {generatedSchedule && (
        <div className="px-4 py-2 bg-green-50 border-t flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">
                📅 {generatedSchedule.title}
              </p>
              <p className="text-xs text-green-600">
                {generatedSchedule.tasks.length} tasks • {generatedSchedule.totalTime} minutes
              </p>
            </div>
            <Button 
              size="sm" 
              onClick={handleExportSchedule}
              className="bg-green-600 hover:bg-green-700"
            >
              Export to iPhone
            </Button>
          </div>
        </div>
      )}

      <CardFooter className="p-4 border-t flex-shrink-0">
        <div className="w-full space-y-3">
          {/* Quick Prompts */}
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((prompt) => (
              <Button
                key={prompt}
                variant="outline"
                size="sm"
                onClick={() => setInput(prompt)}
                className="text-xs"
              >
                {prompt}
              </Button>
            ))}
          </div>

          {/* Message Input */}
          <div className="flex space-x-2">
            <Input
              value={input}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask Chorbit anything about chores, schedules, or time management..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={sendMessage} 
              disabled={!input.trim() || isLoading}
              className="bg-purple-500 hover:bg-purple-600"
            >
              Send
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
} 