'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AddChoreDialog } from '@/components/ui/add-chore-dialog'
import { AddChildDialog } from '@/components/ui/add-child-dialog'
import { ChoreScoringDialog } from '@/components/ui/chore-scoring-dialog'
import { ChildManagementDialog } from '@/components/ui/child-management-dialog'
import { ImpromptuReviewDialog } from '@/components/ui/impromptu-review-dialog'

export default function ParentDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // State management
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processingApprovals, setProcessingApprovals] = useState<Set<string>>(new Set())
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [isAddChoreDialogOpen, setIsAddChoreDialogOpen] = useState(false)
  const [isAddChildDialogOpen, setIsAddChildDialogOpen] = useState(false)
  const [isChildManagementOpen, setIsChildManagementOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [settingsChanged, setSettingsChanged] = useState(false)
  const [pendingSettings, setPendingSettings] = useState<any>({})
  const [scoringDialog, setScoringDialog] = useState<{ isOpen: boolean; submission: any }>({
    isOpen: false,
    submission: null
  })
  const [currentChores, setCurrentChores] = useState<any[]>([])
  const [editingChore, setEditingChore] = useState<any>(null)
  const [isEditChoreDialogOpen, setIsEditChoreDialogOpen] = useState(false)
  const [impromptuSubmissions, setImpromptuSubmissions] = useState<any[]>([])
  const [impromptuReviewDialog, setImpromptuReviewDialog] = useState<{ isOpen: boolean; submission: any }>({
    isOpen: false,
    submission: null
  })

  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (!session) {
      router.push('/auth/signin')
      return
    }

    if (session.user.role !== 'PARENT') {
      router.push('/dashboard/child')
      return
    }

    // Fetch dashboard data
    fetchDashboardData()
    fetchCurrentChores()
    fetchImpromptuSubmissions()
  }, [session, status, router])

  const fetchCurrentChores = async () => {
    try {
      const response = await fetch('/api/chores')
      if (!response.ok) {
        throw new Error('Failed to fetch chores')
      }
      const result = await response.json()
      setCurrentChores(result.chores || [])
    } catch (error) {
      console.error('Error fetching chores:', error)
    }
  }

  const fetchImpromptuSubmissions = async () => {
    try {
      const response = await fetch('/api/impromptu-submissions?status=PENDING')
      if (response.ok) {
        const result = await response.json()
        setImpromptuSubmissions(result.submissions || [])
      }
    } catch (error) {
      console.error('Error fetching impromptu submissions:', error)
    }
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard/parent')
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Dashboard API error:', errorData)
        
        let errorMessage = 'Failed to load dashboard data. Please refresh the page.'
        
        if (errorData.code === 'NO_FAMILY') {
          errorMessage = 'No family found for your account. Please contact support or set up your family first.'
        } else if (errorData.error) {
          errorMessage = errorData.error
        }
        
        throw new Error(errorMessage)
      }
      
      const result = await response.json()
      
      if (!result.success || !result.data) {
        throw new Error('Invalid response from dashboard API')
      }
      
      setDashboardData(result.data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setMessage({
        type: 'error',
        text: (error as Error).message || 'Failed to load dashboard data. Please refresh the page.'
      })
    } finally {
      setLoading(false)
    }
  }

  // Clear messages after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== 'PARENT') {
    return null
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No dashboard data available</p>
          <Button onClick={fetchDashboardData} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  const handleApprove = async (id: string) => {
    setProcessingApprovals(prev => new Set([...prev, id]))
    
    try {
      const response = await fetch('/api/chores/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: id, approved: true })
      })
      
      if (!response.ok) {
        throw new Error('Failed to approve chore')
      }
      
      // Find the approval to show success message
      const approval = dashboardData.pendingApprovals.find((a: any) => a.id === id)
      setMessage({
        type: 'success',
        text: `✅ Approved ${approval?.choreName} for ${approval?.childName} - $${approval?.reward} earned!`
      })
      
      // Refresh dashboard data
      fetchDashboardData()
      
    } catch (error) {
      setMessage({
        type: 'error',
        text: '❌ Failed to approve chore. Please try again.'
      })
    } finally {
      setProcessingApprovals(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  const handleScore = async (id: string) => {
    const submission = dashboardData.pendingApprovals.find((a: any) => a.id === id)
    setScoringDialog({
      isOpen: true,
      submission: submission
    })
  }

  const handleScoreSubmission = async (score: number, feedback: string) => {
    const submissionId = scoringDialog.submission.id
    setProcessingApprovals(prev => new Set([...prev, submissionId]))
    
    try {
      const response = await fetch('/api/chores/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          submissionId: submissionId, 
          approved: true, 
          score: score,
          feedback: feedback 
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to score chore')
      }
      
      const result = await response.json()
      const partialReward = result.data.partialReward
      const originalReward = result.data.originalReward
      
      setMessage({
        type: 'success',
        text: `✅ Scored ${scoringDialog.submission.choreName} for ${scoringDialog.submission.childName} - ${score}% quality = $${partialReward} earned (${originalReward - partialReward > 0 ? `$${originalReward - partialReward} deducted` : 'full reward'})`
      })
      
      // Refresh dashboard data
      fetchDashboardData()
      
    } catch (error) {
      setMessage({
        type: 'error',
        text: '❌ Failed to score chore. Please try again.'
      })
    } finally {
      setProcessingApprovals(prev => {
        const newSet = new Set(prev)
        newSet.delete(submissionId)
        return newSet
      })
    }
  }

  const handleDeny = async (id: string) => {
    setProcessingApprovals(prev => new Set([...prev, id]))
    
    try {
      const response = await fetch('/api/chores/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: id, approved: false })
      })
      
      if (!response.ok) {
        throw new Error('Failed to deny chore')
      }
      
      // Find the approval to show message
      const approval = dashboardData.pendingApprovals.find((a: any) => a.id === id)
      setMessage({
        type: 'success',
        text: `❌ Denied ${approval?.choreName} for ${approval?.childName}. They can try again!`
      })
      
      // Refresh dashboard data
      fetchDashboardData()
      
    } catch (error) {
      setMessage({
        type: 'error',
        text: '❌ Failed to deny chore. Please try again.'
      })
    } finally {
      setProcessingApprovals(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  const handleQuickAction = (action: string) => {
    if (action === 'Add New Chore') {
      setIsAddChoreDialogOpen(true)
    } else if (action === 'Add Child Account') {
      setIsAddChildDialogOpen(true)
    } else if (action === 'Manage Children') {
      setIsChildManagementOpen(true)
    } else {
      setMessage({
        type: 'success',
        text: `🚧 "${action}" feature coming soon! This will open a dialog to ${action.toLowerCase()}.`
      })
    }
  }

  const handleAddChoreSuccess = (successMessage: string) => {
    setMessage({
      type: 'success',
      text: successMessage
    })
    // Refresh dashboard data to show new chore
    fetchDashboardData()
    fetchCurrentChores()
  }

  const handleEditChore = (chore: any) => {
    setEditingChore(chore)
    setIsEditChoreDialogOpen(true)
  }

  const handleEditChoreSuccess = (successMessage: string) => {
    setMessage({
      type: 'success',
      text: successMessage
    })
    setIsEditChoreDialogOpen(false)
    setEditingChore(null)
    fetchCurrentChores()
  }

  const handleDeleteChore = async (choreId: string, choreName: string) => {
    if (!confirm(`Are you sure you want to delete "${choreName}"? This will remove all related submissions and assignments.`)) {
      return
    }

    try {
      const response = await fetch('/api/chores', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ choreId })
      })

      const result = await response.json()

      if (response.ok) {
        setMessage({
          type: 'success',
          text: result.message || 'Chore deleted successfully!'
        })
        fetchCurrentChores()
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to delete chore'
        })
      }
    } catch (error) {
      console.error('Error deleting chore:', error)
      setMessage({
        type: 'error',
        text: 'Failed to delete chore. Please try again.'
      })
    }
  }

  const handleAddChildSuccess = (successMessage: string) => {
    setMessage({
      type: 'success',
      text: successMessage
    })
    // Refresh dashboard data to show new child
    fetchDashboardData()
  }

  const handleImpromptuReview = (submission: any) => {
    setImpromptuReviewDialog({
      isOpen: true,
      submission: submission
    })
  }

  const handleImpromptuResponse = (successMessage: string) => {
    setMessage({
      type: 'success',
      text: successMessage
    })
    // Refresh impromptu submissions
    fetchImpromptuSubmissions()
  }

  const handleReviewCompleted = async (completion: any, action: 'approve' | 'reject') => {
    const confirmMessage = action === 'reject' 
      ? `Are you sure you want to reject "${completion.choreName}" completed by ${completion.childName}? This will reverse the auto-approval and remove their reward.`
      : `Confirm keeping "${completion.choreName}" by ${completion.childName} as approved.`
    
    if (!confirm(confirmMessage)) {
      return
    }

    try {
      const response = await fetch('/api/chores/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId: completion.id,
          approved: action === 'approve',
          feedback: action === 'reject' ? 'Auto-approval reversed by parent review' : 'Confirmed by parent review'
        })
      })

      const result = await response.json()

      if (response.ok) {
        setMessage({
          type: 'success',
          text: action === 'approve' 
            ? `✅ Confirmed "${completion.choreName}" for ${completion.childName}`
            : `❌ Rejected "${completion.choreName}" for ${completion.childName} - auto-approval reversed`
        })
        // Refresh dashboard data
        fetchDashboardData()
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to review completed chore'
        })
      }
    } catch (error) {
      console.error('Error reviewing completed chore:', error)
      setMessage({
        type: 'error',
        text: 'Failed to review completed chore. Please try again.'
      })
    }
  }

  const handleSettingChange = (setting: string, value: boolean) => {
    setPendingSettings((prev: any) => ({
      ...prev,
      [setting]: value
    }))
    setSettingsChanged(true)
  }

  const handleSaveSettings = async () => {
    try {
      const response = await fetch('/api/family-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pendingSettings)
      })

      if (!response.ok) {
        throw new Error('Failed to update settings')
      }

      const result = await response.json()
      
      setMessage({
        type: 'success',
        text: 'Settings updated successfully!'
      })
      
      // Refresh dashboard data to reflect changes
      fetchDashboardData()
      setShowSettings(false)
      setSettingsChanged(false)
      setPendingSettings({})
      
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to update settings. Please try again.'
      })
    }
  }

  const handleCancelSettings = () => {
    setPendingSettings({})
    setSettingsChanged(false)
    setShowSettings(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Parent Dashboard
              </h1>
              <p className="text-gray-600">Welcome, {session.user.name}! 👋</p>
            </div>
            <Button 
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              variant="outline"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Success/Error Messages */}
        {message && (
          <div className={`p-4 rounded-lg border ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <p>{message.text}</p>
          </div>
        )}

        {/* Family Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Family Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <strong>{dashboardData.family.name}</strong>
                </p>
                <p className="text-sm">👨‍👩‍👧‍👦 {dashboardData.family.totalChildren} children</p>
                <p className="text-sm">💰 ${dashboardData.family.weeklyAllowance}/week budget</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm">✅ {dashboardData.weeklyStats.totalChoresCompleted} chores completed</p>
                <p className="text-sm">💵 ${dashboardData.weeklyStats.totalEarningsApproved} approved</p>
                <p className="text-sm">📊 {dashboardData.weeklyStats.childrenParticipation} participation</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button 
                  size="sm" 
                  className="w-full" 
                  variant="outline"
                  onClick={() => handleQuickAction('Add New Chore')}
                >
                  Add New Chore
                </Button>
                <Button 
                  size="sm" 
                  className="w-full" 
                  variant="outline"
                  onClick={() => handleQuickAction('Add Child Account')}
                >
                  Add Child Account
                </Button>
                <Button 
                  size="sm" 
                  className="w-full" 
                  variant="outline"
                  onClick={() => handleQuickAction('Manage Children')}
                >
                  👨‍👩‍👧‍👦 Manage Children
                </Button>
                <Button 
                  size="sm" 
                  className="w-full" 
                  variant="outline"
                  onClick={() => setShowSettings(true)}
                >
                  Settings
                </Button>
                {dashboardData.permissions.canInvite && (
                  <Button 
                    size="sm" 
                    className="w-full" 
                    variant="outline"
                    onClick={() => setShowInviteDialog(true)}
                  >
                    Invite Parent
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Approvals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Pending Reviews 
              {(dashboardData.pendingApprovals.length + impromptuSubmissions.length) > 0 && (
                <Badge variant="destructive">
                  {dashboardData.pendingApprovals.length + impromptuSubmissions.length}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Review chores and special submissions from your children
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(dashboardData.pendingApprovals.length === 0 && impromptuSubmissions.length === 0) ? (
              <div className="text-center py-8 text-gray-500">
                <p>🎉 All caught up! No pending reviews.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Impromptu Submissions */}
                {impromptuSubmissions.map((submission: any) => (
                  <div 
                    key={`impromptu-${submission.id}`}
                    className="flex items-center justify-between p-4 bg-purple-50 border border-purple-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">✨</span>
                        <div>
                          <p className="font-medium">{submission.child.name} did something special!</p>
                          <p className="text-sm font-semibold text-purple-800">"{submission.title}"</p>
                          <p className="text-sm text-gray-600 mt-1">{submission.description}</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Submitted {new Date(submission.submittedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleImpromptuReview(submission)}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        Review ✨
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Chore Submissions */}
                {dashboardData.pendingApprovals.map((approval: any) => (
                  <div 
                    key={`chore-${approval.id}`}
                    className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{approval.childName}</p>
                        <span className="text-gray-400">completed</span>
                        <p className="font-medium">{approval.choreName}</p>
                      </div>
                      <p className="text-sm text-gray-600">
                        Submitted {new Date(approval.submittedAt).toLocaleString()} • ${approval.reward} reward
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeny(approval.id)}
                        disabled={processingApprovals.has(approval.id)}
                        className="text-red-600 border-red-200 hover:bg-red-50 disabled:opacity-50"
                      >
                        {processingApprovals.has(approval.id) ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600 mr-1"></div>
                            Denying...
                          </>
                        ) : (
                          'Deny'
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleScore(approval.id)}
                        disabled={processingApprovals.has(approval.id)}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50 disabled:opacity-50"
                      >
                        {processingApprovals.has(approval.id) ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
                            Scoring...
                          </>
                        ) : (
                          'Score'
                        )}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(approval.id)}
                        disabled={processingApprovals.has(approval.id)}
                        className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
                      >
                        {processingApprovals.has(approval.id) ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                            Approving...
                          </>
                        ) : (
                          `Approve $${approval.reward}`
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Chores Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Current Chores
              {currentChores.length > 0 && (
                <Badge variant="secondary">
                  {currentChores.length}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Manage and edit your family's chores
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentChores.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>📝 No chores yet. Create your first chore to get started!</p>
                <Button 
                  onClick={() => setIsAddChoreDialogOpen(true)}
                  className="mt-4 bg-blue-600 hover:bg-blue-700"
                >
                  Add First Chore
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {currentChores.map((chore: any) => (
                  <div 
                    key={chore.id}
                    className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium text-gray-900">{chore.title}</p>
                          <p className="text-sm text-gray-600 mt-1">{chore.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              💰 ${chore.reward}
                            </span>
                            <span className="flex items-center gap-1">
                              ⏱️ {chore.estimatedMinutes}min
                            </span>
                            <span className="flex items-center gap-1">
                              📅 {chore.frequency}
                            </span>
                            {chore.isRequired && (
                              <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs">
                                Required
                              </span>
                            )}
                            {chore.scheduledDays && chore.scheduledDays.length > 0 && (
                              <span className="text-xs">
                                {chore.scheduledDays.map((d: number) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {chore.assignments && chore.assignments.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500">
                            Assigned to: {chore.assignments.map((a: any) => a.user?.name || 'Unknown').join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditChore(chore)}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        ✏️ Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteChore(chore.id, chore.title)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        🗑️ Delete
                      </Button>
                    </div>
                  </div>
                ))}
                
                {/* Add New Chore Button */}
                <div className="border-t pt-4">
                  <Button 
                    onClick={() => setIsAddChoreDialogOpen(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    ➕ Add New Chore
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completed Chores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Completed Chores
              {dashboardData.completedChores?.length > 0 && (
                <Badge variant="secondary">
                  {dashboardData.completedChores.length}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {dashboardData.family.settings.autoApproveChores 
                ? "Auto-approved and manually approved chores (last 7 days)" 
                : "Recently completed chores (last 7 days)"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!dashboardData.completedChores || dashboardData.completedChores.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <p>No completed chores in the last 7 days</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dashboardData.completedChores.map((completion: any) => (
                  <div 
                    key={completion.id} 
                    className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            {completion.choreName}
                          </p>
                          <p className="text-sm text-gray-600">
                            by {completion.childName} • {new Date(completion.submittedAt).toLocaleDateString()}
                            {completion.approval?.isAutoApproved && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                Auto-approved
                              </span>
                            )}
                          </p>
                          {completion.notes && (
                            <p className="text-xs text-gray-500 mt-1">"{completion.notes}"</p>
                          )}
                          {completion.approval?.feedback && (
                            <p className="text-xs text-green-600 mt-1">
                              Feedback: "{completion.approval.feedback}"
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-600">
                          ${completion.approval?.partialReward || completion.reward}
                          {completion.approval?.score && completion.approval.score < 100 && (
                            <span className="text-xs text-gray-500 block">
                              {completion.approval.score}% quality
                            </span>
                          )}
                        </p>
                      </div>
                      {completion.approval?.isAutoApproved && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReviewCompleted(completion, 'approve')}
                            className="text-green-600 border-green-200 hover:bg-green-50 text-xs px-2"
                          >
                            ✓ Keep
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReviewCompleted(completion, 'reject')}
                            className="text-red-600 border-red-200 hover:bg-red-50 text-xs px-2"
                          >
                            ✗ Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest updates from your family
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.recentActivity.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <p>No recent activity yet. Get started by adding chores!</p>
                </div>
              ) : (
                dashboardData.recentActivity.map((activity: any) => (
                  <div key={activity.id} className="flex items-center gap-3 text-sm">
                    <span className={activity.action === 'completed' ? 'text-green-600' : 'text-blue-600'}>
                      {activity.action === 'completed' ? '✅' : '📝'}
                    </span>
                    <span>
                      {activity.childName} {activity.action} "{activity.choreName}"
                      {activity.action === 'completed' && (
                        <>
                          {activity.score && activity.score < 100 ? (
                            <span className="text-orange-600">
                              {' '}and earned ${activity.partialReward || activity.reward} ({activity.score}% quality)
                            </span>
                          ) : (
                            <span> and earned ${activity.reward}</span>
                          )}
                        </>
                      )}
                    </span>
                    <span className="text-gray-400 text-xs">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

              {/* Add Chore Dialog */}
        <AddChoreDialog
          isOpen={isAddChoreDialogOpen}
          onClose={() => setIsAddChoreDialogOpen(false)}
          onSuccess={handleAddChoreSuccess}
          familyChildren={dashboardData?.children || []}
        />

        {/* Edit Chore Dialog */}
        {editingChore && (
          <AddChoreDialog
            isOpen={isEditChoreDialogOpen}
            onClose={() => {
              setIsEditChoreDialogOpen(false)
              setEditingChore(null)
            }}
            onSuccess={handleEditChoreSuccess}
            familyChildren={dashboardData?.children || []}
            editingChore={editingChore}
          />
        )}

        {/* Add Child Dialog */}
        <AddChildDialog
          isOpen={isAddChildDialogOpen}
          onClose={() => setIsAddChildDialogOpen(false)}
          onSuccess={handleAddChildSuccess}
        />

        {/* Child Management Dialog */}
        <ChildManagementDialog
          isOpen={isChildManagementOpen}
          onClose={() => setIsChildManagementOpen(false)}
          onSuccess={(message) => {
            setMessage({ type: 'success', text: message })
            fetchDashboardData() // Refresh dashboard data
          }}
          children={dashboardData?.children || []}
        />

        {/* Chore Scoring Dialog */}
        <ChoreScoringDialog
          isOpen={scoringDialog.isOpen}
          onClose={() => setScoringDialog({ isOpen: false, submission: null })}
          submission={scoringDialog.submission}
          onScore={handleScoreSubmission}
        />

        {/* Impromptu Review Dialog */}
        <ImpromptuReviewDialog
          isOpen={impromptuReviewDialog.isOpen}
          onClose={() => setImpromptuReviewDialog({ isOpen: false, submission: null })}
          submission={impromptuReviewDialog.submission}
          onSuccess={handleImpromptuResponse}
        />

      {/* Settings Dialog */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-white shadow-2xl">
            <CardHeader>
              <CardTitle>Family Settings</CardTitle>
              <CardDescription>Configure your family's preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-6">
                {/* Auto-approve chores */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Auto-approve chores</span>
                    <button
                      type="button"
                      onClick={() => handleSettingChange('autoApproveChores', !(pendingSettings.autoApproveChores ?? dashboardData.family.settings.autoApproveChores))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        (pendingSettings.autoApproveChores ?? dashboardData.family.settings.autoApproveChores)
                          ? 'bg-blue-600'
                          : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          (pendingSettings.autoApproveChores ?? dashboardData.family.settings.autoApproveChores)
                            ? 'translate-x-6'
                            : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    When enabled, children's chore submissions are automatically approved and rewards are awarded instantly. When disabled (default), parents must manually review and approve each submission.
                  </p>
                </div>
                
                {/* Allow multiple parents */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Allow multiple parents</span>
                  <button
                    type="button"
                    onClick={() => handleSettingChange('allowMultipleParents', !(pendingSettings.allowMultipleParents ?? dashboardData.family.settings.allowMultipleParents))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      (pendingSettings.allowMultipleParents ?? dashboardData.family.settings.allowMultipleParents)
                        ? 'bg-blue-600'
                        : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        (pendingSettings.allowMultipleParents ?? dashboardData.family.settings.allowMultipleParents)
                          ? 'translate-x-6'
                          : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                {/* Email notifications */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Email notifications</span>
                  <button
                    type="button"
                    onClick={() => handleSettingChange('emailNotifications', !(pendingSettings.emailNotifications ?? dashboardData.family.settings.emailNotifications))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      (pendingSettings.emailNotifications ?? dashboardData.family.settings.emailNotifications)
                        ? 'bg-blue-600'
                        : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        (pendingSettings.emailNotifications ?? dashboardData.family.settings.emailNotifications)
                          ? 'translate-x-6'
                          : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                {/* Share reports */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Share reports</span>
                  <button
                    type="button"
                    onClick={() => handleSettingChange('shareReports', !(pendingSettings.shareReports ?? dashboardData.family.settings.shareReports))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      (pendingSettings.shareReports ?? dashboardData.family.settings.shareReports)
                        ? 'bg-blue-600'
                        : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        (pendingSettings.shareReports ?? dashboardData.family.settings.shareReports)
                          ? 'translate-x-6'
                          : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
              
              {/* Footer with actions */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    {settingsChanged && '⚠️ You have unsaved changes'}
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={handleCancelSettings}
                      size="sm"
                    >
                      {settingsChanged ? 'Cancel' : 'Close'}
                    </Button>
                    <Button 
                      onClick={handleSaveSettings} 
                      disabled={!settingsChanged}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Invite Parent Dialog */}
      {showInviteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <Card className="w-full max-w-md bg-white shadow-2xl">
            <CardHeader>
              <CardTitle>Invite Another Parent</CardTitle>
              <CardDescription>Send an invitation to join your family</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="inviteEmail" className="text-sm font-medium">
                  Email Address
                </label>
                <input
                  id="inviteEmail"
                  type="email"
                  placeholder="parent@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Permissions</label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="canInvite" className="h-4 w-4" />
                    <label htmlFor="canInvite" className="text-sm">Can invite other parents</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="canManage" className="h-4 w-4" />
                    <label htmlFor="canManage" className="text-sm">Can manage family settings</label>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  setMessage({ type: 'success', text: 'Invite functionality coming soon!' })
                  setShowInviteDialog(false)
                }}>
                  Send Invite
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 