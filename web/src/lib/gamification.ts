// Gamification & Streak System for ChoreChart
import { prisma } from './prisma'

export interface StreakData {
  currentLoginStreak: number
  longestLoginStreak: number
  currentCheckInStreak: number
  longestCheckInStreak: number
  lastLoginDate: Date | null
  lastCheckInDate: Date | null
  totalPoints: number
  level: number
  experiencePoints: number
  streakFreezes: number
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  type: 'STREAK' | 'MILESTONE' | 'BEHAVIOR' | 'COMPLETION' | 'SPECIAL'
  category: 'LOGIN' | 'CHECK_IN' | 'CHORES' | 'CONSISTENCY' | 'IMPROVEMENT' | 'SOCIAL' | 'LEARNING'
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'LEGENDARY'
  points: number
  requirements: any
  rewardType: 'MONEY' | 'PRIVILEGE' | 'ITEM' | 'EXPERIENCE' | 'POINTS' | 'BADGE'
  rewardAmount: number
  rewardDescription?: string
  progress?: number
  isCompleted?: boolean
  unlockedAt?: Date
}

export interface StreakMilestone {
  days: number
  title: string
  reward: string
  points: number
  icon: string
}

// Duolingo-style streak milestones
export const STREAK_MILESTONES: StreakMilestone[] = [
  { days: 3, title: "Getting Started", reward: "$2 bonus", points: 50, icon: "🔥" },
  { days: 7, title: "Week Warrior", reward: "$5 bonus", points: 100, icon: "⚡" },
  { days: 14, title: "Two Week Champion", reward: "$10 bonus + Movie Night", points: 200, icon: "🏆" },
  { days: 30, title: "Monthly Master", reward: "$20 bonus + Special Privilege", points: 500, icon: "💎" },
  { days: 50, title: "Consistency King", reward: "$30 bonus + Friend Sleepover", points: 750, icon: "👑" },
  { days: 100, title: "Streak Legend", reward: "$50 bonus + Family Day Out", points: 1000, icon: "🌟" },
  { days: 365, title: "Year Champion", reward: "$100 bonus + Big Reward Choice", points: 2000, icon: "🎉" }
]

export class GamificationSystem {
  
