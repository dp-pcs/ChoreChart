'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AddChoreDialog } from '@/components/ui/add-chore-dialog'

export default function ParentDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // State management
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processingApprovals, setProcessingApprovals] = useState<Set<string>>(new Set())
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [isAddChoreDialogOpen, setIsAddChoreDialogOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)

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
  }, [session, status, router])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard/parent')
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }
      const result = await response.json()
      setDashboardData(result.data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setMessage({
        type: 'error',
        text: 'Failed to load dashboard data. Please refresh the page.'
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
              Pending Approvals 
              {dashboardData.pendingApprovals.length > 0 && (
                <Badge variant="destructive">
                  {dashboardData.pendingApprovals.length}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Review and approve completed chores
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardData.pendingApprovals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>🎉 All caught up! No pending approvals.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dashboardData.pendingApprovals.map((approval: any) => (
                  <div 
                    key={approval.id}
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
                      {activity.action === 'completed' && ` and earned $${activity.reward}`}
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
      />

      {/* Settings Dialog */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md bg-white">
            <CardHeader>
              <CardTitle>Family Settings</CardTitle>
              <CardDescription>Configure your family's preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Auto-approve chores</span>
                  <Badge variant={dashboardData.family.settings.autoApproveChores ? "default" : "secondary"}>
                    {dashboardData.family.settings.autoApproveChores ? "On" : "Off"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Allow multiple parents</span>
                  <Badge variant={dashboardData.family.settings.allowMultipleParents ? "default" : "secondary"}>
                    {dashboardData.family.settings.allowMultipleParents ? "On" : "Off"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Email notifications</span>
                  <Badge variant={dashboardData.family.settings.emailNotifications ? "default" : "secondary"}>
                    {dashboardData.family.settings.emailNotifications ? "On" : "Off"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Share reports</span>
                  <Badge variant={dashboardData.family.settings.shareReports ? "default" : "secondary"}>
                    {dashboardData.family.settings.shareReports ? "On" : "Off"}
                  </Badge>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowSettings(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setMessage({ type: 'success', text: 'Settings feature coming soon!' })
                  setShowSettings(false)
                }}>
                  Edit Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Invite Parent Dialog */}
      {showInviteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md bg-white">
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