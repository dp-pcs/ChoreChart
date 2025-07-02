// Chorbit - AI Assistant for ChoreChart
let openai: any = null

// Initialize OpenAI only on server side
if (typeof window === 'undefined' && process.env.OPENAI_API_KEY) {
  try {
    // Use dynamic import for better module resolution
    openai = require('openai')
    if (openai.default) openai = openai.default
    openai = new openai({
      apiKey: process.env.OPENAI_API_KEY,
    })
  } catch (error) {
    console.log('OpenAI not available, using demo mode for Chorbit:', error)
  }
}

export interface ChorbitMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  userId: string
}

export interface ChorbitSchedule {
  id: string
  title: string
  tasks: {
    name: string
    duration: number
    priority: 'high' | 'medium' | 'low'
    scheduledTime?: string
    tips: string[]
  }[]
  totalTime: number
  aiRecommendations: string[]
}

// User preferences interface
export interface UserPreferences {
  interests: string[] // ['basketball', 'soccer', 'gaming']
  motivationalStyle: 'encouraging' | 'competitive' | 'gentle' | 'funny'
  preferredGreeting: 'energetic' | 'calm' | 'sports' | 'fun'
  learningTopics: string[] // Things they're learning about
  sportsTeams: { sport: string; team: string; league: string }[]
  personalityTraits: string[] // ['organized', 'creative', 'athletic']
  conversationStyle: 'brief' | 'detailed' | 'interactive'
  learnedFacts: { [key: string]: any } // AI-discovered preferences
}

// Chorbit's enhanced personality and capabilities
const CHORBIT_BASE_PROMPT = `You are Chorbit, a friendly and encouraging AI assistant designed specifically for kids and families managing chores and responsibilities.

CORE PERSONALITY:
- Enthusiastic and positive, but not overly childish
- Encouraging and supportive, especially when kids feel overwhelmed
- Respectful of family rules and parental authority
- Uses age-appropriate language and concepts
- Makes chores feel manageable and sometimes even fun

CAPABILITIES:
- Help kids prioritize and schedule their chores
- Break down overwhelming tasks into manageable steps
- Suggest time-saving tips and efficient workflows
- Generate personalized schedules that can be exported to iOS
- Provide motivational support and celebrate progress
- Teach time management and responsibility skills
- Answer questions about chores, cleaning, and organization
- PERSONALIZATION: Use user interests and preferences to make conversations more engaging

SAFETY GUIDELINES:
- Always suggest kids discuss major schedule changes with parents
- Never override parental rules or chore assignments
- Keep conversations focused on chores, time management, and productivity
- If asked about non-chore topics, politely redirect back to helping with tasks
- Encourage family communication and cooperation

RESPONSE STYLE:
- Keep responses helpful but concise (2-3 sentences usually)
- Use encouraging language ("Great question!", "You've got this!", "Smart thinking!")
- Offer specific, actionable advice
- When appropriate, break tasks into numbered steps
- Celebrate small wins and progress
- PERSONALIZE based on user interests when possible

Remember: You're here to help kids succeed with their responsibilities while building good habits and confidence!`

export class ChorbitAI {
  private conversationHistory: ChorbitMessage[] = []
  
  async chat(
    message: string, 
    userId: string, 
    userContext?: {
      userRole: 'PARENT' | 'CHILD'
      userName: string
      currentChores: any[]
      weeklyEarnings: number
      completionRate: number
      preferences?: UserPreferences
    }
  ): Promise<ChorbitMessage> {
    
    // Add user message to history
    const userMessage: ChorbitMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
      userId
    }
    this.conversationHistory.push(userMessage)
    
    // Build personalized context
    let contextualPrompt = CHORBIT_BASE_PROMPT
    
