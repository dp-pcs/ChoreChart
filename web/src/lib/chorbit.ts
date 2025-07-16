// Chorbie - AI Assistant for ChoreChart
let openai: any = null

// Initialize OpenAI only on server side
if (typeof window === 'undefined' && process.env.OPENAI_API_KEY) {
  try {
    // Use dynamic import for better module resolution
    const OpenAI = require('openai')
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
    console.log('OpenAI initialized successfully for Chorbie')
  } catch (error) {
    console.log('OpenAI not available, using demo mode for Chorbie:', error)
  }
}

export interface ChorbieMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  userId: string
}

export interface ChorbieSchedule {
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

// Enhanced Chorbie personality - much more engaging and kid-friendly
const CHORBIE_BASE_PROMPT = `You are Chorbie, an amazing AI best friend designed specifically for kids! You're like having a super-smart, encouraging friend who never gets tired of helping.

CORE PERSONALITY:
- Super enthusiastic and genuinely excited to help kids succeed
- Like a mix of a helpful older sibling, a great teacher, and a fun friend
- Use age-appropriate language but don't talk down to kids
- Celebrate wins (even small ones!) and provide comfort during challenges
- Make everything feel achievable and fun
- Remember what kids tell you and reference it in future conversations

YOUR SUPERPOWERS:
🎯 CHORE HELPER: Turn boring chores into missions, games, or challenges
📚 HOMEWORK BUDDY: Help break down assignments, study tips, organization
🏀 SPORTS & INTERESTS: Chat about basketball, soccer, gaming, hobbies - you love what they love!
⏰ TIME WIZARD: Create schedules, plans, and help with time management
🌟 LIFE COACH: Motivation, confidence building, problem-solving
🤔 KNOWLEDGE FRIEND: Answer questions about science, history, math, life

CONVERSATION STYLE:
- Be genuinely curious about their interests and life
- Ask follow-up questions to show you care
- Share fun facts related to their interests
- Use emojis and enthusiasm appropriately
- Connect everything back to building confidence and good habits
- Remember: You're not just a chore app - you're their AI friend who helps with EVERYTHING!

SAFETY & RESPECT:
- Always suggest discussing big decisions with parents
- Respect family rules and authority
- Encourage healthy habits and positive choices
- If asked about anything inappropriate, redirect to positive topics

Remember: Kids should feel like they have a super-smart, always-available friend who genuinely cares about them and wants to help them succeed in everything!`

export class ChorbitAI {
  private conversationHistory: ChorbieMessage[] = []
  
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
  ): Promise<ChorbieMessage> {
    
    // Add user message to history
    const userMessage: ChorbieMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
      userId
    }
    this.conversationHistory.push(userMessage)
    
    // Build personalized context
    let contextualPrompt = CHORBIE_BASE_PROMPT
    
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
      
      const chorbieResponse: ChorbieMessage = {
        id: `chorbie-${Date.now()}`,
        role: 'assistant',
        content: response.choices[0]?.message?.content || "Sorry, I'm having trouble thinking right now. Try asking me again!",
        timestamp: new Date(),
        userId
      }
      
      this.conversationHistory.push(chorbieResponse)
      
      // Learn from conversation
      if (userContext?.preferences) {
        await this.learnFromConversation(message, chorbieResponse.content, userId)
      }
      
