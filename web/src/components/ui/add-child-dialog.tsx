"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

interface AddChildDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (message: string) => void
}

export function AddChildDialog({ isOpen, onClose, onSuccess }: AddChildDialogProps) {
  const [formData, setFormData] = useState({
    childName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear error when user starts typing
    if (error) setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // Validation
    if (!formData.childName || !formData.email || !formData.password) {
      setError('Please fill in all required fields')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/add-child', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          childName: formData.childName,
          email: formData.email,
          password: formData.password
        })
      })

      const result = await response.json()

      if (response.ok) {
        onSuccess(result.message || `Child account created for ${formData.childName}!`)
        handleClose()
      } else {
        setError(result.error || 'Failed to create child account')
      }
    } catch (error) {
      console.error('Error creating child account:', error)
      setError('Failed to create child account. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({
      childName: '',
      email: '',
      password: '',
      confirmPassword: ''
    })
    setError('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white">
        <CardHeader className="bg-white">
          <CardTitle className="text-xl text-gray-900">👶 Add Child Account</CardTitle>
          <CardDescription className="text-gray-600">
            Create a new account for your child
          </CardDescription>
        </CardHeader>
        
        <CardContent className="bg-white">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Child Name */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Child's Name *
              </label>
              <Input
                value={formData.childName}
                onChange={(e) => handleInputChange('childName', e.target.value)}
                placeholder="e.g., Emma, Noah, Alex"
                required
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Email Address *
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="child@example.com"
                required
                className="bg-white border-gray-300 text-gray-900"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your child will use this email to sign in
              </p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Password *
              </label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="At least 6 characters"
                required
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Confirm Password *
              </label>
              <Input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="Re-enter password"
                required
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>

            {/* Info Box */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-700 text-sm">
                <strong>💡 Tips:</strong>
              </p>
              <ul className="text-blue-600 text-sm mt-1 space-y-1">
                <li>• Your child will be added to your current family</li>
                <li>• They can submit chores and chat with Chorbie</li>
                <li>• You'll need to approve their chore submissions</li>
              </ul>
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
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  '👶 Add Child'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 