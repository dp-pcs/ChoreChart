import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api, ChildDashboardData, User } from '../lib/api';

export function useDashboard() {
  const { user, token } = useAuth();
  const [dashboardData, setDashboardData] = useState<ChildDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    if (!user || !token) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      if (user.role === 'CHILD') {
        const data = await api.dashboard.getChildData();
        setDashboardData(data);
      } else {
        const data = await api.dashboard.getParentData();
        setDashboardData(data);
      }
    } catch (error: any) {
      console.error('Dashboard fetch error:', error);
      setError(error.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user, token]);

  const refreshData = () => {
    fetchDashboardData();
  };

  return {
    dashboardData,
    isLoading,
    error,
    refreshData,
  };
}

export function useChores() {
  const [chores, setChores] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChores = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await api.chores.getAll();
      setChores(data.chores || []);
    } catch (error: any) {
      console.error('Chores fetch error:', error);
      setError(error.message || 'Failed to load chores');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChores();
  }, []);

  const createChore = async (choreData: any) => {
    try {
      await api.chores.create(choreData);
      await fetchChores(); // Refresh list
      return true;
    } catch (error) {
      console.error('Create chore error:', error);
      return false;
    }
  };

  const submitChore = async (choreId: string, notes?: string) => {
    try {
      await api.submissions.submit({
        choreId,
        notes,
        submittedAt: new Date().toISOString(),
      });
      await fetchChores(); // Refresh list
      return true;
    } catch (error) {
      console.error('Submit chore error:', error);
      return false;
    }
  };

  const approveChore = async (submissionId: string, approved: boolean, feedback?: string, score?: number) => {
    try {
      await api.chores.approve(submissionId, {
        approved,
        feedback,
        score,
      });
      await fetchChores(); // Refresh list
      return true;
    } catch (error) {
      console.error('Approve chore error:', error);
      return false;
    }
  };

  return {
    chores,
    isLoading,
    error,
    refreshChores: fetchChores,
    createChore,
    submitChore,
    approveChore,
  };
}

export function useBanking() {
  const [bankingRequests, setBankingRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBankingRequests = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await api.banking.getPendingRequests();
      setBankingRequests(data.requests || []);
    } catch (error: any) {
      console.error('Banking requests fetch error:', error);
      setError(error.message || 'Failed to load banking requests');
    } finally {
      setIsLoading(false);
    }
  };

  const requestBanking = async (amount: number, reason?: string) => {
    try {
      await api.banking.requestBanking(amount, reason);
      return true;
    } catch (error: any) {
      console.error('Banking request error:', error);
      throw new Error(error.message || 'Failed to submit banking request');
    }
  };

  const approveBanking = async (transactionId: string, approved: boolean, note?: string) => {
    try {
      await api.banking.approveBanking(transactionId, approved, note);
      await fetchBankingRequests(); // Refresh list
      return true;
    } catch (error) {
      console.error('Banking approval error:', error);
      return false;
    }
  };

  return {
    bankingRequests,
    isLoading,
    error,
    fetchBankingRequests,
    requestBanking,
    approveBanking,
  };
}

export function useFeedback() {
  const [feedback, setFeedback] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeedback = async (childId?: string, filters?: any) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await api.feedback.getAll(childId, filters);
      setFeedback(data.feedback || []);
    } catch (error: any) {
      console.error('Feedback fetch error:', error);
      setError(error.message || 'Failed to load feedback');
    } finally {
      setIsLoading(false);
    }
  };

  const createFeedback = async (feedbackData: any) => {
    try {
      await api.feedback.create(feedbackData);
      await fetchFeedback(); // Refresh list
      return true;
    } catch (error) {
      console.error('Create feedback error:', error);
      return false;
    }
  };

  return {
    feedback,
    isLoading,
    error,
    fetchFeedback,
    createFeedback,
  };
}

export function useCheckIn() {
  const [checkIns, setCheckIns] = useState<any[]>([]);
  const [todaysStatus, setTodaysStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitCheckIn = async (checkInData: any) => {
    try {
      await api.checkIn.submit(checkInData);
      return true;
    } catch (error: any) {
      console.error('Check-in submit error:', error);
      throw new Error(error.message || 'Failed to submit check-in');
    }
  };

  const checkTodaysStatus = async (userId: string) => {
    try {
      const data = await api.checkIn.checkTodaysStatus(userId);
      setTodaysStatus(data);
      return data;
    } catch (error) {
      console.error('Check todays status error:', error);
      return null;
    }
  };

  const fetchCheckInHistory = async (userId?: string, date?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await api.checkIn.getHistory(userId, date);
      setCheckIns(data || []);
    } catch (error: any) {
      console.error('Check-in history fetch error:', error);
      setError(error.message || 'Failed to load check-in history');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    checkIns,
    todaysStatus,
    isLoading,
    error,
    submitCheckIn,
    checkTodaysStatus,
    fetchCheckInHistory,
  };
}

export function useImpromptu() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmissions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await api.impromptu.getAll();
      setSubmissions(data.submissions || []);
    } catch (error: any) {
      console.error('Impromptu submissions fetch error:', error);
      setError(error.message || 'Failed to load submissions');
    } finally {
      setIsLoading(false);
    }
  };

  const submitTask = async (taskData: any) => {
    try {
      await api.impromptu.submit(taskData);
      return true;
    } catch (error: any) {
      console.error('Submit task error:', error);
      throw new Error(error.message || 'Failed to submit task');
    }
  };

  return {
    submissions,
    isLoading,
    error,
    fetchSubmissions,
    submitTask,
  };
}