import { 
  User, 
  Family, 
  Chore, 
  ChoreAssignment, 
  ChoreSubmission, 
  ChoreApproval, 
  Message, 
  Reward, 
  WeeklyReport,
  UserRole,
  ChoreType,
  ChoreFrequency,
  SubmissionStatus,
  MessageType,
  RewardType
} from '../generated/prisma'

// Re-export Prisma types
export type {
  User,
  Family,
  Chore,
  ChoreAssignment,
  ChoreSubmission,
  ChoreApproval,
  Message,
  Reward,
  WeeklyReport,
  UserRole,
  ChoreType,
  ChoreFrequency,
  SubmissionStatus,
  MessageType,
  RewardType
}

// Extended types with relations
export type UserWithFamily = User & {
  family: Family
}

export type ChoreWithAssignments = Chore & {
  assignments: (ChoreAssignment & {
    user: User
    submissions: ChoreSubmission[]
  })[]
}

export type ChoreSubmissionWithDetails = ChoreSubmission & {
  assignment: ChoreAssignment & {
    chore: Chore
    user: User
  }
  approval?: ChoreApproval & {
    approver: User
  }
}

export type WeeklyReportWithDetails = WeeklyReport & {
  user: User
  family: Family
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
  todaysChores: ChoreWithAssignments[]
  upcomingChores: ChoreWithAssignments[]
  recentSubmissions: ChoreSubmissionWithDetails[]
  messages: Message[]
  weeklyProgress: {
    week: string
    completed: number
    total: number
    earnings: number
  }[]
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
    recentActivity: ChoreSubmissionWithDetails[]
  }>
  pendingApprovals: ChoreSubmissionWithDetails[]
  weeklyReports: WeeklyReportWithDetails[]
}

// AI Insights types
export interface AIInsights {
  summary: string
  trends: {
    completionRate: number
    consistencyScore: number
    preferredChoreTypes: string[]
    peakPerformanceTimes: string[]
  }
  recommendations: string[]
  flags: {
    type: 'warning' | 'info' | 'success'
    message: string
  }[]
}

// Form types
export interface CreateChoreForm {
  title: string
  description?: string
  type: ChoreType
  frequency: ChoreFrequency
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

export interface CreateRewardForm {
  userId: string
  title: string
  description?: string
  amount: number
  type: RewardType
}

// Notification types
export interface NotificationSettings {
  emailNotifications: boolean
  pushNotifications: boolean
  choreReminders: boolean
  approvalNotifications: boolean
  weeklyReports: boolean
  reminderTimes: string[] // HH:MM format
}

// Week management types
export interface WeekData {
  weekStart: Date
  weekEnd: Date
  isClosed: boolean
  canEdit: boolean
  assignments: ChoreAssignment[]
  submissions: ChoreSubmissionWithDetails[]
}

// Message thread types
export interface MessageThread {
  participants: User[]
  messages: Message[]
  unreadCount: number
}

// Search and filter types
export interface ChoreFilters {
  type?: ChoreType[]
  frequency?: ChoreFrequency[]
  isRequired?: boolean
  assignedTo?: string[]
  status?: SubmissionStatus[]
  dateRange?: {
    start: Date
    end: Date
  }
}

export interface ReportFilters {
  userId?: string
  dateRange: {
    start: Date
    end: Date
  }
  includeAI?: boolean
}

// Enhanced learning system for Chorbit
export interface LearnedFact {
  value: any
  confidence: number // 0.0 to 1.0
  learnedAt: string // ISO timestamp
  lastValidated?: string // ISO timestamp
  source: 'conversation' | 'explicit' | 'observation' | 'parent_setup'
  context?: string // What conversation/situation led to this
  timesReferenced: number // How often Chorbit has used this fact
  validationsDue?: boolean // Flag for periodic validation
}

export interface Interest {
  name: string
  confidence: number // 0.0 to 1.0
  learnedAt: string
  lastValidated?: string
  category: 'sports' | 'hobby' | 'food' | 'entertainment' | 'school' | 'other'
  details?: { [key: string]: LearnedFact } // e.g., favorite team, favorite player
  needsValidation?: boolean
}

export interface EnhancedUserPreferences {
  // Core interests with validation tracking
  interests: Interest[]
  
  // Behavioral preferences
  motivationalStyle: 'encouraging' | 'competitive' | 'gentle' | 'funny'
  preferredGreeting: 'energetic' | 'calm' | 'sports' | 'fun'
  conversationStyle: 'brief' | 'detailed' | 'interactive'
  
  // Learning topics and goals
  learningTopics: string[]
  personalityTraits: string[]
  
  // Dynamic learned facts
  learnedFacts: { [key: string]: LearnedFact }
  
  // Sports teams with detailed tracking
  sportsTeams: {
    sport: string
    team: string
    league: string
    confidence: number
    learnedAt: string
    lastValidated?: string
  }[]
  
  // Validation tracking
  lastValidationDate?: string
  nextValidationDue?: string
  validationFrequency: number // days between validations (default: 60)
  
  // News/updates preferences
  wantsNewsUpdates: boolean
  newsCategories: string[]
} 