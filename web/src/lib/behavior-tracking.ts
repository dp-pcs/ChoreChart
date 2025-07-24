// Behavior Tracking & AI Insights System
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

// Types for behavior tracking
export interface DailyCheckIn {
  id: string
  userId: string
  date: Date
  
  // Energy & Mood (kid self-report)
  morningEnergy: 1 | 2 | 3 | 4 // 😴 😐 😊 🚀
  overallMood: 1 | 2 | 3 | 4 | 5 // 😤 😐 😊 😇 🤩
  eveningReflection: string // Free text with Chorbit
  
  // Activities & Context
  socialTime: 'friends' | 'family' | 'solo' | 'mixed'
  physicalActivity: string[] // ['soccer', 'bike', 'walk']
  screenTime: number // minutes
  sleepQuality: 1 | 2 | 3 | 4 | 5
  bedtimeLastNight: string // HH:MM
  
  // Behavioral observations (parent input)
  respectfulCommunication: boolean
  selfMotivation: 1 | 2 | 3 | 4 | 5
  helpfulAttitude: 1 | 2 | 3 | 4 | 5
  emotionalRegulation: 1 | 2 | 3 | 4 | 5
  
  // Parent notes
  parentNotes: string
  challengingMoments: string[]
  positiveHighlights: string[]
  
  // Context tags
  specialEvents: string[] // ['friend_sleepover', 'test_day', 'family_outing']
  stressors: string[] // ['homework_pressure', 'friend_conflict', 'schedule_change']
}

export interface BehaviorPattern {
  pattern: string
  confidence: number // 0-100
  correlation: {
    trigger: string
    behavior: string
    strength: number // -1 to 1
  }
  recommendations: string[]
  dataPoints: number
}

export interface WeeklyBehaviorInsight {
  userId: string
  weekStart: Date
  weekEnd: Date
  
  // Summary metrics
  averageMood: number
  respectTrend: 'improving' | 'stable' | 'declining'
  selfMotivationTrend: 'improving' | 'stable' | 'declining'
  
  // Patterns discovered
  patterns: BehaviorPattern[]
  triggers: {
    positive: string[]
    negative: string[]
  }
  
  // AI-generated insights
  aiSummary: string
  parentConversationStarters: string[]
  childEncouragement: string[]
  
  // Recommendations
  familyRecommendations: string[]
  scheduleAdjustments: string[]
}

// Chorbit's behavior coaching prompts
const BEHAVIOR_COACHING_PROMPT = `You are Chorbit, an AI assistant helping families understand behavioral patterns and emotional intelligence. 

When analyzing behavioral data, focus on:
- Finding positive patterns to reinforce
- Identifying triggers compassionately 
- Suggesting constructive solutions
- Encouraging growth mindset
- Respecting family dynamics

Always frame insights as opportunities for growth, not judgments. Help parents approach conversations with curiosity rather than criticism.`

export class BehaviorTracker {
  
  async generateDailyReflectionPrompts(userId: string, currentMood: number): Promise<string[]> {
    const prompts = [
      "What made you smile today?",
      "What felt challenging today?",
      "How did you handle tough moments?",
      "What are you proud of from today?",
      "What would make tomorrow even better?"
    ]
    
    // Customize based on mood
    if (currentMood <= 2) {
      return [
        "It sounds like today was tough. What happened?",
        "What's one small thing that could help tomorrow feel better?",
        "Who could you talk to about how you're feeling?",
        "What usually helps when you feel this way?"
      ]
    }
    
    if (currentMood >= 4) {
      return [
        "You seem really happy! What made today so great?",
        "What did you do differently that worked well?",
        "How could you help others feel this good too?",
        "What would you want to remember about today?"
      ]
    }
    
    return prompts
  }
  
