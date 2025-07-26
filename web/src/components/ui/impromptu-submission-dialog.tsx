'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ImpromptuSubmissionDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (message: string) => void
}

export function ImpromptuSubmissionDialog({ isOpen, onClose, onSuccess }: ImpromptuSubmissionDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      alert('Please enter a title for what you did')
      return
    }

    if (!formData.description.trim()) {
      alert('Please describe what you did')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/impromptu-submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (response.ok) {
        onSuccess(result.message || 'Submission sent successfully!')
        handleClose()
      } else {
        alert(result.error || 'Failed to submit. Please try again.')
      }
    } catch (error) {
      console.error('Error submitting:', error)
      alert('Failed to submit. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({
      title: '',
      description: ''
    })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-xl text-gray-900">✨ Tell Your Parents!</CardTitle>
          <CardDescription className="text-gray-600">
            Did you do something helpful, kind, or awesome? Let them know!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                What did you do? ✨
              </label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g., Helped dad with dishes, Made bed without being asked"
                className="bg-white border-gray-300 text-gray-900"
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">
                Give it a short, clear title
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Tell us more! 📝
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe what you did, when you did it, and why you think it's worth recognizing..."
                className="w-full p-3 border border-gray-300 rounded-md bg-white text-gray-900 h-24 resize-none"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {500 - formData.description.length} characters left
              </p>
            </div>

            {/* Examples section */}
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm font-medium text-blue-900 mb-2">💡 Examples:</p>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• "I helped my little sister tie her shoes"</li>
                <li>• "I cleaned up toys without being asked"</li>
                <li>• "I was kind to a new kid at school"</li>
                <li>• "I helped carry groceries from the car"</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2 pt-4">
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
                disabled={isSubmitting || !formData.title.trim() || !formData.description.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  '🚀 Send to Parents'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 