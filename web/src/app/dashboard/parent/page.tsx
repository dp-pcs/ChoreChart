'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ChoreManagement } from '@/components/ui/chore-management'
import { ScheduleView } from '@/components/ui/schedule-view'

interface Child {
  id: string
  name: string
  age?: number
  avatar?: string
}

interface Chore {
  id: string
  title: string
  description?: string
  assignedTo: string[]
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom' | 'once'
  reward: number
  estimatedMinutes: number
  category: string
  isRequired: boolean
  scheduledDays?: number[]
  createdBy: string
  createdAt: string
  isActive: boolean
}

export default function ParentDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // Main state management
  const [activeTab, setActiveTab] = useState<'overview' | 'chores' | 'schedule' | 'children'>('overview')
  const [selectedChild, setSelectedChild] = useState<string>('')
  const [showAddChild, setShowAddChild] = useState(false)
  
  // Mock data - replace with real data from API
  const [children, setChildren] = useState<Child[]>([
    { id: 'child-1', name: 'Noah', age: 10 },
    { id: 'child-2', name: 'Emma', age: 8 }
  ])

  const [chores] = useState<Chore[]>([
    {
      id: '1',
      title: 'Make Bed',
      description: 'Make your bed neatly every morning',
      assignedTo: ['child-1'],
      frequency: 'daily',
      reward: 2.00,
      estimatedMinutes: 5,
      category: 'bedroom',
      isRequired: true,
      scheduledDays: [1, 2, 3, 4, 5],
      createdBy: 'parent-1',
      createdAt: new Date().toISOString(),
      isActive: true
    },
    {
      id: '2',
      title: 'Clean Room',
      description: 'Tidy up bedroom and put clothes away',
      assignedTo: ['child-1'],
      frequency: 'weekly',
      reward: 5.00,
      estimatedMinutes: 30,
      category: 'bedroom',
      isRequired: false,
      scheduledDays: [6],
      createdBy: 'parent-1',
      createdAt: new Date().toISOString(),
      isActive: true
    },
    {
      id: '3',
      title: 'Take Out Trash',
      description: 'Empty all wastebaskets and take to curb',
      assignedTo: ['child-2'],
      frequency: 'weekly',
      reward: 3.00,
      estimatedMinutes: 10,
      category: 'household',
      isRequired: true,
      scheduledDays: [2],
      createdBy: 'parent-1',
      createdAt: new Date().toISOString(),
      isActive: true
    }
  ])
  
  // Pending approvals state
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

  useEffect(() => {
    if (status === 'loading') return

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
      totalChildren: children.length,
      weeklyAllowance: chores.reduce((total, chore) => {
        const multiplier = chore.frequency === 'daily' ? 7 : 
                         chore.frequency === 'weekly' ? 1 :
                         chore.frequency === 'biweekly' ? 0.5 : 1
        return total + (chore.reward * multiplier)
      }, 0),
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
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setPendingApprovals(prev => prev.filter(approval => approval.id !== id))
      
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
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setPendingApprovals(prev => prev.filter(approval => approval.id !== id))
      
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

  const handleAddChild = () => {
    setShowAddChild(true)
  }

  const handleSaveChild = (childData: { name: string; age: number }) => {
    const newChild: Child = {
      id: `child-${Date.now()}`,
      name: childData.name,
      age: childData.age
    }
    setChildren(prev => [...prev, newChild])
    setShowAddChild(false)
    setMessage({
      type: 'success',
      text: `✅ Added ${childData.name} to your family!`
    })
  }

  if (showAddChild) {
    return <AddChildModal onSave={handleSaveChild} onCancel={() => setShowAddChild(false)} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
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

      <div className="max-w-7xl mx-auto p-4 space-y-6">
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

        {/* Navigation Tabs */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={activeTab === 'overview' ? 'default' : 'outline'}
                onClick={() => setActiveTab('overview')}
              >
                🏠 Overview
              </Button>
              <Button
                variant={activeTab === 'chores' ? 'default' : 'outline'}
                onClick={() => setActiveTab('chores')}
              >
                📋 Manage Chores
              </Button>
              <Button
                variant={activeTab === 'schedule' ? 'default' : 'outline'}
                onClick={() => setActiveTab('schedule')}
              >
                📅 Schedule View
              </Button>
              <Button
                variant={activeTab === 'children' ? 'default' : 'outline'}
                onClick={() => setActiveTab('children')}
              >
                👨‍👩‍👧‍👦 Children ({children.length})
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Content based on active tab */}
        {activeTab === 'overview' && (
          <>
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
                    <p className="text-sm">💰 ${mockData.family.weeklyAllowance.toFixed(2)}/week budget</p>
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
                      onClick={() => setActiveTab('chores')}
                    >
                      Add New Chore
                    </Button>
                    <Button 
                      size="sm" 
                      className="w-full" 
                      variant="outline"
                      onClick={handleAddChild}
                    >
                      Add Child Account
                    </Button>
                    <Button 
                      size="sm" 
                      className="w-full" 
                      variant="outline"
                      onClick={() => setActiveTab('schedule')}
                    >
                      View Schedule
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
          </>
        )}

        {activeTab === 'chores' && (
          <ChoreManagement
            familyId="demo-family"
            children={children}
            onAddChild={handleAddChild}
          />
        )}

        {activeTab === 'schedule' && (
          <ScheduleView
            children={children}
            chores={chores}
            selectedChild={selectedChild}
            onChildSelect={setSelectedChild}
          />
        )}

        {activeTab === 'children' && (
          <div className="space-y-6">
            {/* Children Management */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl">Children Management</CardTitle>
                    <CardDescription>
                      Manage your family members and their settings
                    </CardDescription>
                  </div>
                  <Button onClick={handleAddChild} className="bg-blue-600 hover:bg-blue-700">
                    ➕ Add Child
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {children.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-lg">👨‍👩‍👧‍👦 No children added yet</p>
                    <p>Add your first child to get started!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {children.map(child => (
                      <Card key={child.id} className="border-2 hover:border-blue-200">
                        <CardHeader className="text-center">
                          <div className="text-4xl mb-2">🧒</div>
                          <CardTitle className="text-lg">{child.name}</CardTitle>
                          <CardDescription>
                            {child.age ? `Age: ${child.age}` : 'Age not set'}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm">
                            <p>📋 {chores.filter(c => c.assignedTo.includes(child.id)).length} chores assigned</p>
                            <p>💰 ${chores.filter(c => c.assignedTo.includes(child.id)).reduce((sum, c) => sum + c.reward, 0).toFixed(2)} potential weekly earnings</p>
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Button size="sm" variant="outline" className="flex-1">
                              ✏️ Edit
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1"
                              onClick={() => {
                                setSelectedChild(child.id)
                                setActiveTab('schedule')
                              }}
                            >
                              📅 Schedule
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

// Add Child Modal Component
interface AddChildModalProps {
  onSave: (childData: { name: string; age: number }) => void
  onCancel: () => void
}

function AddChildModal({ onSave, onCancel }: AddChildModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    age: 8
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return
    onSave(formData)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>👶 Add New Child</CardTitle>
          <CardDescription>
            Add a family member to your ChoreChart
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Child's Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Emma, Noah"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Age</label>
              <select
                value={formData.age}
                onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) }))}
                className="w-full p-2 border rounded-md"
              >
                {Array.from({ length: 15 }, (_, i) => i + 3).map(age => (
                  <option key={age} value={age}>{age} years old</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                ➕ Add Child
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                ❌ Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 