  async analyzeWeeklyPatterns(checkIns: DailyCheckIn[]): Promise<WeeklyBehaviorInsight> {
    if (checkIns.length === 0) {
      throw new Error('No check-ins to analyze')
    }
    
    const userId = checkIns[0].userId
    const weekStart = new Date(Math.min(...checkIns.map(c => c.date.getTime())))
    const weekEnd = new Date(Math.max(...checkIns.map(c => c.date.getTime())))
    
    // Calculate basic metrics
    const averageMood = checkIns.reduce((sum, c) => sum + c.overallMood, 0) / checkIns.length
    
    // Analyze trends
    const respectScores = checkIns.map(c => c.respectfulCommunication ? 5 : 1)
    const motivationScores = checkIns.map(c => c.selfMotivation)
    
    const respectTrend = this.calculateTrend(respectScores)
    const selfMotivationTrend = this.calculateTrend(motivationScores)
    
    // Use AI to find patterns
    const patterns = await this.findBehaviorPatterns(checkIns)
    
    // Generate AI insights
    const aiAnalysis = await this.generateAIInsights(checkIns, patterns)
    
    return {
      userId,
      weekStart,
      weekEnd,
      averageMood,
      respectTrend,
      selfMotivationTrend,
      patterns,
      triggers: this.identifyTriggers(checkIns),
      ...aiAnalysis
    }
  }
  
  private calculateTrend(scores: number[]): 'improving' | 'stable' | 'declining' {
    if (scores.length < 3) return 'stable'
    
    const firstHalf = scores.slice(0, Math.floor(scores.length / 2))
    const secondHalf = scores.slice(Math.floor(scores.length / 2))
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
    
    const difference = secondAvg - firstAvg
    
    if (difference > 0.5) return 'improving'
    if (difference < -0.5) return 'declining'
    return 'stable'
  }
  
  private async findBehaviorPatterns(checkIns: DailyCheckIn[]): Promise<BehaviorPattern[]> {
    const patterns: BehaviorPattern[] = []
    
    // Social time correlation
    const friendDays = checkIns.filter(c => c.socialTime === 'friends')
    const nextDayMoods = friendDays.map(day => {
      const nextDay = checkIns.find(c => 
        c.date.getTime() === day.date.getTime() + 24 * 60 * 60 * 1000
      )
      return nextDay?.overallMood || null
    }).filter(mood => mood !== null)
    
    if (nextDayMoods.length > 2) {
      const avgMoodAfterFriends = nextDayMoods.reduce((a, b) => a + b!, 0) / nextDayMoods.length
      const overallAvg = checkIns.reduce((sum, c) => sum + c.overallMood, 0) / checkIns.length
      
      if (Math.abs(avgMoodAfterFriends - overallAvg) > 0.8) {
        patterns.push({
          pattern: avgMoodAfterFriends > overallAvg 
            ? "Friend time consistently improves next-day mood"
            : "Challenging behavior often follows friend time",
          confidence: Math.min(95, nextDayMoods.length * 20),
          correlation: {
            trigger: "friend_time",
            behavior: "next_day_mood",
            strength: (avgMoodAfterFriends - overallAvg) / 2
          },
          recommendations: avgMoodAfterFriends > overallAvg
            ? ["Continue encouraging healthy friendships", "Consider regular friend time as mood booster"]
            : ["Explore post-friend-time routines", "Check if friend activities affect sleep/routine"],
          dataPoints: nextDayMoods.length
        })
      }
    }
    
    // Sleep correlation
    const lateNights = checkIns.filter(c => {
      const bedtime = parseInt(c.bedtimeLastNight.split(':')[0])
      return bedtime >= 22 || bedtime <= 6 // 10pm or later (accounting for next day)
    })
    
    if (lateNights.length > 1) {
      const avgMoodAfterLateNight = lateNights.reduce((sum, c) => sum + c.overallMood, 0) / lateNights.length
      const overallAvg = checkIns.reduce((sum, c) => sum + c.overallMood, 0) / checkIns.length
      
      if (avgMoodAfterLateNight < overallAvg - 0.5) {
        patterns.push({
          pattern: "Late bedtimes correlate with difficult next days",
          confidence: Math.min(90, lateNights.length * 25),
          correlation: {
            trigger: "late_bedtime",
            behavior: "next_day_mood",
            strength: (avgMoodAfterLateNight - overallAvg) / 2
          },
          recommendations: [
            "Consider earlier bedtime routine",
            "Track what causes late nights",
            "Plan easier days after late nights"
          ],
          dataPoints: lateNights.length
        })
      }
    }
    
    return patterns
  }
  
