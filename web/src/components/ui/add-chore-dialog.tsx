"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface AddChoreDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (message: string) => void
  familyChildren: Array<{ id: string; name: string; email: string; }>
}

export function AddChoreDialog({ isOpen, onClose, onSuccess, familyChildren }: AddChoreDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reward: '',
    estimatedMinutes: '',
    frequency: 'once' as 'once' | 'daily' | 'weekly' | 'monthly',
    selectedDays: [] as number[],
    isRequired: false,
    assignedChildIds: [] as string[]
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDuration, setShowDuration] = useState(false)
  
  // Children data from parent component props
  const children = familyChildren || []

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const toggleChildAssignment = (childId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedChildIds: prev.assignedChildIds.includes(childId)
        ? prev.assignedChildIds.filter(id => id !== childId)
        : [...prev.assignedChildIds, childId]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title) {
      alert('Please enter a chore title')
      return
    }

    // Prepare data with proper defaults
    const submitData = {
      ...formData,
      reward: formData.reward ? parseFloat(formData.reward) : 0,
      estimatedMinutes: formData.estimatedMinutes ? parseInt(formData.estimatedMinutes) : 15
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/chores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      })

      const result = await response.json()

      if (response.ok) {
        onSuccess(result.message || 'Chore added successfully!')
        handleClose()
      } else {
        alert(result.error || 'Failed to add chore')
      }
    } catch (error) {
      console.error('Error adding chore:', error)
      alert('Failed to add chore. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      reward: '',
      estimatedMinutes: '',
      frequency: 'once',
      selectedDays: [],
      isRequired: false,
      assignedChildIds: []
    })
    setShowDuration(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white shadow-2xl">
        <CardHeader className="bg-white">
          <CardTitle className="text-xl text-gray-900">📋 Add New Chore</CardTitle>
          <CardDescription className="text-gray-600">
            Create a new chore for your family
          </CardDescription>
        </CardHeader>
        
        <CardContent className="bg-white">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Chore Title *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g., Clean bedroom, Take out trash"
                required
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Description (optional)
              </label>
              <Input
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Additional details about the chore"
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>

            {/* Reward and Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Reward ($) (optional)
                </label>
                <Input
                  type="number"
                  step="0.50"
                  min="0"
                  value={formData.reward}
                  onChange={(e) => handleInputChange('reward', e.target.value)}
                  placeholder="2.50"
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="showDuration"
                    checked={showDuration}
                    onChange={(e) => setShowDuration(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="showDuration" className="text-sm font-medium text-gray-900">
                    Set time duration (optional)
                  </label>
                </div>
                {showDuration && (
                  <Input
                    type="number"
                    min="1"
                    value={formData.estimatedMinutes}
                    onChange={(e) => handleInputChange('estimatedMinutes', e.target.value)}
                    placeholder="15"
                    className="bg-white border-gray-300 text-gray-900"
                  />
                )}
              </div>
            </div>

            {/* Frequency */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Frequency
              </label>
              <Select
                value={formData.frequency}
                onValueChange={(value) => handleInputChange('frequency', value)}
              >
                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-white border border-gray-200 shadow-lg">
                  <SelectItem value="once">Once</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Day Selection */}
            {(formData.frequency === 'daily' || formData.frequency === 'weekly') && (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  {formData.frequency === 'daily' ? 'Select Days (click multiple days)' : 'Select Day (click one day)'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                    <Badge
                      key={day}
                      variant={formData.selectedDays.includes(index) ? "default" : "outline"}
                      className="cursor-pointer hover:bg-blue-100 transition-colors select-none"
                      onClick={() => {
                        const newDays = formData.selectedDays.includes(index)
                          ? formData.selectedDays.filter(d => d !== index)
                          : formData.frequency === 'weekly' 
                            ? [index] // For weekly, only allow one day
                            : [...formData.selectedDays, index] // For daily, allow multiple
                        handleInputChange('selectedDays', newDays)
                      }}
                    >
                      {day}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {formData.frequency === 'daily' 
                    ? '✨ Click multiple days! (e.g., Mon, Wed, Fri for a daily chore done 3x/week)' 
                    : 'Choose which day of the week this chore should be done'
                  }
                </p>
              </div>
            )}

            {/* Required Toggle */}
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isRequired}
                  onChange={(e) => handleInputChange('isRequired', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-900">
                  ⚠️ Required chore (must be completed)
                </span>
              </label>
            </div>

            {/* Assign to Children */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Assign to Children
              </label>
              <div className="flex flex-wrap gap-2">
                {children.map((child: { id: string; name: string }) => (
                  <Badge
                    key={child.id}
                    variant={formData.assignedChildIds.includes(child.id) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-blue-100 transition-colors"
                    onClick={() => toggleChildAssignment(child.id)}
                  >
                    {child.name}
                    {formData.assignedChildIds.includes(child.id) && ' ✓'}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Click to assign/unassign. Leave empty to assign to all children.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding...
                  </>
                ) : (
                  '📋 Add Chore'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}