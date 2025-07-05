import React, { useState } from 'react'
import { Button } from './button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Badge } from './badge'
import { Input } from './input'

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
  customDays?: number[]
  reward: number
  estimatedMinutes: number
  category: string
  isRequired: boolean
  scheduledDays?: number[]
  createdBy: string
  createdAt: string
  isActive: boolean
}

interface Expectation {
  id: string
  title: string
  description?: string
  assignedTo: string[]
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly'
  deduction: number
  category: string
  scheduledDays?: number[]
  createdBy: string
  createdAt: string
  isActive: boolean
}

interface ChoreManagementProps {
  familyId: string
  children: Child[]
  onAddChild: () => void
}

export function ChoreManagement({ familyId, children, onAddChild }: ChoreManagementProps) {
  const [activeTab, setActiveTab] = useState<'chores' | 'expectations' | 'rewards'>('chores')
  
  const [chores, setChores] = useState<Chore[]>([
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
    }
  ])

  const [expectations, setExpectations] = useState<Expectation[]>([
    {
      id: 'exp1',
      title: 'Keep room reasonably tidy',
      description: 'Room should be neat with clothes put away',
      assignedTo: ['child-1'],
      frequency: 'daily',
      deduction: 1.00,
      category: 'bedroom',
      createdBy: 'parent-1',
      createdAt: new Date().toISOString(),
      isActive: true
    },
    {
      id: 'exp2',
      title: 'Put dishes in dishwasher after eating',
      description: 'Clean up after yourself in kitchen',
      assignedTo: ['child-1', 'child-2'],
      frequency: 'daily',
      deduction: 0.50,
      category: 'kitchen',
      createdBy: 'parent-1',
      createdAt: new Date().toISOString(),
      isActive: true
    },
    {
      id: 'exp3',
      title: 'Be respectful to siblings',
      description: 'No fighting, name-calling, or mean behavior',
      assignedTo: ['child-1', 'child-2'],
      frequency: 'daily',
      deduction: 2.00,
      category: 'behavior',
      createdBy: 'parent-1',
      createdAt: new Date().toISOString(),
      isActive: true
    },
  ])
  
  const [showAddChore, setShowAddChore] = useState(false)
  const [showAddExpectation, setShowAddExpectation] = useState(false)
  const [editingChore, setEditingChore] = useState<Chore | null>(null)
  const [editingExpectation, setEditingExpectation] = useState<Expectation | null>(null)
  const [selectedChild, setSelectedChild] = useState<string>('')
  const [rewardMode, setRewardMode] = useState<'individual' | 'total'>('individual')
  const [totalAllowance, setTotalAllowance] = useState(50.00)
  
  // Calculate total weekly rewards
  const totalWeeklyRewards = chores
    .filter(chore => chore.isActive)
    .reduce((total, chore) => {
      const multiplier = chore.frequency === 'daily' ? 7 : 
                       chore.frequency === 'weekly' ? 1 :
                       chore.frequency === 'biweekly' ? 0.5 : 1
      return total + (chore.reward * multiplier)
    }, 0)

  // Calculate total weekly deductions
  const totalWeeklyDeductions = expectations
    .filter(expectation => expectation.isActive)
    .reduce((total, expectation) => {
      const multiplier = expectation.frequency === 'daily' ? 7 : 
                       expectation.frequency === 'weekly' ? 1 :
                       expectation.frequency === 'biweekly' ? 0.5 : 1
      return total + (expectation.deduction * multiplier)
    }, 0)

  const filteredChores = chores.filter(chore => 
    chore.isActive && 
    (selectedChild === '' || chore.assignedTo.includes(selectedChild))
  )

  const filteredExpectations = expectations.filter(expectation => 
    expectation.isActive && 
    (selectedChild === '' || expectation.assignedTo.includes(selectedChild))
  )

  const handleAddChore = () => {
    setEditingChore(null)
    setShowAddChore(true)
  }

  const handleAddExpectation = () => {
    setEditingExpectation(null)
    setShowAddExpectation(true)
  }

  const handleEditChore = (chore: Chore) => {
    setEditingChore(chore)
    setShowAddChore(true)
  }

  const handleEditExpectation = (expectation: Expectation) => {
    setEditingExpectation(expectation)
    setShowAddExpectation(true)
  }

  const handleDeleteChore = (choreId: string) => {
    if (confirm('Are you sure you want to delete this chore?')) {
      setChores(prev => prev.filter(c => c.id !== choreId))
    }
  }

  const handleDeleteExpectation = (expectationId: string) => {
    if (confirm('Are you sure you want to delete this expectation?')) {
      setExpectations(prev => prev.filter(e => e.id !== expectationId))
    }
  }

  const handleMarkExpectationNotMet = (expectation: Expectation, childId: string) => {
    const child = children.find(c => c.id === childId)
    if (confirm(`Deduct $${expectation.deduction.toFixed(2)} from ${child?.name} for not meeting "${expectation.title}"?`)) {
      console.log(`Deducted $${expectation.deduction} from ${child?.name} for ${expectation.title}`)
      alert(`$${expectation.deduction.toFixed(2)} deducted from ${child?.name}'s earnings.`)
    }
  }

  const handleSaveChore = (choreData: Partial<Chore>) => {
    if (editingChore) {
      setChores(prev => prev.map(c => 
        c.id === editingChore.id ? { ...c, ...choreData } : c
      ))
    } else {
      const newChore: Chore = {
        id: `chore-${Date.now()}`,
        title: choreData.title || '',
        description: choreData.description || '',
        assignedTo: choreData.assignedTo || [],
        frequency: choreData.frequency || 'weekly',
        reward: choreData.reward || 0,
        estimatedMinutes: choreData.estimatedMinutes || 15,
        category: choreData.category || 'general',
        isRequired: choreData.isRequired || false,
        scheduledDays: choreData.scheduledDays || [],
        createdBy: 'parent-1',
        createdAt: new Date().toISOString(),
        isActive: true
      }
      setChores(prev => [...prev, newChore])
    }
    setShowAddChore(false)
    setEditingChore(null)
  }

  const handleSaveExpectation = (expectationData: Partial<Expectation>) => {
    if (editingExpectation) {
      setExpectations(prev => prev.map(e => 
        e.id === editingExpectation.id ? { ...e, ...expectationData } : e
      ))
    } else {
      const newExpectation: Expectation = {
        id: `exp-${Date.now()}`,
        title: expectationData.title || '',
        description: expectationData.description || '',
        assignedTo: expectationData.assignedTo || [],
        frequency: expectationData.frequency || 'daily',
        deduction: expectationData.deduction || 1,
        category: expectationData.category || 'general',
        scheduledDays: expectationData.scheduledDays || [],
        createdBy: 'parent-1',
        createdAt: new Date().toISOString(),
        isActive: true
      }
      setExpectations(prev => [...prev, newExpectation])
    }
    setShowAddExpectation(false)
    setEditingExpectation(null)
  }

  // Auto-calculate rewards based on total allowance
  const redistributeRewards = () => {
    if (rewardMode === 'total' && chores.length > 0) {
      const activeChores = chores.filter(c => c.isActive)
      const rewardPerChore = totalAllowance / activeChores.length
      
      setChores(prev => prev.map(chore => 
        chore.isActive ? { ...chore, reward: parseFloat(rewardPerChore.toFixed(2)) } : chore
      ))
    }
  }

  const getFrequencyDisplay = (frequency: string) => {
    const displays = {
      daily: '📅 Daily',
      weekly: '📆 Weekly', 
      biweekly: '🗓️ Bi-weekly',
      monthly: '🗓️ Monthly',
      custom: '⚙️ Custom',
      once: '🔄 One-time'
    }
    return displays[frequency as keyof typeof displays] || frequency
  }

  const getCategoryEmoji = (category: string) => {
    const emojis = {
      bedroom: '🛏️',
      kitchen: '🍽️',
      bathroom: '🚿',
      household: '🏠',
      outdoor: '🌳',
      pets: '🐕',
      behavior: '🤝',
      general: '📋'
    }
    return emojis[category as keyof typeof emojis] || '📋'
  }

  if (showAddChore) {
    return (
      <AddChoreModal
        chore={editingChore}
        children={children}
        onSave={handleSaveChore}
        onCancel={() => {
          setShowAddChore(false)
          setEditingChore(null)
        }}
      />
    )
  }

  if (showAddExpectation) {
    return (
      <AddExpectationModal
        expectation={editingExpectation}
        children={children}
        onSave={handleSaveExpectation}
        onCancel={() => {
          setShowAddExpectation(false)
          setEditingExpectation(null)
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">📋 Family Management</CardTitle>
              <CardDescription>
                Manage chores, expectations, and rewards for your family
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={activeTab === 'chores' ? handleAddChore : activeTab === 'expectations' ? handleAddExpectation : () => {}}
                disabled={activeTab === 'rewards'}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                ➕ Add {activeTab === 'chores' ? 'Chore' : activeTab === 'expectations' ? 'Expectation' : 'Item'}
              </Button>
              <Button variant="outline" onClick={onAddChild}>
                👶 Add Child
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={activeTab === 'chores' ? 'default' : 'outline'}
              onClick={() => setActiveTab('chores')}
            >
              📋 Chores
            </Button>
            <Button
              variant={activeTab === 'expectations' ? 'default' : 'outline'}
              onClick={() => setActiveTab('expectations')}
            >
              ⭐ Expectations
            </Button>
            <Button
              variant={activeTab === 'rewards' ? 'default' : 'outline'}
              onClick={() => setActiveTab('rewards')}
            >
              💰 Rewards
            </Button>
          </div>

          {/* Tab Content */}
          {activeTab === 'rewards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Reward Mode Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Reward Mode</label>
                <div className="flex gap-2">
                  <Button
                    variant={rewardMode === 'individual' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setRewardMode('individual')}
                  >
                    💰 Individual Amounts
                  </Button>
                  <Button
                    variant={rewardMode === 'total' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setRewardMode('total')}
                  >
                    🎯 Total Allowance
                  </Button>
                </div>
              </div>

              {/* Total Allowance Control */}
              {rewardMode === 'total' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Weekly Allowance Budget</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={totalAllowance}
                      onChange={(e) => setTotalAllowance(parseFloat(e.target.value) || 0)}
                      className="w-24"
                      step="0.01"
                    />
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={redistributeRewards}
                    >
                      📊 Auto-Distribute
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600">
                    Current total: ${totalWeeklyRewards.toFixed(2)}/week
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Children Filter */}
      {children.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Filter by Child</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedChild === '' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedChild('')}
              >
                👨‍👩‍👧‍👦 All Children
              </Button>
              {children.map(child => (
                <Button
                  key={child.id}
                  variant={selectedChild === child.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedChild(child.id)}
                >
                  🧒 {child.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content Based on Active Tab */}
      {activeTab === 'chores' && (
        <Card>
          <CardHeader>
            <CardTitle>Current Chores ({filteredChores.length})</CardTitle>
            <CardDescription>
              Reward-based tasks that earn money when completed
              {rewardMode === 'total' && (
                <span className="block text-blue-600 mt-1">
                  Total weekly budget: ${totalWeeklyRewards.toFixed(2)} / ${totalAllowance.toFixed(2)}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredChores.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-lg">📋 No chores found</p>
                <p>
                  {selectedChild === '' 
                    ? 'Add your first chore to get started!'
                    : `No chores assigned to ${children.find(c => c.id === selectedChild)?.name}`
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredChores.map(chore => (
                  <div 
                    key={chore.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{getCategoryEmoji(chore.category)}</span>
                        <h3 className="font-medium">{chore.title}</h3>
                        {chore.isRequired && (
                          <Badge variant="destructive" className="text-xs">Required</Badge>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {getFrequencyDisplay(chore.frequency)}
                        </Badge>
                      </div>
                      {chore.description && (
                        <p className="text-sm text-gray-600 mb-1">{chore.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>💰 ${chore.reward}</span>
                        <span>⏱️ {chore.estimatedMinutes} min</span>
                        <span>👤 {chore.assignedTo.length} assigned</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditChore(chore)}
                      >
                        ✏️ Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteChore(chore.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        🗑️ Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'expectations' && (
        <Card>
          <CardHeader>
            <CardTitle>Family Expectations ({filteredExpectations.length})</CardTitle>
            <CardDescription>
              Basic standards that are expected without reward. Money is deducted when not met.
              <span className="block text-red-600 mt-1">
                Potential weekly deductions: ${totalWeeklyDeductions.toFixed(2)}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredExpectations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-lg">⭐ No expectations found</p>
                <p>
                  {selectedChild === '' 
                    ? 'Add your first expectation to set standards!'
                    : `No expectations set for ${children.find(c => c.id === selectedChild)?.name}`
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredExpectations.map(expectation => (
                  <div 
                    key={expectation.id}
                    className="border rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{getCategoryEmoji(expectation.category)}</span>
                          <h3 className="font-medium">{expectation.title}</h3>
                          <Badge variant="outline" className="text-xs">
                            {getFrequencyDisplay(expectation.frequency)}
                          </Badge>
                          <Badge variant="destructive" className="text-xs">
                            -${expectation.deduction}
                          </Badge>
                        </div>
                        {expectation.description && (
                          <p className="text-sm text-gray-600 mb-2">{expectation.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditExpectation(expectation)}
                        >
                          ✏️ Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteExpectation(expectation.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          🗑️ Delete
                        </Button>
                      </div>
                    </div>
                    
                    {/* Assigned Children & Mark Not Met Actions */}
                    <div className="bg-gray-50 rounded-md p-3">
                      <p className="text-xs font-medium text-gray-600 mb-2">Assigned to:</p>
                      <div className="space-y-2">
                        {expectation.assignedTo.map(childId => {
                          const child = children.find(c => c.id === childId)
                          return child ? (
                            <div key={childId} className="flex items-center justify-between">
                              <span className="text-sm">{child.name}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkExpectationNotMet(expectation, childId)}
                                className="text-red-600 hover:bg-red-50"
                              >
                                Mark Not Met (-${expectation.deduction})
                              </Button>
                            </div>
                          ) : null
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'rewards' && (
        <Card>
          <CardHeader>
            <CardTitle>Financial Overview</CardTitle>
            <CardDescription>
              Track potential earnings and deductions across the family
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-800 mb-2">💰 Weekly Earnings Potential</h3>
                <p className="text-2xl font-bold text-green-600">${totalWeeklyRewards.toFixed(2)}</p>
                <p className="text-sm text-green-600">{chores.filter(c => c.isActive).length} active chores</p>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-medium text-red-800 mb-2">⚠️ Weekly Deduction Risk</h3>
                <p className="text-2xl font-bold text-red-600">-${totalWeeklyDeductions.toFixed(2)}</p>
                <p className="text-sm text-red-600">{expectations.filter(e => e.isActive).length} active expectations</p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-800 mb-2">📊 Net Potential</h3>
                <p className="text-2xl font-bold text-blue-600">
                  ${(totalWeeklyRewards - totalWeeklyDeductions).toFixed(2)}
                </p>
                <p className="text-sm text-blue-600">Best case scenario</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Add Chore Modal Component
interface AddChoreModalProps {
  chore?: Chore | null
  children: Child[]
  onSave: (chore: Partial<Chore>) => void
  onCancel: () => void
}

function AddChoreModal({ chore, children, onSave, onCancel }: AddChoreModalProps) {
  const [formData, setFormData] = useState({
    title: chore?.title || '',
    description: chore?.description || '',
    assignedTo: chore?.assignedTo || [],
    frequency: chore?.frequency || 'weekly',
    reward: chore?.reward || 5.00,
    estimatedMinutes: chore?.estimatedMinutes || 15,
    category: chore?.category || 'general',
    isRequired: chore?.isRequired || false,
    scheduledDays: chore?.scheduledDays || []
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return
    onSave(formData)
  }

  const toggleAssignedChild = (childId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(childId)
        ? prev.assignedTo.filter(id => id !== childId)
        : [...prev.assignedTo, childId]
    }))
  }

  const weekDays = [
    { id: 0, name: 'Sunday', short: 'Sun' },
    { id: 1, name: 'Monday', short: 'Mon' },
    { id: 2, name: 'Tuesday', short: 'Tue' },
    { id: 3, name: 'Wednesday', short: 'Wed' },
    { id: 4, name: 'Thursday', short: 'Thu' },
    { id: 5, name: 'Friday', short: 'Fri' },
    { id: 6, name: 'Saturday', short: 'Sat' }
  ]

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {chore ? '✏️ Edit Chore' : '➕ Add New Chore'}
        </CardTitle>
        <CardDescription>
          Set up chore details, schedule, and rewards
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Chore Name *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Make bed, Clean room"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="bedroom">🛏️ Bedroom</option>
                <option value="kitchen">🍽️ Kitchen</option>
                <option value="bathroom">🚿 Bathroom</option>
                <option value="household">🏠 Household</option>
                <option value="outdoor">🌳 Outdoor</option>
                <option value="pets">🐕 Pets</option>
                <option value="general">📋 General</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Optional details about how to complete this chore"
              className="w-full p-2 border rounded-md h-20 resize-none"
            />
          </div>

          {/* Assignment */}
          <div>
            <label className="block text-sm font-medium mb-2">Assign to Children</label>
            <div className="flex gap-2 flex-wrap">
              {children.map(child => (
                <Button
                  key={child.id}
                  type="button"
                  variant={formData.assignedTo.includes(child.id) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleAssignedChild(child.id)}
                >
                  🧒 {child.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Frequency & Schedule */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Frequency</label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  frequency: e.target.value as Chore['frequency']
                }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="daily">📅 Daily</option>
                <option value="weekly">📆 Weekly</option>
                <option value="biweekly">🗓️ Every 2 weeks</option>
                <option value="monthly">🗓️ Monthly</option>
                <option value="once">🔄 One-time only</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Estimated Time</label>
              <select
                value={formData.estimatedMinutes}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  estimatedMinutes: parseInt(e.target.value)
                }))}
                className="w-full p-2 border rounded-md"
              >
                <option value={5}>⏱️ 5 minutes</option>
                <option value={10}>⏱️ 10 minutes</option>
                <option value={15}>⏱️ 15 minutes</option>
                <option value={30}>⏱️ 30 minutes</option>
                <option value={45}>⏱️ 45 minutes</option>
                <option value={60}>⏱️ 1 hour</option>
                <option value={90}>⏱️ 1.5 hours</option>
                <option value={120}>⏱️ 2 hours</option>
              </select>
            </div>
          </div>

          {/* Weekly Schedule */}
          {(formData.frequency === 'weekly' || formData.frequency === 'daily') && (
            <div>
              <label className="block text-sm font-medium mb-2">
                {formData.frequency === 'daily' ? 'Which days?' : 'Which day?'}
              </label>
              <div className="flex gap-1 flex-wrap">
                {weekDays.map(day => (
                  <Button
                    key={day.id}
                    type="button"
                    variant={formData.scheduledDays.includes(day.id) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      if (formData.frequency === 'weekly') {
                        setFormData(prev => ({ ...prev, scheduledDays: [day.id] }))
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          scheduledDays: prev.scheduledDays.includes(day.id)
                            ? prev.scheduledDays.filter(d => d !== day.id)
                            : [...prev.scheduledDays, day.id]
                        }))
                      }
                    }}
                    className="text-xs"
                  >
                    {day.short}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Reward & Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Reward Amount</label>
              <div className="relative">
                <span className="absolute left-2 top-2 text-gray-500">$</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.reward}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    reward: parseFloat(e.target.value) || 0
                  }))}
                  className="pl-6"
                  placeholder="5.00"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2 mt-6">
              <input
                type="checkbox"
                id="required"
                checked={formData.isRequired}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  isRequired: e.target.checked
                }))}
                className="rounded"
              />
              <label htmlFor="required" className="text-sm">
                ⚠️ Required chore (must be completed)
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              {chore ? '💾 Update Chore' : '➕ Add Chore'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              ❌ Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// Add Expectation Modal Component
interface AddExpectationModalProps {
  expectation?: Expectation | null
  children: Child[]
  onSave: (expectation: Partial<Expectation>) => void
  onCancel: () => void
}

function AddExpectationModal({ expectation, children, onSave, onCancel }: AddExpectationModalProps) {
  const [formData, setFormData] = useState({
    title: expectation?.title || '',
    description: expectation?.description || '',
    assignedTo: expectation?.assignedTo || [],
    frequency: expectation?.frequency || 'daily',
    deduction: expectation?.deduction || 1,
    category: expectation?.category || 'general',
    scheduledDays: expectation?.scheduledDays || []
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return
    onSave(formData)
  }

  const toggleAssignedChild = (childId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(childId)
        ? prev.assignedTo.filter(id => id !== childId)
        : [...prev.assignedTo, childId]
    }))
  }

  const weekDays = [
    { id: 0, name: 'Sunday', short: 'Sun' },
    { id: 1, name: 'Monday', short: 'Mon' },
    { id: 2, name: 'Tuesday', short: 'Tue' },
    { id: 3, name: 'Wednesday', short: 'Wed' },
    { id: 4, name: 'Thursday', short: 'Thu' },
    { id: 5, name: 'Friday', short: 'Fri' },
    { id: 6, name: 'Saturday', short: 'Sat' }
  ]

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {expectation ? '✏️ Edit Expectation' : '➕ Add New Expectation'}
        </CardTitle>
        <CardDescription>
          Set up expectation details and standards
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Expectation Name *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Keep room tidy, Put dishes in dishwasher"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="bedroom">🛏️ Bedroom</option>
                <option value="kitchen">🍽️ Kitchen</option>
                <option value="bathroom">🚿 Bathroom</option>
                <option value="household">🏠 Household</option>
                <option value="outdoor">🌳 Outdoor</option>
                <option value="pets">🐕 Pets</option>
                <option value="behavior">🤝 Behavior</option>
                <option value="general">📋 General</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Optional details about the expectation"
              className="w-full p-2 border rounded-md h-20 resize-none"
            />
          </div>

          {/* Assignment */}
          <div>
            <label className="block text-sm font-medium mb-2">Assign to Children</label>
            <div className="flex gap-2 flex-wrap">
              {children.map(child => (
                <Button
                  key={child.id}
                  type="button"
                  variant={formData.assignedTo.includes(child.id) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleAssignedChild(child.id)}
                >
                  🧒 {child.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Frequency & Schedule */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Frequency</label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  frequency: e.target.value as Expectation['frequency']
                }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="daily">📅 Daily</option>
                <option value="weekly">📆 Weekly</option>
                <option value="biweekly">🗓️ Every 2 weeks</option>
                <option value="monthly">��️ Monthly</option>
              </select>
            </div>
          </div>

          {/* Weekly Schedule */}
          {(formData.frequency === 'weekly' || formData.frequency === 'daily') && (
            <div>
              <label className="block text-sm font-medium mb-2">
                {formData.frequency === 'daily' ? 'Which days?' : 'Which day?'}
              </label>
              <div className="flex gap-1 flex-wrap">
                {weekDays.map(day => (
                  <Button
                    key={day.id}
                    type="button"
                    variant={formData.scheduledDays.includes(day.id) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      if (formData.frequency === 'weekly') {
                        setFormData(prev => ({ ...prev, scheduledDays: [day.id] }))
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          scheduledDays: prev.scheduledDays.includes(day.id)
                            ? prev.scheduledDays.filter(d => d !== day.id)
                            : [...prev.scheduledDays, day.id]
                        }))
                      }
                    }}
                    className="text-xs"
                  >
                    {day.short}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Deduction */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Deduction Amount</label>
              <div className="relative">
                <span className="absolute left-2 top-2 text-gray-500">$</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.deduction}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    deduction: parseFloat(e.target.value) || 0
                  }))}
                  className="pl-6"
                  placeholder="1.00"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              {expectation ? '💾 Update Expectation' : '➕ Add Expectation'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              ❌ Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 