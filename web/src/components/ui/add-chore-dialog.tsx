"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface AddChoreDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (message: string) => void
}

export function AddChoreDialog({ isOpen, onClose, onSuccess }: AddChoreDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reward: '',
    estimatedMinutes: '',
    isRequired: false,
    assignedChildIds: [] as string[]
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Mock children data - in real app, this would come from props or API
  const mockChildren = [
    { id: 'child-1', name: 'Noah' },
    { id: 'child-2', name: 'Emma' }
  ]

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
    
    if (!formData.title || !formData.reward || !formData.estimatedMinutes) {
      alert('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/chores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
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
      isRequired: false,
      assignedChildIds: []
    })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="text-xl">Add New Chore</CardTitle>
          <CardDescription>
            Create a new chore for your family
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chore Title *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g., Clean bedroom, Take out trash"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <Input
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Additional details about the chore"
              />
            </div>

            {/* Reward and Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reward ($) *
                </label>
                <Input
                  type="number"
                  step="0.50"
                  min="0"
                  value={formData.reward}
                  onChange={(e) => handleInputChange('reward', e.target.value)}
                  placeholder="2.50"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time (min) *
                </label>
                <Input
                  type="number"
                  min="1"
                  value={formData.estimatedMinutes}
                  onChange={(e) => handleInputChange('estimatedMinutes', e.target.value)}
                  placeholder="15"
                  required
                />
              </div>
            </div>

            {/* Required Toggle */}
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isRequired}
                  onChange={(e) => handleInputChange('isRequired', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  Required chore (must be completed)
                </span>
              </label>
            </div>

            {/* Assign to Children */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign to Children
              </label>
              <div className="flex flex-wrap gap-2">
                {mockChildren.map(child => (
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
              <p className="text-xs text-gray-500 mt-1">
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
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding...
                  </>
                ) : (
                  'Add Chore'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}