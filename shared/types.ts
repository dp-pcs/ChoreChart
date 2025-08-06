// Shared types for ChoreChart Web and Mobile

export interface User {
  id: string
  email: string
  name: string
  role: 'PARENT' | 'CHILD'
  familyId: string
  createdAt: string
  updatedAt: string
  familyMemberships?: FamilyMembership[]
}

export interface FamilyMembership {
  id: string
  userId: string
  familyId: string
  role: 'PARENT' | 'CHILD'
  isActive: boolean
  isPrimary: boolean
  canInvite: boolean
  canManage: boolean
  permissions?: any
  createdAt: string
  updatedAt: string
  family?: Family
}

export interface Family {
  id: string
  name: string
  weeklyAllowance: number
  autoApproveChores: boolean
  weekCloseDay: number
  emailNotifications: boolean
  allowMultipleParents: boolean
  shareReports: boolean
  crossFamilyApproval: boolean
  createdAt: string
  updatedAt: string
  familyMemberships?: FamilyMembership[]
}

export interface Chore {
  id: string
  familyId: string
  title: string
  description?: string
  type: 'DAILY' | 'WEEKLY' | 'ONE_TIME' | 'CUSTOM'
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'AS_NEEDED'
  isRequired: boolean
  reward: number
  scheduledDays: number[]
  scheduledTime?: string
  estimatedMinutes?: number
  createdAt: string
  updatedAt: string
}

export interface ChoreAssignment {
  id: string
  familyId: string
  userId: string
  choreId: string
  weekStart: string
  createdAt: string
}

export interface ChoreSubmission {
  id: string
  assignmentId: string
  userId: string
  submittedAt: string
  completedAt: string
  notes?: string
  imageUrl?: string
  status: 'PENDING' | 'APPROVED' | 'DENIED' | 'AUTO_APPROVED'
  score?: number // Quality score (-100 to 150, allows penalties and bonuses)
  partialReward?: number // Reward amount based on score (can be negative for penalties)
  pointsAwarded?: number // Points awarded based on score (can be negative for penalties)
}

export interface ChoreApproval {
  id: string
  submissionId: string
  approvedBy: string
  approvedAt: string
  approved: boolean
  feedback?: string
  score?: number // Quality score (-100 to 150, allows penalties and bonuses)
  partialReward?: number // Reward amount based on score (can be negative for penalties)
  originalReward?: number // Original full reward amount
  pointsAwarded?: number // Points awarded based on score (can be negative for penalties)
  originalPoints?: number // Original full points amount
}

export interface Message {
  id: string
  familyId: string
  fromId: string
  toId?: string
  content: string
  type: 'CHAT' | 'SYSTEM' | 'REMINDER' | 'REWARD_NOTIFICATION'
  createdAt: string
  readAt?: string
}

export interface Reward {
  id: string
  userId: string
  title: string
  description?: string
  amount: number
  type: 'MONEY' | 'PRIVILEGE' | 'ITEM' | 'EXPERIENCE'
  awardedAt: string
  awardedBy: string
}

export interface WeeklyReport {
  id: string
  familyId: string
  userId: string
  weekStart: string
  weekEnd: string
  generatedAt: string
  totalChores: number
  completedChores: number
  approvedChores: number
  deniedChores: number
  totalEarnings: number
  potentialEarnings: number
  aiInsights?: any
  recommendations?: string
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Dashboard data types
export interface DashboardStats {
  totalChores: number
  completedChores: number
  pendingApprovals: number
  weeklyEarnings: number
  potentialEarnings: number
  completionRate: number
}

export interface ChildDashboardData {
  stats: DashboardStats
  todaysChores: Chore[]
  upcomingChores: Chore[]
  recentSubmissions: ChoreSubmission[]
  messages: Message[]
  weeklyProgress: {
    week: string
    completed: number
    total: number
    earnings: number
  }[]
  activeFamilyId?: string
  availableFamilies?: FamilyMembership[]
}

export interface ParentDashboardData {
  familyStats: {
    totalChildren: number
    totalChores: number
    pendingApprovals: number
    weeklySpending: number
  }
  childrenProgress: Array<{
    child: User
    stats: DashboardStats
    recentActivity: ChoreSubmission[]
  }>
  pendingApprovals: ChoreSubmission[]
  weeklyReports: WeeklyReport[]
  activeFamilyId?: string
  availableFamilies?: FamilyMembership[]
  crossFamilyApprovals?: ChoreSubmission[]
}

// Form types
export interface CreateChoreForm {
  title: string
  description?: string
  type: Chore['type']
  frequency: Chore['frequency']
  isRequired: boolean
  reward: number
  scheduledDays: number[]
  scheduledTime?: string
  estimatedMinutes?: number
  assignedTo: string[]
}

export interface SubmitChoreForm {
  assignmentId: string
  completedAt: Date
  notes?: string
  imageUrl?: string
}

export interface ScoreChoreForm {
  submissionId: string
  score: number // 0-100 quality score
  feedback?: string
  partialReward?: number // Calculated based on score
}

export interface CreateRewardForm {
  userId: string
  title: string
  description?: string
  amount: number
  type: Reward['type']
}

// Auth types
export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'PARENT' | 'CHILD'
  familyId: string
  family: Family
  familyMemberships?: FamilyMembership[]
  activeFamilyId?: string
}

export interface LoginCredentials {
  email: string
  password: string
  role: 'PARENT' | 'CHILD'
}

export interface SignupCredentials extends LoginCredentials {
  name: string
  familyName: string
}

// NEW: Family management forms
export interface InviteToFamilyForm {
  email: string
  role: 'PARENT' | 'CHILD'
  familyId: string
  canInvite?: boolean
  canManage?: boolean
}

export interface JoinFamilyForm {
  inviteCode: string
  role: 'PARENT' | 'CHILD'
}

export interface FamilySwitchForm {
  familyId: string
}

// NEW: Multi-family utility types
export interface FamilyContext {
  currentFamily: Family
  currentMembership: FamilyMembership
  allFamilies: FamilyMembership[]
  canSwitchFamily: boolean
  switchFamily: (familyId: string) => Promise<void>
}

export interface MultiFamilyUser extends User {
  activeFamilyId: string
  activeMembership: FamilyMembership
  allMemberships: FamilyMembership[]
} 