"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface AllowanceSettingsProps {
  familyId: string
}

interface ChoreRecommendation {
  choreId: string
  title: string
  currentPoints: number
  recommendedPoints: number
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  weeklyOccurrences: number
  assigneeCount: number
}

interface AllowanceData {
  settings: {
    baseAllowance: number
    stretchAllowance: number
    totalBudget: number
    allowBudgetOverrun: boolean
    pointsToMoneyRate: number
  }
  analysis: {
    totalWeeklyPotential: number
    budgetDifference: number
    isOverBudget: boolean
  }
  chores: any[]
}

export function AllowanceSettings({ familyId }: AllowanceSettingsProps) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AllowanceData | null>(null)
  const [recommendations, setRecommendations] = useState<ChoreRecommendation[]>([])
  const [baseAllowance, setBaseAllowance] = useState(0)
  const [stretchAllowance, setStretchAllowance] = useState(0)
  const [allowBudgetOverrun, setAllowBudgetOverrun] = useState(true)
  const [showAllowanceExplanation, setShowAllowanceExplanation] = useState(false)
  const [choreEdits, setChoreEdits] = useState<Record<string, { points: number, priority: string }>>({})
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const fetchAllowanceData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/family-allowance')
      const result = await response.json()
      
      if (result.success) {
        setData(result)
        setBaseAllowance(result.settings.baseAllowance)
        setStretchAllowance(result.settings.stretchAllowance)
        setAllowBudgetOverrun(result.settings.allowBudgetOverrun)
        
        // Initialize chore edits with current values
        const edits: Record<string, { points: number, priority: string }> = {}
        result.chores.forEach((chore: any) => {
          edits[chore.id] = {
            points: Number(chore.points),
            priority: chore.priority || 'MEDIUM'
          }
        })
        setChoreEdits(edits)
      }
    } catch (error) {
      console.error('Failed to fetch allowance data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAutoCalculate = async () => {
    try {
      const response = await fetch('/api/family-allowance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseAllowance, stretchAllowance })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setRecommendations(result.recommendations)
        setMessage({
          type: 'success',
          text: `Auto-calculated values based on $${stretchAllowance} stretch budget across ${result.analysis.totalChoreInstances} weekly chore instances`
        })
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to calculate recommendations' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to calculate recommendations' })
    }
  }

  const handleApplyRecommendations = () => {
    const updates: Record<string, { points: number, priority: string }> = { ...choreEdits }
    recommendations.forEach(rec => {
      updates[rec.choreId] = {
        points: rec.recommendedPoints,
        priority: rec.priority
      }
    })
    setChoreEdits(updates)
    setMessage({ type: 'success', text: 'Applied recommendations - remember to save!' })
  }

  const handleSave = async () => {
    try {
      const choreUpdates = Object.entries(choreEdits).map(([choreId, edit]) => ({
        choreId,
        points: edit.points,
        priority: edit.priority
      }))

      const response = await fetch('/api/family-allowance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseAllowance,
          stretchAllowance,
          allowBudgetOverrun,
          choreUpdates
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Allowance settings saved successfully!' })
        await fetchAllowanceData() // Refresh data
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save settings' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' })
    }
  }

  const calculateCurrentTotal = () => {
    if (!data) return 0
    return data.chores.reduce((total, chore) => {
      const editedPoints = choreEdits[chore.id]?.points || Number(chore.points)
      let weeklyOccurrences = 1
      
      if (chore.frequency === 'DAILY') {
        weeklyOccurrences = chore.scheduledDays?.length || 1
      }
      
      return total + (editedPoints * weeklyOccurrences * chore.assignments.length)
    }, 0)
  }

  const totalBudget = baseAllowance + stretchAllowance
  const currentTotal = calculateCurrentTotal()
  const isOverStretchBudget = currentTotal > stretchAllowance

  useEffect(() => {
    fetchAllowanceData()
  }, [])

  if (loading) return <div className="p-4">Loading allowance settings...</div>

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* Budget Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Weekly Allowance Budget
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAllowanceExplanation(true)}
              className="h-6 w-6 p-0 rounded-full"
            >
              ?
            </Button>
          </CardTitle>
          <CardDescription>
            Set your child's guaranteed base allowance and stretch earnings from chores.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Base Allowance</label>
              <Input
                type="number"
                step="0.50"
                min="0"
                value={baseAllowance}
                onChange={(e) => setBaseAllowance(Number(e.target.value))}
                placeholder="$5.00"
              />
              <p className="text-xs text-gray-500 mt-1">Guaranteed money for being family member</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Chore Earnings Budget</label>
              <Input
                type="number"
                step="0.50"
                min="0"
                value={stretchAllowance}
                onChange={(e) => setStretchAllowance(Number(e.target.value))}
                placeholder="$5.00"
              />
              <p className="text-xs text-gray-500 mt-1">Available to earn through chores</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Maximum Weekly Total</label>
              <div className="text-2xl font-bold text-green-600">${totalBudget.toFixed(2)}</div>
              <p className="text-xs text-gray-500">Base + max chore earnings</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button onClick={handleAutoCalculate} variant="outline">
              🧮 Auto-Calculate Chore Values
            </Button>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={allowBudgetOverrun}
                onChange={(e) => setAllowBudgetOverrun(e.target.checked)}
              />
              <span className="text-sm">Allow earnings to exceed budget</span>
            </label>
          </div>

          {/* Budget Status */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <div className="text-sm text-blue-600 font-medium">Base Allowance (Guaranteed)</div>
                <div className="text-xl font-bold text-blue-700">
                  ${baseAllowance.toFixed(2)}
                </div>
                <div className="text-xs text-blue-600">Given regardless of chores</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="text-sm text-gray-600">Chore Earnings Potential</div>
                <div className={`text-xl font-bold ${isOverStretchBudget ? 'text-red-600' : 'text-green-600'}`}>
                  ${currentTotal.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">From completing all chores</div>
              </div>
              {isOverStretchBudget && (
                <Badge variant="destructive">
                  ${(currentTotal - stretchAllowance).toFixed(2)} over stretch budget
                </Badge>
              )}
              {!isOverStretchBudget && stretchAllowance > 0 && (
                <Badge variant="default">
                  ${(stretchAllowance - currentTotal).toFixed(2)} under stretch budget
                </Badge>
              )}
            </div>
            
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <div className="text-sm text-green-600 font-medium">Maximum Weekly Total</div>
                <div className="text-2xl font-bold text-green-700">
                  ${(baseAllowance + currentTotal).toFixed(2)}
                </div>
                <div className="text-xs text-green-600">Base + earned through chores</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>💡 Recommended Chore Values</CardTitle>
            <CardDescription>
              Based on your ${stretchAllowance} stretch budget, here are suggested point values
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recommendations.map(rec => (
                <div key={rec.choreId} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <div className="font-medium">{rec.title}</div>
                    <div className="text-sm text-gray-600">
                      {rec.weeklyOccurrences}x/week × {rec.assigneeCount} child(ren) = {rec.weeklyOccurrences * rec.assigneeCount} total instances
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">
                      {rec.recommendedPoints} pts
                    </div>
                    <Badge variant="outline">{rec.priority}</Badge>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={handleApplyRecommendations}>
                ✅ Apply All Recommendations
              </Button>
              <Button variant="outline" onClick={() => setRecommendations([])}>
                ❌ Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual Chore Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Chore Values</CardTitle>
          <CardDescription>
            Customize the point value and priority for each chore
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data?.chores.map(chore => (
              <div key={chore.id} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{chore.title}</div>
                  <div className="text-sm text-gray-600">
                    {chore.frequency} • {chore.scheduledDays?.length || 1} days/week • {chore.assignments.length} assignee(s)
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.25"
                    min="0"
                    value={choreEdits[chore.id]?.points || 0}
                    onChange={(e) => setChoreEdits(prev => ({
                      ...prev,
                      [chore.id]: { ...prev[chore.id], points: Number(e.target.value) }
                    }))}
                    className="w-20"
                  />
                  <span className="text-sm text-gray-500">pts</span>
                  
                  <Select
                    value={choreEdits[chore.id]?.priority || 'MEDIUM'}
                    onValueChange={(value) => setChoreEdits(prev => ({
                      ...prev,
                      [chore.id]: { ...prev[chore.id], priority: value }
                    }))}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 flex justify-end">
            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
              💾 Save All Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Allowance Explanation Dialog */}
      {showAllowanceExplanation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-bold mb-4">💰 Two Allowance Approaches</h3>
            <div className="space-y-4 text-sm">
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold text-blue-700">Base Allowance</h4>
                <p className="text-gray-600">
                  This is guaranteed money your child receives each week just for being part of the family. 
                  It's not tied to chores and helps teach basic money management.
                </p>
              </div>
              
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-semibold text-green-700">Chore Earnings Budget</h4>
                <p className="text-gray-600">
                  This is additional money your child can earn by completing chores. The chore values 
                  you set are compared against this amount, not the base allowance.
                </p>
              </div>
              
              <div className="bg-amber-50 p-3 rounded-lg">
                <p className="text-amber-800 text-xs">
                  <strong>Tip:</strong> Some families prefer to put everything in "Chore Earnings" and set 
                  Base Allowance to $0. Others like to provide a small base and use chores for extra earnings.
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setShowAllowanceExplanation(false)}>
                Got it!
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}