// Shared API layer for ChoreChart Web and Mobile

import {
  User,
  Chore,
  ChoreSubmission,
  ChoreAssignment,
  Message,
  Reward,
  WeeklyReport,
  ApiResponse,
  ChildDashboardData,
  ParentDashboardData,
  CreateChoreForm,
  SubmitChoreForm,
  CreateRewardForm,
  PaymentSource,
  CreatePaymentSourceForm,
  UpdatePaymentSourceForm,
  LoginCredentials,
  SignupCredentials,
  AuthUser
} from './types'

// Configuration
export const API_CONFIG = {
  WEB_BASE_URL: 'http://localhost:3000/api',
  MOBILE_BASE_URL: 'http://localhost:3000/api',
}

// Get appropriate base URL based on environment
export const getBaseUrl = () => {
  // Check if we're in a React Native environment
  if (typeof navigator !== 'undefined' && (navigator as any).product === 'ReactNative') {
    return API_CONFIG.MOBILE_BASE_URL
  }
  return API_CONFIG.WEB_BASE_URL
}

// HTTP client configuration
const createApiClient = () => {
  const baseURL = getBaseUrl()
  
  return {
    async request<T>(
      endpoint: string,
      options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
      try {
        const url = `${baseURL}${endpoint}`
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          ...options,
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        return data
      } catch (error) {
        console.error('API request failed:', error)
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      }
    },

    async get<T>(endpoint: string, token?: string): Promise<ApiResponse<T>> {
      return this.request<T>(endpoint, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
    },

    async post<T>(endpoint: string, data?: any, token?: string): Promise<ApiResponse<T>> {
      return this.request<T>(endpoint, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: data ? JSON.stringify(data) : undefined,
      })
    },

    async put<T>(endpoint: string, data?: any, token?: string): Promise<ApiResponse<T>> {
      return this.request<T>(endpoint, {
        method: 'PUT',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: data ? JSON.stringify(data) : undefined,
      })
    },

    async delete<T>(endpoint: string, token?: string): Promise<ApiResponse<T>> {
      return this.request<T>(endpoint, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
    }
  }
}

export const api = createApiClient()

// Authentication API
export const authApi = {
  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: AuthUser; token: string }>> {
    return api.post('/auth/login', credentials)
  },

  async signup(credentials: SignupCredentials): Promise<ApiResponse<{ user: AuthUser; token: string }>> {
    return api.post('/auth/signup', credentials)
  },

  async logout(token: string): Promise<ApiResponse<void>> {
    return api.post('/auth/logout', {}, token)
  },

  async me(token: string): Promise<ApiResponse<AuthUser>> {
    return api.get('/auth/me', token)
  }
}

// Dashboard API
export const dashboardApi = {
  async getChildDashboard(token: string): Promise<ApiResponse<ChildDashboardData>> {
    return api.get('/dashboard/child', token)
  },

  async getParentDashboard(token: string): Promise<ApiResponse<ParentDashboardData>> {
    return api.get('/dashboard/parent', token)
  }
}

// Chores API
export const choresApi = {
  async getChores(token: string): Promise<ApiResponse<Chore[]>> {
    return api.get('/chores', token)
  },

  async getChore(id: string, token: string): Promise<ApiResponse<Chore>> {
    return api.get(`/chores/${id}`, token)
  },

  async createChore(chore: CreateChoreForm, token: string): Promise<ApiResponse<Chore>> {
    return api.post('/chores', chore, token)
  },

  async updateChore(id: string, chore: Partial<CreateChoreForm>, token: string): Promise<ApiResponse<Chore>> {
    return api.put(`/chores/${id}`, chore, token)
  },

  async deleteChore(id: string, token: string): Promise<ApiResponse<void>> {
    return api.delete(`/chores/${id}`, token)
  },

  async getAssignments(token: string): Promise<ApiResponse<ChoreAssignment[]>> {
    return api.get('/chores/assignments', token)
  }
}

// Submissions API
export const submissionsApi = {
  async submitChore(submission: SubmitChoreForm, token: string): Promise<ApiResponse<ChoreSubmission>> {
    return api.post('/submissions', submission, token)
  },

  async getSubmissions(token: string): Promise<ApiResponse<ChoreSubmission[]>> {
    return api.get('/submissions', token)
  },

  async approveSubmission(id: string, approved: boolean, feedback?: string, token?: string): Promise<ApiResponse<ChoreSubmission>> {
    return api.put(`/submissions/${id}/approve`, { approved, feedback }, token)
  },

  async getPendingApprovals(token: string): Promise<ApiResponse<ChoreSubmission[]>> {
    return api.get('/submissions/pending', token)
  }
}

// Messages API
export const messagesApi = {
  async getMessages(token: string): Promise<ApiResponse<Message[]>> {
    return api.get('/messages', token)
  },

  async sendMessage(content: string, toId?: string, token?: string): Promise<ApiResponse<Message>> {
    return api.post('/messages', { content, toId }, token)
  },

  async markAsRead(id: string, token: string): Promise<ApiResponse<void>> {
    return api.put(`/messages/${id}/read`, {}, token)
  }
}

// Rewards API
export const rewardsApi = {
  async getRewards(token: string): Promise<ApiResponse<Reward[]>> {
    return api.get('/rewards', token)
  },

  async createReward(reward: CreateRewardForm, token: string): Promise<ApiResponse<Reward>> {
    return api.post('/rewards', reward, token)
  }
}

// Payment Sources API
export const paymentSourcesApi = {
  async getPaymentSources(token: string): Promise<ApiResponse<PaymentSource[]>> {
    return api.get('/payment-sources', token)
  },

  async createPaymentSource(paymentSource: CreatePaymentSourceForm, token: string): Promise<ApiResponse<PaymentSource>> {
    return api.post('/payment-sources', paymentSource, token)
  },

  async updatePaymentSource(id: string, updates: UpdatePaymentSourceForm, token: string): Promise<ApiResponse<PaymentSource>> {
    return api.put(`/payment-sources/${id}`, updates, token)
  },

  async deletePaymentSource(id: string, token: string): Promise<ApiResponse<void>> {
    return api.delete(`/payment-sources/${id}`, token)
  }
}

// Reports API
export const reportsApi = {
  async getWeeklyReport(weekStart: string, token: string): Promise<ApiResponse<WeeklyReport>> {
    return api.get(`/reports/weekly?weekStart=${weekStart}`, token)
  },

  async generateWeeklyReport(weekStart: string, token: string): Promise<ApiResponse<WeeklyReport>> {
    return api.post('/reports/weekly', { weekStart }, token)
  }
}

// AI Insights API
export const aiApi = {
  async getInsights(userId?: string, token?: string): Promise<ApiResponse<any>> {
    const endpoint = userId ? `/ai/insights?userId=${userId}` : '/ai/insights'
    return api.get(endpoint, token)
  },

  async getRecommendations(userId?: string, token?: string): Promise<ApiResponse<string[]>> {
    const endpoint = userId ? `/ai/recommendations?userId=${userId}` : '/ai/recommendations'
    return api.get(endpoint, token)
  }
}

// Utility functions
export const formatApiError = (error: string | undefined): string => {
  return error || 'An unexpected error occurred'
}

export const isApiSuccess = <T>(response: ApiResponse<T>): response is ApiResponse<T> & { success: true; data: T } => {
  return response.success && response.data !== undefined
} 