import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

// Get stored auth token
const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('auth_token');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Base API request function with authentication
const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = await getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token expired or invalid, redirect to login
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user_data');
    throw new Error('Authentication required');
  }

  return response;
};

// API functions for different endpoints
export const api = {
  // Authentication
  auth: {
    signIn: async (email: string, password: string) => {
      const response = await fetch(`${API_BASE_URL}/api/auth/mobile-signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      return response.json();
    },

    validateSession: async () => {
      const response = await apiRequest('/api/auth/mobile-session');
      return response.json();
    },
  },

  // Dashboard data
  dashboard: {
    getChildData: async () => {
      const response = await apiRequest('/api/dashboard/child');
      return response.json();
    },

    getParentData: async () => {
      const response = await apiRequest('/api/dashboard/parent');
      return response.json();
    },
  },

  // Chores management
  chores: {
    getAll: async () => {
      const response = await apiRequest('/api/chores');
      return response.json();
    },

    create: async (choreData: any) => {
      const response = await apiRequest('/api/chores', {
        method: 'POST',
        body: JSON.stringify(choreData),
      });
      return response.json();
    },

    approve: async (submissionId: string, approvalData: any) => {
      const response = await apiRequest('/api/chores/approve', {
        method: 'POST',
        body: JSON.stringify({ submissionId, ...approvalData }),
      });
      return response.json();
    },
  },

  // Chore submissions
  submissions: {
    submit: async (submissionData: any) => {
      const response = await apiRequest('/api/chore-submissions', {
        method: 'POST',
        body: JSON.stringify(submissionData),
      });
      return response.json();
    },
  },

  // Banking system
  banking: {
    requestBanking: async (amount: number, reason?: string) => {
      const response = await apiRequest('/api/banking/request', {
        method: 'POST',
        body: JSON.stringify({ amount, reason }),
      });
      return response.json();
    },

    getPendingRequests: async () => {
      const response = await apiRequest('/api/banking/pending');
      return response.json();
    },

    approveBanking: async (transactionId: string, approved: boolean, note?: string) => {
      const response = await apiRequest('/api/banking/approve', {
        method: 'POST',
        body: JSON.stringify({ transactionId, approved, note }),
      });
      return response.json();
    },
  },

  // Parental feedback
  feedback: {
    getAll: async (childId?: string, filters?: any) => {
      const params = new URLSearchParams();
      if (childId) params.append('childId', childId);
      if (filters?.type) params.append('type', filters.type);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const response = await apiRequest(`/api/parental-feedback?${params.toString()}`);
      return response.json();
    },

    create: async (feedbackData: any) => {
      const response = await apiRequest('/api/parental-feedback', {
        method: 'POST',
        body: JSON.stringify(feedbackData),
      });
      return response.json();
    },
  },

  // Daily check-ins
  checkIn: {
    submit: async (checkInData: any) => {
      const response = await apiRequest('/api/check-in', {
        method: 'POST',
        body: JSON.stringify(checkInData),
      });
      return response.json();
    },

    getHistory: async (userId?: string, date?: string) => {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (date) params.append('date', date);

      const response = await apiRequest(`/api/check-in?${params.toString()}`);
      return response.json();
    },

    checkTodaysStatus: async (userId: string) => {
      const response = await apiRequest(`/api/check-in?userId=${userId}&checkToday=true`);
      return response.json();
    },
  },

  // Impromptu task submissions
  impromptu: {
    submit: async (taskData: any) => {
      const response = await apiRequest('/api/impromptu-submissions', {
        method: 'POST',
        body: JSON.stringify(taskData),
      });
      return response.json();
    },

    getAll: async () => {
      const response = await apiRequest('/api/impromptu-submissions');
      return response.json();
    },
  },

  // Chorbie integration
  chorbie: {
    chat: async (message: string, context?: any) => {
      const response = await apiRequest('/api/chorbit/chat', {
        method: 'POST',
        body: JSON.stringify({ message, context }),
      });
      return response.json();
    },

    schedule: async (scheduleData: any) => {
      const response = await apiRequest('/api/chorbit/schedule', {
        method: 'POST',
        body: JSON.stringify(scheduleData),
      });
      return response.json();
    },
  },

  // Important events
  events: {
    getUpcoming: async (limit = 5) => {
      const response = await apiRequest(`/api/important-events?upcoming=true&limit=${limit}`);
      return response.json();
    },
  },

  // User preferences
  user: {
    getPreferences: async () => {
      const response = await apiRequest('/api/user/preferences');
      return response.json();
    },

    updatePreferences: async (preferences: any) => {
      const response = await apiRequest('/api/user/preferences', {
        method: 'POST',
        body: JSON.stringify(preferences),
      });
      return response.json();
    },
  },

  // Gamification
  gamification: {
    getStats: async () => {
      const response = await apiRequest('/api/gamification');
      return response.json();
    },

    updateProgress: async (progressData: any) => {
      const response = await apiRequest('/api/gamification', {
        method: 'POST',
        body: JSON.stringify(progressData),
      });
      return response.json();
    },
  },
};

// Error handling helpers
export const handleApiError = (error: any) => {
  if (error.message === 'Authentication required') {
    // Handle authentication error (redirect to login)
    return 'Please sign in again';
  }
  
  return error.message || 'An unexpected error occurred';
};

// Type definitions for common API responses
export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'PARENT' | 'CHILD';
  familyId: string;
  availablePoints?: number;
  bankedMoney?: number;
  pointRate?: number;
}

export interface Chore {
  id: string;
  title: string;
  description?: string;
  points: number;
  reward: number;
  estimatedMinutes: number;
  frequency: string;
  category: string;
  isRequired: boolean;
  assignments?: any[];
}

export interface ChildDashboardData {
  user: User;
  weeklyProgress: {
    completed: number;
    total: number;
    pointsEarned: number;
    pointsPotential: number;
  };
  todaysChores: Chore[];
  upcomingEvents: any[];
  feedback: any[];
  streaks: any;
}