    if (userContext) {
      contextualPrompt += `\n\nCURRENT USER CONTEXT:
- Name: ${userContext.userName}
- Role: ${userContext.userRole}
- Current chores: ${userContext.currentChores.length} tasks
- Weekly earnings: $${userContext.weeklyEarnings}
- Completion rate: ${userContext.completionRate}%
- Recent chores: ${userContext.currentChores.slice(0, 3).map(c => c.title).join(', ')}`

      // Add personalization context
      if (userContext.preferences) {
        const prefs = userContext.preferences
        contextualPrompt += `\n\nPERSONALIZATION CONTEXT:
- Interests: ${prefs.interests?.join(', ') || 'Getting to know them'}
- Motivational Style: ${prefs.motivationalStyle || 'encouraging'}
- Sports Teams: ${prefs.sportsTeams?.map(t => `${t.team} (${t.sport})`).join(', ') || 'None set'}
- Personality: ${prefs.personalityTraits?.join(', ') || 'Learning about them'}

PERSONALIZATION INSTRUCTIONS:
- Use their interests to make examples and motivation more engaging
- If they like sports, use sports metaphors and terminology
- If they have favorite teams, occasionally reference recent games or scores
- Match their preferred motivational style
- Remember facts they've shared about themselves`
      }
    }

    // Check if we should provide personalized updates
    const shouldFetchUpdates = this.shouldProvideUpdates(message, userContext?.preferences)
    let personalizedUpdates = ''
    
    if (shouldFetchUpdates) {
      personalizedUpdates = await this.fetchPersonalizedUpdates(userContext?.preferences)
    }

    if (personalizedUpdates) {
      contextualPrompt += `\n\nPERSONALIZED UPDATES: ${personalizedUpdates}`
    }

    // Check if we should ask validation questions
    const validationQuestion = await this.getValidationQuestion(userId, userContext?.preferences)
    if (validationQuestion) {
      contextualPrompt += `\n\nVALIDATION PROMPT: ${validationQuestion}`
    }
    
