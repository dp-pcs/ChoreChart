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
  const [pendingApprovals, setPendingApprovals] = useState([
    {
      id: '1',
      childName: 'Noah',
      choreName: 'Clean bedroom',
      submittedAt: '10 minutes ago',
      reward: 5.00,
      status: 'pending'
    },
    {
      id: '2',
      childName: 'Emma',
      choreName: 'Feed the dog',
      submittedAt: '1 hour ago',
      reward: 3.00,
      status: 'pending'
    }
  ])
  
  const [processingApprovals, setProcessingApprovals] = useState<Set<string>>(new Set())
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [isAddChoreDialogOpen, setIsAddChoreDialogOpen] = useState(false)

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
  }, [session, status, router])

  // Clear messages after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  if (status === 'loading') {
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

  const mockData = {
    family: {
      name: session.user.family?.name || 'Your Family',
      totalChildren: 2,
      weeklyAllowance: 45.00,
    },
    weeklyStats: {
      totalChoresCompleted: 18,
      totalEarningsApproved: 52.50,
      childrenParticipation: '85%'
    }
  }

  const handleApprove = async (id: string) => {
    setProcessingApprovals(prev => new Set([...prev, id]))
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Remove from pending approvals
      setPendingApprovals(prev => prev.filter(approval => approval.id !== id))
      
      // Find the approval to show success message
      const approval = pendingApprovals.find(a => a.id === id)
      setMessage({
        type: 'success',
        text: `✅ Approved ${approval?.choreName} for ${approval?.childName} - $${approval?.reward} earned!`
      })
      
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Remove from pending approvals
      setPendingApprovals(prev => prev.filter(approval => approval.id !== id))
      
      // Find the approval to show message
      const approval = pendingApprovals.find(a => a.id === id)
      setMessage({
        type: 'success',
        text: `❌ Denied ${approval?.choreName} for ${approval?.childName}. They can try again!`
      })
      
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
                  <strong>{mockData.family.name}</strong>
                </p>
                <p className="text-sm">👨‍👩‍👧‍👦 {mockData.family.totalChildren} children</p>
                <p className="text-sm">💰 ${mockData.family.weeklyAllowance}/week budget</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm">✅ {mockData.weeklyStats.totalChoresCompleted} chores completed</p>
                <p className="text-sm">💵 ${mockData.weeklyStats.totalEarningsApproved} approved</p>
                <p className="text-sm">📊 {mockData.weeklyStats.childrenParticipation} participation</p>
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
                  onClick={() => handleQuickAction('View Reports')}
                >
                  View Reports
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Approvals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Pending Approvals 
              {pendingApprovals.length > 0 && (
                <Badge variant="destructive">
                  {pendingApprovals.length}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Review and approve completed chores
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingApprovals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>🎉 All caught up! No pending approvals.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingApprovals.map((approval: any) => (
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
                        Submitted {approval.submittedAt} • ${approval.reward} reward
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
              <div className="flex items-center gap-3 text-sm">
                <span className="text-green-600">✅</span>
                <span>Noah completed "Make bed" and earned $2.00</span>
                <span className="text-gray-400 text-xs">2 hours ago</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-blue-600">📝</span>
                <span>Emma submitted "Take out trash" for approval</span>
                <span className="text-gray-400 text-xs">3 hours ago</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-purple-600">🎯</span>
                <span>Weekly report generated - 92% completion rate!</span>
                <span className="text-gray-400 text-xs">1 day ago</span>
              </div>
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
    </div>
  )
} 