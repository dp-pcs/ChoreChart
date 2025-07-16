"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { ChorbieMessage, ChorbieSchedule, UserPreferences } from '@/lib/chorbit'

interface ChorbieChatProps {
  userId: string
  userRole: 'PARENT' | 'CHILD'
  userName: string
  currentChores?: any[]
  weeklyEarnings?: number
  completionRate?: number
  onScheduleGenerated?: (schedule: ChorbieSchedule) => void
  onExportRequest?: (schedule: ChorbieSchedule) => void
}

export function ChorbieChat({
  userId,
  userRole,
  userName,
  currentChores = [],
  weeklyEarnings = 0,
  completionRate = 0,
  onScheduleGenerated,
  onExportRequest
}: ChorbieChatProps) {
  const [messages, setMessages] = useState<ChorbieMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [generatedSchedule, setGeneratedSchedule] = useState<ChorbieSchedule | null>(null)

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Fetch user preferences on component mount
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await fetch(`/api/user/preferences?userId=${userId}`)
        if (response.ok) {
          const data = await response.json()
          setUserPreferences(data.preferences)
        }
      } catch (error) {
        console.error('Failed to fetch user preferences:', error)
        // Set default preferences
        setUserPreferences({
          interests: [],
          motivationalStyle: 'encouraging',
          preferredGreeting: 'energetic',
          learningTopics: [],
          sportsTeams: [],
          personalityTraits: [],
          conversationStyle: 'interactive',
          learnedFacts: {}
        })
      } finally {
        setIsInitialized(true)
      }
    }

    fetchPreferences()
  }, [userId])

  // Initialize welcome message based on preferences
  useEffect(() => {
    if (isInitialized && userPreferences) {
      const getPersonalizedWelcome = () => {
        const interests = userPreferences.interests || []
        
        if (interests.includes('basketball')) {
                  return `Hey ${userName}! 🏀 I'm Chorbie, your AI best friend! Ready to dominate today? I can help with chores, homework, chat about basketball, answer questions, or just hang out! What's up? ⭐`
      }
      
      if (interests.includes('gaming')) {
        return `Hey ${userName}! 🎮 I'm Chorbie, your AI buddy! Ready for today's quests? I can help with chores, homework, chat about games, answer any questions, or just talk about whatever! What's going on? ✨`
      }
      
      return `Hey ${userName}! 👋 I'm Chorbie, your AI friend! I'm here to help with chores, homework, answer questions about anything, or just chat about your interests! Think of me as your always-available smart buddy. What's happening today? 🌟`
      }

      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: getPersonalizedWelcome(),
        timestamp: new Date(),
        userId
      }])
    }
  }, [isInitialized, userPreferences, userName, userId])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: ChorbieMessage = {
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
            completionRate,
            preferences: userPreferences // Include user preferences
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
      const errorMessage: ChorbieMessage = {
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
            difficulty: 'mixed',
            interests: userPreferences?.interests || []
          }
        })
      })

      if (!response.ok) throw new Error('Failed to generate schedule')

      const schedule: ChorbieSchedule = await response.json()
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

  // Enhanced quick prompts that make kids want to engage
  const getQuickPrompts = () => {
    const interests = userPreferences?.interests || []
    
    if (interests.includes('basketball')) {
      return [
        "Help me plan my day like a game strategy 🏀",
        "What should I tackle first?",
        "I need some motivation, coach!",
        "Help me with my math homework 📐",
        "Tell me something cool about basketball! 🏆",
        "I'm feeling overwhelmed 😅"
      ]
    }
    
    if (interests.includes('gaming')) {
      return [
        "Help me plan my daily quests 🎮",
        "What's my next achievement?",
        "I need a motivation power-up! ⚡",
        "Help me with homework 📚",
        "Tell me a cool gaming fact! 🎯",
        "I'm stuck on something 🤔"
      ]
    }
    
    // Default prompts that appeal to all kids
    return [
      "Help me plan my day 📅",
      "I need help with homework 📚",
      "What should I do first?",
      "I'm feeling overwhelmed 😅",
      "Tell me something interesting! 🤓",
      "Make my chores more fun 🎉",
      "I have a random question 🤔",
      "I'm bored, entertain me! 😄"
    ]
  }

  const quickPrompts = getQuickPrompts()

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-t-lg flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-2xl">
              {userPreferences?.interests?.includes('basketball') ? '🏀' : 
               userPreferences?.interests?.includes('gaming') ? '🎮' : '🤖'}
            </span>
          </div>
          <div>
            <CardTitle className="text-xl">Chorbie AI</CardTitle>
            <CardDescription className="text-purple-100">
              {userPreferences?.interests?.includes('basketball') ? 'Your basketball-loving AI friend' :
               userPreferences?.interests?.includes('gaming') ? 'Your gaming buddy AI assistant' :
               'Your smart AI best friend'}
            </CardDescription>
          </div>
          <Badge variant="secondary" className="ml-auto">
            {userRole === 'CHILD' ? '🌟 Friend Mode' : '👨‍👩‍👧‍👦 Parent Mode'}
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
                  className={`max-w-[85%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-3 rounded-lg rounded-bl-sm">
                  <p className="text-sm text-gray-600">
                    {userPreferences?.interests?.includes('basketball') ? 'Chorbie is drawing up the perfect play... 🏀💭' :
                     userPreferences?.interests?.includes('gaming') ? 'Chorbie is loading the next level... 🎮⚡' :
                     'Chorbie is thinking of the best way to help... 🤖💭'}
                  </p>
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
          {/* Enhanced Quick Prompts */}
          <div className="flex flex-wrap gap-1.5">
            {quickPrompts.map((prompt, index) => (
              <Button
                key={prompt}
                variant="outline"
                size="sm"
                onClick={() => setInput(prompt)}
                className={`text-xs transition-all hover:scale-105 ${
                  index < 3 ? 'bg-purple-50 border-purple-200 hover:bg-purple-100' : 
                  'bg-blue-50 border-blue-200 hover:bg-blue-100'
                }`}
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
              placeholder={
                userPreferences?.interests?.includes('basketball') ? "Ask me about chores, homework, basketball, or anything! 🏀" :
                userPreferences?.interests?.includes('gaming') ? "Ask about chores, homework, games, or anything at all! 🎮" :
                "Ask me about chores, homework, or anything you're curious about! 🤖"
              }
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={sendMessage} 
              disabled={!input.trim() || isLoading}
              className="bg-purple-500 hover:bg-purple-600 px-6"
            >
              {isLoading ? '🤔' : '💬'}
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
} 