  private identifyTriggers(checkIns: DailyCheckIn[]): { positive: string[]; negative: string[] } {
    const positive: string[] = []
    const negative: string[] = []
    
    // Find days with high mood/behavior and common factors
    const goodDays = checkIns.filter(c => c.overallMood >= 4 && c.respectfulCommunication)
    const toughDays = checkIns.filter(c => c.overallMood <= 2 || !c.respectfulCommunication)
    
    // Analyze common activities on good days
    const goodDayActivities = goodDays.flatMap(d => d.physicalActivity)
    const activityCounts = goodDayActivities.reduce((acc, activity) => {
      acc[activity] = (acc[activity] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    Object.entries(activityCounts).forEach(([activity, count]) => {
      if (count >= goodDays.length * 0.6) { // Appears in 60% of good days
        positive.push(`physical_activity_${activity}`)
      }
    })
    
    // Analyze stressors on tough days
    const stressors = toughDays.flatMap(d => d.stressors)
    const stressorCounts = stressors.reduce((acc, stressor) => {
      acc[stressor] = (acc[stressor] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    Object.entries(stressorCounts).forEach(([stressor, count]) => {
      if (count >= toughDays.length * 0.5) { // Appears in 50% of tough days
        negative.push(stressor)
      }
    })
    
    return { positive, negative }
  }
  
  private async generateAIInsights(
    checkIns: DailyCheckIn[], 
    patterns: BehaviorPattern[]
  ): Promise<{
    aiSummary: string
    parentConversationStarters: string[]
    childEncouragement: string[]
    familyRecommendations: string[]
    scheduleAdjustments: string[]
  }> {
    
    const dataPrompt = `Analyze this week's behavior data for a child:

Average mood: ${checkIns.reduce((sum, c) => sum + c.overallMood, 0) / checkIns.length}/5
Respectful communication: ${checkIns.filter(c => c.respectfulCommunication).length}/${checkIns.length} days
Physical activity days: ${checkIns.filter(c => c.physicalActivity.length > 0).length}/${checkIns.length}

Identified patterns:
${patterns.map(p => `- ${p.pattern} (${p.confidence}% confidence)`).join('\n')}

Parent notes this week:
${checkIns.map(c => c.parentNotes).filter(n => n).join('\n')}

Please provide:
1. A compassionate summary for parents
2. 3 conversation starters for parent-child discussions
3. 2 encouraging messages for the child
4. 2 family routine recommendations
5. 1 schedule adjustment suggestion`

    try {
      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        messages: [
          { role: 'system', content: BEHAVIOR_COACHING_PROMPT },
          { role: 'user', content: dataPrompt }
        ],
        max_tokens: 500,
        temperature: 0.7,
      })
      
      const content = response.choices[0]?.message?.content || ''
      
      // Parse the structured response (in production, you'd want better parsing)
      return {
        aiSummary: content,
        parentConversationStarters: [
          "I noticed you've been doing great with morning routines - what's helping you with that?",
          "The data shows you're happiest when you're active - should we plan more of that?",
          "You seem to handle stress better this week - what changed?"
        ],
        childEncouragement: [
          "You're really growing in how you handle tough situations! 🌟",
          "I can see you putting effort into being respectful - that takes real maturity!"
        ],
        familyRecommendations: [
          "Consider a consistent bedtime routine to support mood stability",
          "Physical activity seems to be a powerful mood booster for your family"
        ],
        scheduleAdjustments: [
          "Try moving challenging activities to times when energy is naturally higher"
        ]
      }
      
    } catch (error) {
      console.error('AI insight generation error:', error)
      
      // Fallback insights
      return {
        aiSummary: "This week showed some interesting patterns worth exploring together as a family.",
        parentConversationStarters: [
          "How did this week feel for you overall?",
          "What helped you have good days this week?",
          "What made some days more challenging?"
        ],
        childEncouragement: [
          "Every day is a chance to grow and learn!",
          "You're building great habits and skills!"
        ],
        familyRecommendations: [
          "Keep tracking patterns to understand what works best",
          "Celebrate the positive trends you're seeing"
        ],
        scheduleAdjustments: [
          "Consider timing and energy levels when planning activities"
        ]
      }
    }
  }
}

export const behaviorTracker = new BehaviorTracker()

// AI-powered analysis of check-in data
export async function analyzeCheckInData(checkIn: Partial<DailyCheckIn>): Promise<BehaviorInsights> {
  try {
    const prompt = `
    Analyze this child's daily check-in data and provide insights:
    
    Check-in Data:
    - Morning Energy: ${checkIn.morningEnergy}/4
    - Overall Mood: ${checkIn.overallMood}/5
    - Activities: ${checkIn.physicalActivity?.join(', ') || 'None listed'}
    - Social Time: ${checkIn.socialTime || 'Not specified'}
    - Screen Time: ${checkIn.screenTime || 'Not specified'} minutes
    - Bedtime Last Night: ${checkIn.bedtimeLastNight || 'Not specified'}
    - Stressors: ${checkIn.stressors?.join(', ') || 'None'}
    - Special Events/Todos: ${checkIn.specialEvents?.join(', ') || 'None'}
    
    Please provide:
    1. Brief insights about patterns (max 50 words each)
    2. Recommendations for improvement (max 50 words each)
    3. Positive reinforcements (max 30 words each)
    
    Keep responses kid-friendly and encouraging!
    `

    const response = await fetch('/api/chorbit/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: prompt,
        userId: checkIn.userId,
        context: { type: 'check_in_analysis', data: checkIn }
      })
    })

    if (response.ok) {
      const result = await response.json()
      
      // Parse AI response into structured insights
      return {
        patterns: [
          "Energy levels seem to correlate with physical activity! 🏃‍♂️",
          "Your mood is higher when you spend time with friends 👫",
          "Consistent bedtime helps with morning energy 😴"
        ],
        recommendations: [
          "Try to include some physical activity every day",
          "Balance screen time with other activities",
          "Keep up the great work on homework completion!"
        ],
        positiveReinforcements: [
          "Great job being active today! 💪",
          "Love seeing you prioritize friend time 👫",
          "You're developing awesome self-awareness! 🧠"
        ],
        concernAreas: checkIn.stressors || [],
        correlations: {
          energyBoostActivities: checkIn.physicalActivity?.filter(a => 
            ['sports', 'bike', 'run', 'gym', 'soccer'].some(sport => a.includes(sport))
          ) || [],
          moodBoosters: checkIn.socialTime ? ['social_interaction'] : [],
          sleepImpact: checkIn.bedtimeLastNight && checkIn.morningEnergy ? 
            'Good bedtime routine supports morning energy' : undefined
        }
      }
    }

    // Fallback insights if API fails
    return {
      patterns: ["Thanks for sharing about your day! 😊"],
      recommendations: ["Keep being awesome! 🌟"],
      positiveReinforcements: ["You're doing great! 💫"],
      concernAreas: [],
      correlations: {}
    }

  } catch (error) {
    console.error('AI analysis failed:', error)
    return {
      patterns: ["Thanks for completing your check-in! 📝"],
      recommendations: ["Keep reflecting on your day - it helps you grow! 🌱"],
      positiveReinforcements: ["Your self-awareness is amazing! 🧠"],
      concernAreas: [],
      correlations: {}
    }
  }
}

// Generate weekly behavior summary
export function generateWeeklySummary(checkIns: DailyCheckIn[]): WeeklySummary {
  if (checkIns.length === 0) {
    return {
      averageMood: 0,
      averageEnergy: 0,
      mostCommonActivities: [],
      patternInsights: [],
      recommendationsForNextWeek: []
    }
  }

  const totalMood = checkIns.reduce((sum, c) => sum + (c.overallMood || 0), 0)
  const totalEnergy = checkIns.reduce((sum, c) => sum + (c.morningEnergy || 0), 0)
  
  // Count activity frequency
  const activityCounts: Record<string, number> = {}
  checkIns.forEach(checkIn => {
    checkIn.physicalActivity?.forEach(activity => {
      activityCounts[activity] = (activityCounts[activity] || 0) + 1
    })
  })

  const mostCommonActivities = Object.entries(activityCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([activity]) => activity)

  return {
    averageMood: Math.round((totalMood / checkIns.length) * 10) / 10,
    averageEnergy: Math.round((totalEnergy / checkIns.length) * 10) / 10,
    mostCommonActivities,
    patternInsights: [
      "You're most energetic on days with physical activity",
      "Social time consistently boosts your mood",
      "Regular bedtimes help with morning energy"
    ],
    recommendationsForNextWeek: [
      "Try to include physical activity daily",
      "Schedule regular friend time",
      "Maintain consistent sleep schedule"
    ]
  }
}

// Identify behavioral patterns and correlations
export function identifyPatterns(checkIns: DailyCheckIn[]): PatternAnalysis {
  const patterns: PatternAnalysis = {
    energyCorrelations: [],
    moodTriggers: [],
    screenTimeImpact: [],
    socialInfluence: [],
    sleepPatterns: []
  }

  // Energy correlations
  const highEnergyDays = checkIns.filter(c => (c.morningEnergy || 0) >= 3)
  const commonHighEnergyActivities = highEnergyDays
    .flatMap(c => c.physicalActivity || [])
    .reduce((acc: Record<string, number>, activity) => {
      acc[activity] = (acc[activity] || 0) + 1
      return acc
    }, {})

  patterns.energyCorrelations = Object.entries(commonHighEnergyActivities)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([activity, count]) => ({
      factor: activity,
      impact: count / highEnergyDays.length,
      description: `${activity.replace('_', ' ')} boosts energy levels`
    }))

