'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ImpromptuSubmission {
  id: string
  title: string
  description: string
  submittedAt: string
  status: 'PENDING' | 'ACKNOWLEDGED' | 'REWARDED' | 'DENIED'
  child: {
    id: string
    name: string
  }
  responseAt?: string
  parentNote?: string
  pointsAwarded?: number
}

interface ImpromptuReviewDialogProps {
  isOpen: boolean
  onClose: () => void
  submission: ImpromptuSubmission | null
  onSuccess: (message: string) => void
}

export function ImpromptuReviewDialog({ 
  isOpen, 
  onClose, 
  submission, 
  onSuccess 
}: ImpromptuReviewDialogProps) {
  const [response, setResponse] = useState({
    status: 'ACKNOWLEDGED' as 'ACKNOWLEDGED' | 'REWARDED' | 'DENIED',
    parentNote: '',
    pointsAwarded: 0
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!submission) return

    if (response.status === 'REWARDED' && response.pointsAwarded <= 0) {
      alert('Please enter points to award (greater than 0)')
      return
    }

    setIsSubmitting(true)

    try {
      const apiResponse = await fetch('/api/impromptu-submissions', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId: submission.id,
          status: response.status,
          parentNote: response.parentNote || null,
          pointsAwarded: response.status === 'REWARDED' ? response.pointsAwarded : 0
        })
      })

      const result = await apiResponse.json()

      if (apiResponse.ok) {
        onSuccess(result.message || 'Response sent successfully!')
        handleClose()
      } else {
        alert(result.error || 'Failed to respond. Please try again.')
      }
    } catch (error) {
      console.error('Error responding:', error)
      alert('Failed to respond. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setResponse({
      status: 'ACKNOWLEDGED',
      parentNote: '',
      pointsAwarded: 0
    })
    onClose()
  }

  if (!isOpen || !submission) return null

  const timeAgo = new Date(submission.submittedAt).toLocaleString()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg bg-white shadow-2xl">
        <CardHeader>
          <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
            ✨ {submission.child.name}'s Submission
          </CardTitle>
          <CardDescription className="text-gray-600">
            Submitted {timeAgo}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Submission Details */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="font-semibold text-gray-900 mb-2">{submission.title}</h3>
            <p className="text-gray-700 text-sm">{submission.description}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Response Type */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Your Response
              </label>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setResponse(prev => ({ ...prev, status: 'ACKNOWLEDGED' }))}
                  className={`w-full p-3 text-left rounded-md border transition-colors ${
                    response.status === 'ACKNOWLEDGED'
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">👍 Acknowledge</div>
                  <div className="text-sm opacity-75">Great job! No points awarded</div>
                </button>

                <button
                  type="button"
                  onClick={() => setResponse(prev => ({ ...prev, status: 'REWARDED' }))}
                  className={`w-full p-3 text-left rounded-md border transition-colors ${
                    response.status === 'REWARDED'
                      ? 'bg-blue-50 border-blue-200 text-blue-800'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">🎯 Reward Points</div>
                  <div className="text-sm opacity-75">Excellent work! Award points</div>
                </button>

                <button
                  type="button"
                  onClick={() => setResponse(prev => ({ ...prev, status: 'DENIED' }))}
                  className={`w-full p-3 text-left rounded-md border transition-colors ${
                    response.status === 'DENIED'
                      ? 'bg-red-50 border-red-200 text-red-800'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">❌ Not Worthy</div>
                  <div className="text-sm opacity-75">This doesn't deserve recognition</div>
                </button>
              </div>
            </div>

            {/* Points Award (only if rewarding) */}
            {response.status === 'REWARDED' && (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Points to Award
                </label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={response.pointsAwarded}
                  onChange={(e) => setResponse(prev => ({ 
                    ...prev, 
                    pointsAwarded: parseInt(e.target.value) || 0 
                  }))}
                  placeholder="5"
                  className="bg-white border-gray-300 text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Typical range: 1-10 points for small things, 10-25 for bigger things
                </p>
              </div>
            )}

            {/* Parent Note */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Message to {submission.child.name} (optional)
              </label>
              <textarea
                value={response.parentNote}
                onChange={(e) => setResponse(prev => ({ ...prev, parentNote: e.target.value }))}
                placeholder={
                  response.status === 'ACKNOWLEDGED' ? "Keep up the good work!" :
                  response.status === 'REWARDED' ? "I'm so proud of you!" :
                  "This isn't something we reward..."
                }
                className="w-full p-3 border border-gray-300 rounded-md bg-white text-gray-900 h-20 resize-none"
                maxLength={200}
              />
              <p className="text-xs text-gray-500 mt-1">
                {200 - response.parentNote.length} characters left
              </p>
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
                disabled={isSubmitting || (response.status === 'REWARDED' && response.pointsAwarded <= 0)}
                className={`flex-1 text-white ${
                  response.status === 'ACKNOWLEDGED' ? 'bg-green-600 hover:bg-green-700' :
                  response.status === 'REWARDED' ? 'bg-blue-600 hover:bg-blue-700' :
                  'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  response.status === 'ACKNOWLEDGED' ? '👍 Acknowledge' :
                  response.status === 'REWARDED' ? '🎯 Award Points' :
                  '❌ Deny'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 