  // Track login streak
  async updateLoginStreak(userId: string): Promise<StreakData> {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new Error('User not found')

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const lastLogin = user.lastLoginDate ? new Date(user.lastLoginDate) : null
    lastLogin?.setHours(0, 0, 0, 0)

    let currentStreak = user.currentLoginStreak
    
    if (lastLogin) {
      const daysDiff = Math.floor((today.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysDiff === 1) {
        // Consecutive day - increment streak
        currentStreak += 1
      } else if (daysDiff > 1) {
        // Streak broken - reset to 1
        currentStreak = 1
      }
      // daysDiff === 0 means same day, keep current streak
    } else {
      // First login
      currentStreak = 1
    }

    const longestStreak = Math.max(user.longestLoginStreak, currentStreak)
    
    // Calculate level and XP
    const newXP = user.experiencePoints + 10 // 10 XP per login
    const newLevel = Math.floor(newXP / 100) + 1 // Level up every 100 XP

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        currentLoginStreak: currentStreak,
        longestLoginStreak: longestStreak,
        lastLoginDate: today,
        experiencePoints: newXP,
        level: newLevel,
        totalPoints: user.totalPoints + 10
      }
    })

    // Check for streak achievements
    await this.checkStreakAchievements(userId, 'LOGIN', currentStreak)

    return {
      currentLoginStreak: updatedUser.currentLoginStreak,
      longestLoginStreak: updatedUser.longestLoginStreak,
      currentCheckInStreak: updatedUser.currentCheckInStreak,
      longestCheckInStreak: updatedUser.longestCheckInStreak,
      lastLoginDate: updatedUser.lastLoginDate,
      lastCheckInDate: updatedUser.lastCheckInDate,
      totalPoints: updatedUser.totalPoints,
      level: updatedUser.level,
      experiencePoints: updatedUser.experiencePoints,
      streakFreezes: updatedUser.streakFreezes
    }
  }

  // Track daily check-in streak
  async updateCheckInStreak(userId: string): Promise<StreakData> {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new Error('User not found')

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const lastCheckIn = user.lastCheckInDate ? new Date(user.lastCheckInDate) : null
    lastCheckIn?.setHours(0, 0, 0, 0)

    let currentStreak = user.currentCheckInStreak
    
    if (lastCheckIn) {
      const daysDiff = Math.floor((today.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysDiff === 1) {
        currentStreak += 1
      } else if (daysDiff > 1) {
        currentStreak = 1
      }
    } else {
      currentStreak = 1
    }

    const longestStreak = Math.max(user.longestCheckInStreak, currentStreak)
    
    // More XP for check-ins (they're more valuable)
    const newXP = user.experiencePoints + 25
    const newLevel = Math.floor(newXP / 100) + 1

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        currentCheckInStreak: currentStreak,
        longestCheckInStreak: longestStreak,
        lastCheckInDate: today,
        experiencePoints: newXP,
        level: newLevel,
        totalPoints: user.totalPoints + 25
      }
    })

    // Check for check-in achievements
    await this.checkStreakAchievements(userId, 'CHECK_IN', currentStreak)

    return {
      currentLoginStreak: updatedUser.currentLoginStreak,
      longestLoginStreak: updatedUser.longestLoginStreak,
      currentCheckInStreak: updatedUser.currentCheckInStreak,
      longestCheckInStreak: updatedUser.longestCheckInStreak,
      lastLoginDate: updatedUser.lastLoginDate,
      lastCheckInDate: updatedUser.lastCheckInDate,
      totalPoints: updatedUser.totalPoints,
      level: updatedUser.level,
      experiencePoints: updatedUser.experiencePoints,
      streakFreezes: updatedUser.streakFreezes
    }
  }

  // Use streak freeze (like Duolingo)
  async useStreakFreeze(userId: string, streakType: 'LOGIN' | 'CHECK_IN'): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.streakFreezes <= 0) return false

    const today = new Date()
    const lastUse = user.lastStreakFreezeUsed ? new Date(user.lastStreakFreezeUsed) : null
    
    // Can only use once per day
    if (lastUse && lastUse.toDateString() === today.toDateString()) {
      return false
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        streakFreezes: user.streakFreezes - 1,
        lastStreakFreezeUsed: today,
        // Extend the streak by setting last activity to yesterday
        ...(streakType === 'LOGIN' ? {
          lastLoginDate: new Date(today.getTime() - 24 * 60 * 60 * 1000)
        } : {
          lastCheckInDate: new Date(today.getTime() - 24 * 60 * 60 * 1000)
        })
      }
    })

    return true
  }

  // Check and award streak achievements
  private async checkStreakAchievements(userId: string, category: 'LOGIN' | 'CHECK_IN', streakCount: number): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return

    // Check if this milestone warrants an achievement
    const milestones = STREAK_MILESTONES.filter(m => m.days === streakCount)
    
    for (const milestone of milestones) {
      // Check if user already has this achievement
      const existingAchievement = await prisma.userAchievement.findFirst({
        where: {
          userId,
          achievement: {
            title: `${milestone.title} - ${category}`,
            type: 'STREAK'
          }
        }
      })

      if (!existingAchievement) {
        // Create achievement if it doesn't exist for this family
        let achievement = await prisma.achievement.findFirst({
          where: {
            familyId: user.familyId,
            title: `${milestone.title} - ${category}`,
            type: 'STREAK'
          }
        })

        if (!achievement) {
          achievement = await prisma.achievement.create({
            data: {
              familyId: user.familyId,
              title: `${milestone.title} - ${category}`,
              description: `Maintain a ${milestone.days}-day ${category.toLowerCase()} streak!`,
              icon: milestone.icon,
              type: 'STREAK',
              category: category,
              difficulty: milestone.days <= 7 ? 'EASY' : milestone.days <= 30 ? 'MEDIUM' : milestone.days <= 100 ? 'HARD' : 'LEGENDARY',
              points: milestone.points,
              requirements: { streakDays: milestone.days, streakType: category },
              rewardType: milestone.reward.includes('$') ? 'MONEY' : 'PRIVILEGE',
              rewardAmount: this.extractAmount(milestone.reward),
              rewardDescription: milestone.reward
            }
          })
        }

        // Award achievement to user
        await prisma.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id,
            progress: 1.0,
            isCompleted: true
          }
        })

        // Add bonus points
        await prisma.user.update({
          where: { id: userId },
          data: {
            totalPoints: user.totalPoints + milestone.points,
            experiencePoints: user.experiencePoints + milestone.points
          }
        })

        // Create notification message
        await this.createAchievementNotification(userId, achievement.title, milestone.reward)
      }
    }
  }

  private extractAmount(reward: string): number {
    const match = reward.match(/\$(\d+)/)
    return match ? parseInt(match[1]) : 0
  }

  private async createAchievementNotification(userId: string, title: string, reward: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return

    await prisma.message.create({
      data: {
        familyId: user.familyId,
        fromId: userId, // System message
        content: `🎉 Achievement Unlocked: ${title}! Reward: ${reward}`,
        type: 'REWARD_NOTIFICATION'
      }
    })
  }

  // Get user's gamification stats
  async getGamificationStats(userId: string): Promise<{
    streaks: StreakData
    achievements: Achievement[]
    nextMilestones: StreakMilestone[]
    streakHistory: any[]
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        achievements: {
          include: { achievement: true },
          orderBy: { unlockedAt: 'desc' }
        }
      }
    })

    if (!user) throw new Error('User not found')

    const streakData: StreakData = {
      currentLoginStreak: user.currentLoginStreak,
      longestLoginStreak: user.longestLoginStreak,
      currentCheckInStreak: user.currentCheckInStreak,
      longestCheckInStreak: user.longestCheckInStreak,
      lastLoginDate: user.lastLoginDate,
      lastCheckInDate: user.lastCheckInDate,
      totalPoints: user.totalPoints,
      level: user.level,
      experiencePoints: user.experiencePoints,
      streakFreezes: user.streakFreezes
    }

    const achievements: Achievement[] = user.achievements.map(ua => ({
      id: ua.achievement.id,
      title: ua.achievement.title,
      description: ua.achievement.description,
      icon: ua.achievement.icon,
      type: ua.achievement.type as any,
      category: ua.achievement.category as any,
      difficulty: ua.achievement.difficulty as any,
      points: ua.achievement.points,
      requirements: ua.achievement.requirements,
      rewardType: ua.achievement.rewardType as any,
      rewardAmount: ua.achievement.rewardAmount,
      rewardDescription: ua.achievement.rewardDescription || undefined,
      progress: ua.progress,
      isCompleted: ua.isCompleted,
      unlockedAt: ua.unlockedAt
    }))

    // Find next milestones
    const nextLoginMilestone = STREAK_MILESTONES.find(m => m.days > user.currentLoginStreak)
    const nextCheckInMilestone = STREAK_MILESTONES.find(m => m.days > user.currentCheckInStreak)
    
    const nextMilestones = [nextLoginMilestone, nextCheckInMilestone].filter(Boolean) as StreakMilestone[]

    return {
      streaks: streakData,
      achievements,
      nextMilestones,
      streakHistory: [] // TODO: Implement streak history tracking
    }
  }

  // Award streak freeze as reward
  async awardStreakFreeze(userId: string, count: number = 1): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        streakFreezes: { increment: count }
      }
    })
  }

  // Check if user needs streak freeze recommendation
  async checkStreakBreakRisk(userId: string): Promise<{
    loginRisk: boolean
    checkInRisk: boolean
    canUseFreeze: boolean
  }> {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return { loginRisk: false, checkInRisk: false, canUseFreeze: false }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const lastLogin = user.lastLoginDate ? new Date(user.lastLoginDate) : null
    const lastCheckIn = user.lastCheckInDate ? new Date(user.lastCheckInDate) : null

    const loginRisk = lastLogin ? 
      Math.floor((today.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24)) >= 1 : false
    
    const checkInRisk = lastCheckIn ? 
      Math.floor((today.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60 * 24)) >= 1 : false

    return {
      loginRisk,
      checkInRisk,
      canUseFreeze: user.streakFreezes > 0
    }
  }
}

export const gamificationSystem = new GamificationSystem() 