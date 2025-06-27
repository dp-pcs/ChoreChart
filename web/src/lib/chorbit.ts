// Chorbit - AI Assistant for ChoreChart
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

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
    tips?: string
  }[]
  totalTime: number
  aiRecommendations: string[]
}

// Chorbit's personality and capabilities
const CHORBIT_SYSTEM_PROMPT = `You are Chorbit, a friendly and encouraging AI assistant designed specifically for kids and families managing chores and responsibilities.

PERSONALITY:
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
    
    // Prepare context for Chorbit
    let contextualPrompt = CHORBIT_SYSTEM_PROMPT
    
    if (userContext) {
      contextualPrompt += `\n\nCURRENT USER CONTEXT:
- Name: ${userContext.userName}
- Role: ${userContext.userRole}
- Current chores: ${userContext.currentChores.length} tasks
- Weekly earnings: $${userContext.weeklyEarnings}
- Completion rate: ${userContext.completionRate}%
- Recent chores: ${userContext.currentChores.slice(0, 3).map(c => c.title).join(', ')}`
    }
    
    try {
      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          { role: 'system', content: contextualPrompt },
          ...this.conversationHistory.slice(-10).map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
          })),
        ],
        max_tokens: 300,
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
      return chorbitResponse
      
    } catch (error) {
      console.error('Chorbit AI Error:', error)
      
      const errorResponse: ChorbitMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "Oops! I'm having a little tech hiccup. Can you try asking me that again? I'm here to help! 🤖",
        timestamp: new Date(),
        userId
      }
      
      return errorResponse
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
    }
  ): Promise<ChorbitSchedule> {
    
    const prompt = `Help create a personalized chore schedule based on this request: "${userInput}"

Available time: ${availableTime} minutes
Current chores: ${currentChores.map(c => `${c.title} (${c.estimatedMinutes || 15} min, reward: $${c.reward})`).join(', ')}
${userPreferences ? `Preferences: ${JSON.stringify(userPreferences)}` : ''}

Please respond with a JSON object containing:
- title: A motivating title for this schedule
- tasks: Array of scheduled tasks with name, duration, priority, scheduledTime, and helpful tips
- totalTime: Total estimated time
- aiRecommendations: Array of 2-3 helpful tips

Make it encouraging and realistic for a kid to follow!`

    try {
      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          { role: 'system', content: CHORBIT_SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.8,
      })
      
      const content = response.choices[0]?.message?.content || ''
      
      // Try to parse as JSON, fallback to structured response
      try {
        return JSON.parse(content)
      } catch {
        // Fallback schedule if JSON parsing fails
        return {
          id: `schedule-${Date.now()}`,
          title: "Your Chorbit-Generated Schedule",
          tasks: currentChores.slice(0, 3).map((chore, i) => ({
            name: chore.title,
            duration: chore.estimatedMinutes || 15,
            priority: i === 0 ? 'high' : 'medium',
            tips: `Take your time and do your best! Remember, $${chore.reward} awaits! 🌟`
          })),
          totalTime: currentChores.slice(0, 3).reduce((total, chore) => total + (chore.estimatedMinutes || 15), 0),
          aiRecommendations: [
            "Start with the hardest task when you have the most energy!",
            "Take a 5-minute break between chores to stay fresh.",
            "Put on your favorite music to make it more fun! 🎵"
          ]
        }
      }
      
    } catch (error) {
      console.error('Schedule generation error:', error)
      throw new Error('Chorbit had trouble creating your schedule. Try again!')
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
        `DESCRIPTION:Generated by Chorbit AI\\n${task.tips || 'You\'ve got this!'}`,
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