      return chorbieResponse
      
    } catch (error) {
      console.error('Chorbit AI Error:', error)
      
      // Use enhanced intelligent fallback responses
      let fallbackContent = this.getIntelligentFallback(message, userContext)
      
      const errorResponse: ChorbieMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: fallbackContent,
        timestamp: new Date(),
        userId
      }
      
      this.conversationHistory.push(errorResponse)
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

  // MASSIVELY enhanced intelligent fallback system
  private getIntelligentFallback(message: string, userContext?: any): string {
    const msg = message.toLowerCase()
    const userName = userContext?.userName || 'friend'
    const interests = userContext?.preferences?.interests || []
    
    // === GREETINGS & INTRODUCTIONS ===
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey') || msg.includes('good morning') || msg.includes('what are you') || msg.includes('who are you')) {
      const greetings = [
        `Hey ${userName}! 👋 I'm Chorbie, your AI friend! Think of me as your super-smart buddy who's always here to help with chores, homework, questions about life, or just to chat about what you're into! What's on your mind today?`,
        `Hi there, ${userName}! 🌟 I'm Chorbie - imagine having a really smart friend who never gets tired of helping you succeed! I can help with chores, homework, answer questions about almost anything, and chat about your interests. What would you like to explore today?`,
        `Hey ${userName}! 🚀 I'm Chorbie, your personal AI assistant and friend! I'm here to help make your day awesome - whether that's tackling chores, getting homework done, learning cool stuff, or just having a fun conversation. What's going on today?`
      ]
      return greetings[Math.floor(Math.random() * greetings.length)]
    }

    // === HOMEWORK & SCHOOL HELP ===
    if (msg.includes('homework') || msg.includes('school') || msg.includes('study') || msg.includes('math') || msg.includes('science') || msg.includes('history') || msg.includes('english') || msg.includes('assignment')) {
      if (msg.includes('math')) {
        return `📐 Math homework, ${userName}? I love helping with math! Whether it's basic arithmetic, fractions, algebra, or geometry - I can break it down step by step. What specific math topic are you working on? Don't worry, we'll make it click! 🧮✨`
      }
      if (msg.includes('science')) {
        return `🔬 Science is so cool! Whether it's biology, chemistry, physics, or earth science, I can help explain concepts in ways that make sense. What science topic are you studying? Let's make learning fun! ⚗️🌟`
      }
      if (msg.includes('history')) {
        return `📚 History tells amazing stories! I can help you understand timelines, important events, and why things happened. What period or topic in history are you learning about? Let's dive into the past! ⏰🏛️`
      }
      if (msg.includes('english') || msg.includes('writing') || msg.includes('essay')) {
        return `✍️ Writing can be super rewarding! Whether you need help organizing your thoughts, improving your writing, or understanding literature, I'm here for you. What writing project are you working on? 📝🌟`
      }
      
      return `📚 Homework time, ${userName}? I'm your study buddy! I can help with math, science, history, English, or any other subject. I can also help you organize your assignments and create study schedules. What subject are you working on today? Let's make learning awesome! 🎓✨`
    }

    // === SPORTS & INTERESTS ===
    if (msg.includes('basketball') || msg.includes('sports') || msg.includes('game') || msg.includes('team') || interests.includes('basketball')) {
      if (msg.includes('basketball')) {
        return `🏀 Basketball! I love talking hoops! Whether you want to chat about your favorite teams, get tips on improving your game, or just talk about the latest NBA action - I'm totally here for it! Are you a player yourself, or do you love watching? What's your favorite team? 🏆`
      }
      return `⚽🏀⚾ Sports are awesome! Whether it's basketball, soccer, football, baseball, or any other sport - I love chatting about games, players, strategies, and helping you improve your own skills! What sport are you into? Tell me about your favorites! 🏟️✨`
    }

    if (msg.includes('gaming') || msg.includes('video game') || msg.includes('xbox') || msg.includes('playstation') || msg.includes('nintendo') || interests.includes('gaming')) {
      return `🎮 Gaming! I love chatting about games! Whether you're into action, adventure, sports games, puzzles, or anything else - games can be so creative and fun! What games are you playing lately? Are you working on any challenging levels? I can even help you balance gaming time with other activities! 🕹️✨`
    }

    // === CHORES & ORGANIZATION ===
    if (msg.includes('chore') || msg.includes('clean') || msg.includes('tidy') || msg.includes('organize') || msg.includes('room') || msg.includes('task')) {
      const choreResponses = [
        `🧹 Let's make chores feel like missions! ${userName}, I can help you turn any boring task into something more interesting. Want to race the clock? Create a cleaning playlist? Break big jobs into smaller wins? What chore are you tackling? Let's make it awesome! ✨`,
        `🏠 Cleaning and organizing can actually be pretty satisfying! I can help you figure out the best order to do things, find shortcuts, or even make it feel like a game. What area are you working on? Your room? Kitchen? Let's create a plan! 💪`,
        `⭐ Chores = life skills = future success! ${userName}, every time you complete a chore, you're literally building skills that will help you forever. Plus, that feeling when everything's clean? *Chef's kiss* 👌 What task can we conquer together?`
      ]
      return choreResponses[Math.floor(Math.random() * choreResponses.length)]
    }

    // === MOTIVATION & FEELINGS ===
    if (msg.includes('tired') || msg.includes('overwhelmed') || msg.includes('stressed') || msg.includes('hard') || msg.includes('difficult') || msg.includes('motivation') || msg.includes('help')) {
      return `💙 Hey ${userName}, I hear you. Sometimes things feel tough, and that's totally normal! You know what's amazing though? You reached out for help, and that shows you're smart and strong. Let's break whatever you're facing into smaller, manageable pieces. What's feeling overwhelming right now? We'll tackle it together, one step at a time! 🌟💪`
    }

    if (msg.includes('bored') || msg.includes('boring')) {
      return `😴 Bored, ${userName}? Let's fix that! We could plan something fun for after your tasks, find ways to make your current activities more interesting, chat about your hobbies, or I could tell you some cool facts! What sounds good? 🎉✨`
    }

    // === SCHEDULE & TIME MANAGEMENT ===
    if (msg.includes('schedule') || msg.includes('plan') || msg.includes('time') || msg.includes('organize') || msg.includes('busy')) {
      if (interests.includes('basketball')) {
        return `🏀 Time to create your game plan, ${userName}! Just like coaches design plays for victory, we can strategize your day for maximum success! Let's figure out your priorities and create a schedule that works. What do you need to get done today? 📋⏰`
      }
      return `⏰ I love helping with planning! ${userName}, good time management is like having a superpower - it makes everything feel more manageable and gives you more time for fun stuff! What do you need to fit into your schedule? Let's create a plan that actually works! 📅✨`
    }

    // === QUESTIONS & LEARNING ===
    if (msg.includes('why') || msg.includes('how') || msg.includes('what') || msg.includes('explain') || msg.includes('question')) {
      return `🤔 Great question, ${userName}! I love curious minds! I can help explain all sorts of things - science, history, how stuff works, life questions, you name it! I'll do my best to give you answers that actually make sense. What are you wondering about? 🧠✨`
    }

    // === ENCOURAGEMENT & THANKS ===
    if (msg.includes('thank') || msg.includes('thanks') || msg.includes('awesome') || msg.includes('cool') || msg.includes('good job')) {
      return `😊 Aww, thanks ${userName}! That totally made my day! I genuinely love helping you succeed and seeing you grow. You're doing great things, and I'm proud to be your AI friend! What else can we work on together? 🌟💙`
    }

    // === FUN & RANDOM ===
    if (msg.includes('fun') || msg.includes('joke') || msg.includes('funny') || msg.includes('laugh')) {
      const funResponses = [
        `😄 You want fun, ${userName}? Here's a fun fact: Did you know that octopuses have THREE hearts? Pretty cool, right? Speaking of cool - what's the most fun thing you've done lately? 🐙💙`,
        `🎉 Life should definitely have fun in it! ${userName}, what makes YOU laugh? Is it jokes, games, sports, hanging with friends? I love hearing about what brings people joy! Tell me about your favorite way to have fun! ✨`,
        `😆 Here's something fun: The word "serendipity" means discovering something awesome by accident! Kind of like how talking to me turned into something cool, right? What unexpected good things have happened to you lately? 🍀`
      ]
      return funResponses[Math.floor(Math.random() * funResponses.length)]
    }

    // === FOOD & FAVORITES ===
    if (msg.includes('food') || msg.includes('favorite') || msg.includes('like') || msg.includes('love')) {
      return `🍕 I love learning about what people enjoy! ${userName}, your favorites say so much about who you are! Whether it's food, movies, music, activities - I'm genuinely curious about what makes you happy. What are some of your current favorites? 😊✨`
    }

    // === DEFAULT SUPER-ENGAGING RESPONSE ===
    const defaultResponses = [
      `🤖 Hey ${userName}! I'm designed to be your helpful AI friend for basically everything! I can help with chores, homework, answer questions about life, chat about your interests, help you plan and organize, or just have a fun conversation. I'm genuinely curious about you and want to help you succeed! What's going on in your world today? ✨`,
      
      `🌟 Hi ${userName}! Think of me as your always-available smart friend who never gets tired of helping! Whether you need help with school stuff, want to make chores less boring, have questions about anything, or just want to chat about what you're into - I'm totally here for it! What can we work on together? 🚀`,
      
              `💙 Hey there, ${userName}! I'm Chorbie, and I genuinely care about helping you have awesome days! Whether that means conquering homework, making chores feel like games, answering your curious questions, or just being a friend who listens - I'm here for all of it! What's happening in your life right now? 😊`
    ]

    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)]
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
  ): Promise<ChorbieSchedule> {
    
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
        // Enhanced fallback schedule with personality
        return this.createFallbackSchedule(userInput, currentChores, userPreferences, availableTime)
      }
      
    } catch (error) {
      console.error('Schedule generation error:', error)
      return this.createFallbackSchedule(userInput, currentChores, userPreferences, availableTime)
    }
  }

  private createFallbackSchedule(userInput: string, currentChores: any[], userPreferences?: any, availableTime: number = 120): ChorbieSchedule {
    const isBasketballFan = userPreferences?.interests?.includes('basketball')
    const isGamer = userPreferences?.interests?.includes('gaming')
    
    let title = "Your Awesome Daily Plan! ✨"
    let recommendations = [
      "Take breaks between tasks to stay fresh!",
      "Celebrate each completed task - you're building great habits!"
    ]

    if (isBasketballFan) {
      title = "Your Championship Game Plan! 🏀🏆"
      recommendations = [
        "Just like basketball practice, consistency builds champions! 🏀",
        "Every completed task is like scoring points - you're winning! 🏆",
        "Champions prepare, execute, and celebrate their victories! 💪"
      ]
    } else if (isGamer) {
      title = "Your Epic Quest Playlist! 🎮⚡"
      recommendations = [
        "Each task is like completing a level - level up your life! 🎮",
        "Collect achievement points with every finished task! 🏆",
        "Real life XP gained with every completed challenge! ⚡"
      ]
    }

    const tasks = currentChores.slice(0, Math.min(5, Math.floor(availableTime / 20))).map((chore, i) => {
      let tips = [`Take your time with ${chore.title}`, "You've got this!"]
      
      if (isBasketballFan) {
        tips = [
          `Approach ${chore.title} like perfecting a free throw - focused and steady! 🏀`,
          "Champions pay attention to details - make it count! 🏆"
        ]
      } else if (isGamer) {
        tips = [
          `Think of ${chore.title} as your current quest objective! 🎮`,
          "Focus mode activated - time to complete this level! ⚡"
        ]
      }

             return {
         name: chore.title,
         duration: chore.estimatedMinutes || 20,
         priority: chore.isRequired ? 'high' as const : 'medium' as const,
         scheduledTime: `${9 + i}:${i % 2 === 0 ? '00' : '30'} AM`,
         tips
       }
    })

    const totalTime = tasks.reduce((sum, task) => sum + task.duration, 0)

    return {
      id: `schedule-${Date.now()}`,
      title,
      tasks,
      totalTime,
      aiRecommendations: recommendations
    }
  }
  
  // Export schedule to iOS formats
  generateiOSCalendarFile(schedule: ChorbieSchedule, startDate: Date): string {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ChoreChart//Chorbie Schedule//EN',
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
  
  getHistory(): ChorbieMessage[] {
    return [...this.conversationHistory]
  }
}

// Singleton instance
export const chorbie = new ChorbitAI() 