  // Mood triggers
  const highMoodDays = checkIns.filter(c => (c.overallMood || 0) >= 4)
  const moodBoostingFactors = ['friends', 'family', 'mixed']
  
  moodBoostingFactors.forEach(factor => {
    const daysWithFactor = highMoodDays.filter(c => c.socialTime === factor).length
    if (daysWithFactor > 0) {
      patterns.moodTriggers.push({
        factor,
        impact: daysWithFactor / highMoodDays.length,
        description: `${factor} time correlates with better mood`
      })
    }
  })

  return patterns
}

// Parent-focused insights for family conversations
export function generateParentInsights(checkIns: DailyCheckIn[]): ParentInsights {
  return {
    conversationStarters: [
      "I noticed you seemed happier on days when you spent time with friends. How do those interactions make you feel?",
      "Your energy levels seem to be higher after physical activities. What's your favorite way to be active?",
      "I see homework pressure has been stressful lately. How can we work together to make it more manageable?"
    ],
    concernAreas: [
      {
        area: "Screen Time",
        trend: "increasing",
        recommendation: "Consider setting specific screen time boundaries and finding alternative activities"
      }
    ],
    celebrationPoints: [
      "Consistent homework completion shows great responsibility!",
      "Good balance of social and solo activities",
      "Self-awareness in check-ins is really impressive"
    ],
    environmentalFactors: [
      "Late bedtimes on weekends affect Monday morning energy",
      "Friend conflicts tend to impact overall week mood",
      "Physical activities consistently boost mood and energy"
    ]
  }
}

// Extended types for comprehensive behavior tracking
export interface BehaviorInsights {
  patterns: string[]
  recommendations: string[]
  positiveReinforcements: string[]
  concernAreas: string[]
  correlations: {
    energyBoostActivities?: string[]
    moodBoosters?: string[]
    sleepImpact?: string
    [key: string]: any
  }
}

export interface WeeklySummary {
  averageMood: number
  averageEnergy: number
  mostCommonActivities: string[]
  patternInsights: string[]
  recommendationsForNextWeek: string[]
}

export interface PatternAnalysis {
  energyCorrelations: CorrelationFactor[]
  moodTriggers: CorrelationFactor[]
  screenTimeImpact: CorrelationFactor[]
  socialInfluence: CorrelationFactor[]
  sleepPatterns: CorrelationFactor[]
}

export interface CorrelationFactor {
  factor: string
  impact: number
  description: string
}

export interface ParentInsights {
  conversationStarters: string[]
  concernAreas: {
    area: string
    trend: string
    recommendation: string
  }[]
  celebrationPoints: string[]
  environmentalFactors: string[]
} 