    try {
      // Check if OpenAI is available
      if (!openai) {
        throw new Error('OpenAI not configured')
      }

      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: contextualPrompt },
          ...this.conversationHistory.slice(-10).map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
          })),
        ],
        max_tokens: 350,
        temperature: 0.7,
      })
      
      const chorbitResponse: ChorbitMessage = {
        id: `chorbit-${Date.now()}`,
        role: 'assistant',
        content: response.choices[0]?.message?.content || "Sorry, I'm having trouble thinking right now. Try asking me again!",
        timestamp: new Date(),
        userId
      }
      
      this.conversationHistory.push(chorbitResponse)
      
      // Learn from conversation
      if (userContext?.preferences) {
        await this.learnFromConversation(message, chorbitResponse.content, userId)
      }
      
      return chorbitResponse
      
    } catch (error) {
      console.error('Chorbit AI Error:', error)
      
      // Provide personalized fallback responses
      let fallbackContent = this.getPersonalizedFallback(message, userContext?.preferences)
      
      const errorResponse: ChorbitMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: fallbackContent,
        timestamp: new Date(),
        userId
      }
      
      return errorResponse
    }
  }

  private isGreetingOrMorning(message: string): boolean {
    const greetingWords = ['good morning', 'hello', 'hey', 'hi', 'start', 'begin', 'morning']
    return greetingWords.some(word => message.toLowerCase().includes(word))
  }

  private shouldProvideUpdates(message: string, preferences?: any): boolean {
    // Provide updates on greetings or when asked about interests
    const isGreeting = this.isGreetingOrMorning(message)
    const mentionsInterests = message.toLowerCase().includes('news') || 
                             message.toLowerCase().includes('update') ||
                             message.toLowerCase().includes('happening')
    
    return isGreeting || mentionsInterests
  }

  private async fetchPersonalizedUpdates(preferences?: any): Promise<string> {
    try {
      const updates: string[] = []
      
      // Check user's interests and fetch relevant updates
      const interests = preferences?.interests || []
      
      for (const interest of interests) {
        if (interest.name === 'basketball' && interest.confidence > 0.6) {
          // Mock NBA update - replace with real API
          updates.push("🏀 NBA Update: Lakers are on a 3-game winning streak! They're looking strong this season.")
        }
        
        if (interest.name === 'soccer' && interest.confidence > 0.6) {
          updates.push("⚽ Soccer Update: Premier League season is heating up with some amazing matches!")
        }
        
        if (interest.category === 'sports' && interest.details?.favoriteTeam) {
          updates.push(`🏆 Your team ${interest.details.favoriteTeam} had a great performance recently!`)
        }
      }
      
      // Add weather or general updates occasionally
      if (Math.random() > 0.7) {
        updates.push("🌤️ Beautiful day outside - perfect for some outdoor activities after chores!")
      }
      
      return updates.join(' ')
      
    } catch (error) {
      console.error('Update fetch failed:', error)
      return ''
    }
  }

  private async getValidationQuestion(userId: string, preferences?: any): Promise<string> {
    try {
      // Check if validation is due
      const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/chorbit/learn?userId=${userId}`)
      if (!response.ok) return ''
      
      const data = await response.json()
      
      if (data.validationDue || data.interestsNeedingValidation?.length > 0) {
        const interestsToValidate = data.interestsNeedingValidation
        
        if (interestsToValidate.length > 0) {
          const interest = interestsToValidate[0]
          return `By the way, I remember you mentioned liking ${interest.name} - are you still into that these days? 🤔`
        }
        
        return "Hey, it's been a while since we caught up on your interests! What are you really excited about lately? 😊"
      }
      
      return ''
    } catch (error) {
      console.error('Validation check failed:', error)
      return ''
    }
  }

  private async fetchSportsData(preferences?: UserPreferences): Promise<string> {
    try {
      // Example: Fetch NBA scores (you'd use a real sports API)
      if (preferences?.interests?.includes('basketball')) {
        // Mock data - replace with real API call
        return "🏀 Quick NBA update: Lakers won 112-108 last night! LeBron had 28 points. Your team doing great this season!"
      }
      
      if (preferences?.sportsTeams && preferences.sportsTeams.length > 0) {
        const team = preferences.sportsTeams[0]
        return `🏀 ${team.team} update: Check out last night's game! They're having a solid season.`
      }
      
      return ''
    } catch (error) {
      console.error('Sports data fetch failed:', error)
      return ''
    }
  }

  private getPersonalizedFallback(message: string, preferences?: UserPreferences): string {
    const interests = preferences?.interests || []
    
    if (message.toLowerCase().includes('schedule') || message.toLowerCase().includes('plan')) {
      if (interests.includes('basketball')) {
        return "I'd love to help you plan your schedule! Think of it like setting up plays in basketball - let's strategize your chores and find time for shooting hoops too! 🏀"
      }
      return "I'd love to help you plan your schedule! First, let's look at your chores and figure out when you have time. What chores do you need to do today? 📝"
    }
    
    if (message.toLowerCase().includes('motivation') || message.toLowerCase().includes('tired')) {
      if (interests.includes('basketball')) {
        return "You've got this, champion! 🏀 Even NBA players have tough practice days, but they keep pushing through. Every chore you complete is like making a shot - you're building skills! 💪"
      }
      return "You've got this! 🌟 Remember, every small step counts. Maybe take a quick break, grab some water, and then tackle just one small task. Progress is progress!"
    }
    
    return "Oops! I'm having a little tech hiccup. Can you try asking me that again? I'm here to help! 🤖"
  }

  private async learnFromConversation(userMessage: string, assistantResponse: string, userId: string): Promise<void> {
    // Extract interests from conversation
    const sportsKeywords = ['basketball', 'soccer', 'football', 'baseball', 'hockey', 'tennis']
    const mentionedSports = sportsKeywords.filter(sport => 
      userMessage.toLowerCase().includes(sport) || assistantResponse.toLowerCase().includes(sport)
    )
    
    if (mentionedSports.length > 0) {
      // You could save learned preferences here
      console.log(`Learned that user ${userId} mentioned: ${mentionedSports.join(', ')}`)
    }
  }

  async generateSchedule(
    userInput: string,
    availableTime: number,
    currentChores: any[],
    userPreferences?: {
      preferredStartTime?: string
      energyLevels?: 'morning' | 'afternoon' | 'evening'
      difficulty?: 'easy' | 'mixed' | 'challenging'
      interests?: string[]
    }
  ): Promise<ChorbitSchedule> {
    
    let motivationalTheme = "productivity"
    if (userPreferences?.interests?.includes('basketball')) {
      motivationalTheme = "basketball training"
    } else if (userPreferences?.interests?.includes('gaming')) {
      motivationalTheme = "game achievement"
    }

    const prompt = `Help create a personalized chore schedule based on this request: "${userInput}"

Available time: ${availableTime} minutes
Current chores: ${currentChores.map(c => `${c.title} (${c.estimatedMinutes || 15} min, reward: $${c.reward})`).join(', ')}
${userPreferences ? `Preferences: ${JSON.stringify(userPreferences)}` : ''}
Motivational theme: ${motivationalTheme}

Please respond with a JSON object containing:
- title: A motivating title for this schedule (use ${motivationalTheme} metaphors if applicable)
- tasks: Array of scheduled tasks with name, duration, priority, scheduledTime, and helpful tips
- totalTime: Total estimated time
- aiRecommendations: Array of 2-3 helpful tips (personalized to their interests)

Make it encouraging and realistic for a kid to follow!`
    
    try {
      if (!openai) throw new Error('OpenAI not configured')
      
      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful AI that creates structured chore schedules in JSON format.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.7,
      })
      
      const content = response.choices[0]?.message?.content || ''
      
      try {
        return JSON.parse(content)
      } catch {
        // Fallback schedule
        return {
          id: `schedule-${Date.now()}`,
          title: userPreferences?.interests?.includes('basketball') 
            ? "Your Championship Chore Game Plan! 🏀"
            : "Your Awesome Daily Schedule! ✨",
          tasks: currentChores.slice(0, 3).map((chore, i) => ({
            name: chore.title,
            duration: chore.estimatedMinutes || 15,
            priority: chore.isRequired ? 'high' : 'medium',
            scheduledTime: `${9 + i}:00 AM`,
            tips: [`Take your time with ${chore.title}`, "You've got this!"]
          })),
          totalTime: currentChores.slice(0, 3).reduce((sum, c) => sum + (c.estimatedMinutes || 15), 0),
          aiRecommendations: [
            userPreferences?.interests?.includes('basketball') 
              ? "Just like practicing free throws, consistency is key! 🏀"
              : "Take breaks between tasks to stay fresh!",
            "Celebrate each completed chore - you're building great habits!"
          ]
        }
      }
      
    } catch (error) {
      console.error('Schedule generation error:', error)
      throw error
    }
  }
  
  // Export schedule to iOS formats
  generateiOSCalendarFile(schedule: ChorbitSchedule, startDate: Date): string {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ChoreChart//Chorbit Schedule//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
    ]
    
    schedule.tasks.forEach((task, index) => {
      const taskStart = new Date(startDate)
      taskStart.setMinutes(taskStart.getMinutes() + (index * task.duration))
      const taskEnd = new Date(taskStart)
      taskEnd.setMinutes(taskEnd.getMinutes() + task.duration)
      
      icsContent.push(
        'BEGIN:VEVENT',
        `UID:chorbit-${schedule.id}-${index}@chorechart.app`,
        `DTSTART:${taskStart.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTEND:${taskEnd.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `SUMMARY:${task.name}`,
        `DESCRIPTION:Generated by Chorbit AI\\n${task.tips.join('\\n') || 'You\'ve got this!'}`,
        'STATUS:CONFIRMED',
        'END:VEVENT'
      )
    })
    
    icsContent.push('END:VCALENDAR')
    return icsContent.join('\r\n')
  }
  
  clearHistory(): void {
    this.conversationHistory = []
  }
  
  getHistory(): ChorbitMessage[] {
    return [...this.conversationHistory]
  }
}

// Singleton instance
export const chorbit = new ChorbitAI() 