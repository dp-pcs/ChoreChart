"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface Parent {
  id: string
  name: string
  email: string
}

interface AddPaymentSourceDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (message: string) => void
  parents: Parent[]
  currentUserId: string
}

export function AddPaymentSourceDialog({ 
  isOpen, 
  onClose, 
  onSuccess, 
  parents, 
  currentUserId 
}: AddPaymentSourceDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    frequency: 'WEEKLY' as 'WEEKLY' | 'MONTHLY' | 'ONE_TIME',
    type: 'ALLOWANCE' as 'ALLOWANCE' | 'BONUS_FUND' | 'GIFT_MONEY' | 'CHORE_FUND' | 'OTHER',
    managedBy: currentUserId
  })

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    
    try {
      // Simulate API call - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      onSuccess(`✅ Payment source "${formData.name}" added successfully!`)
      handleClose()
    } catch (error) {
      console.error('Failed to add payment source:', error)
      alert('Failed to add payment source. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      amount: '',
      frequency: 'WEEKLY',
      type: 'ALLOWANCE',
      managedBy: currentUserId
    })
    onClose()
  }

  const paymentTypes = [
    { value: 'ALLOWANCE', label: 'Weekly Allowance' },
    { value: 'BONUS_FUND', label: 'Bonus Fund' },
    { value: 'GIFT_MONEY', label: 'Gift Money' },
    { value: 'CHORE_FUND', label: 'Chore Fund' },
    { value: 'OTHER', label: 'Other' }
  ]

  const frequencies = [
    { value: 'WEEKLY', label: 'Weekly' },
    { value: 'MONTHLY', label: 'Monthly' },
    { value: 'ONE_TIME', label: 'One-time' }
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="text-xl">Add Payment Source</CardTitle>
          <CardDescription>
            Create a new funding source for your family's chore rewards.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Mom's Allowance Fund, Bonus Rewards"
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
                placeholder="Optional description of this payment source"
              />
            </div>

            {/* Amount and Frequency */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount ($) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frequency *
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) => handleInputChange('frequency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {frequencies.map(freq => (
                    <option key={freq.value} value={freq.value}>
                      {freq.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <div className="flex flex-wrap gap-2">
                {paymentTypes.map(type => (
                  <Badge
                    key={type.value}
                    variant={formData.type === type.value ? "default" : "outline"}
                    className="cursor-pointer hover:bg-blue-100 transition-colors"
                    onClick={() => handleInputChange('type', type.value)}
                  >
                    {type.label}
                    {formData.type === type.value && ' ✓'}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Managed By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Managed By *
              </label>
              <select
                value={formData.managedBy}
                onChange={(e) => handleInputChange('managedBy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {parents.map(parent => (
                  <option key={parent.id} value={parent.id}>
                    {parent.name}
                  </option>
                ))}
              </select>
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
                disabled={isSubmitting || !formData.name.trim() || !formData.amount || parseFloat(formData.amount) <= 0}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding...
                  </>
                ) : (
                  'Add Payment Source'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}