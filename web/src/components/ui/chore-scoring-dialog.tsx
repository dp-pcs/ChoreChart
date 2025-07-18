'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface ChoreScoringDialogProps {
  isOpen: boolean
  onClose: () => void
  submission: any
  onScore: (score: number, feedback: string) => Promise<void>
}

export function ChoreScoringDialog({ isOpen, onClose, submission, onScore }: ChoreScoringDialogProps) {
  const [score, setScore] = useState(100)
  const [feedback, setFeedback] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  if (!isOpen || !submission) return null

  const handleScore = async () => {
    setIsProcessing(true)
    try {
      await onScore(score, feedback)
      onClose()
      // Reset form
      setScore(100)
      setFeedback('')
    } catch (error) {
      console.error('Failed to score submission:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    if (score >= 50) return 'text-orange-600'
    return 'text-red-600'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent!'
    if (score >= 70) return 'Good job!'
    if (score >= 50) return 'Needs improvement'
    return 'Poor quality'
  }

  const calculateReward = (score: number) => {
    return Math.round((score / 100) * submission.reward)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <Card className="w-full max-w-md bg-white shadow-2xl">
        <CardHeader>
          <CardTitle>Score Chore Quality</CardTitle>
          <CardDescription>
            Rate the quality of work for "{submission.choreName}" by {submission.childName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Chore Details */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm font-medium">Chore: {submission.choreName}</p>
            <p className="text-sm text-gray-600">Child: {submission.childName}</p>
            <p className="text-sm text-gray-600">Full Reward: ${submission.reward}</p>
            {submission.notes && (
              <p className="text-sm text-gray-600 mt-2">
                <strong>Notes:</strong> {submission.notes}
              </p>
            )}
          </div>

          {/* Score Slider */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Quality Score: {score}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={score}
              onChange={(e) => setScore(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
            <p className={`text-sm font-medium ${getScoreColor(score)}`}>
              {getScoreLabel(score)}
            </p>
          </div>

          {/* Reward Calculation */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm font-medium">Reward Calculation</p>
            <div className="flex justify-between text-sm">
              <span>Full Reward:</span>
              <span>${submission.reward}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Quality Score:</span>
              <span>{score}%</span>
            </div>
            <div className="flex justify-between text-sm font-medium">
              <span>Final Reward:</span>
              <span className={score < 100 ? 'text-orange-600' : 'text-green-600'}>
                ${calculateReward(score)}
              </span>
            </div>
            {score < 100 && (
              <p className="text-xs text-gray-600 mt-1">
                ${submission.reward - calculateReward(score)} deducted for quality
              </p>
            )}
          </div>

          {/* Feedback */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Feedback (Optional)
            </label>
            <Textarea
              placeholder="Provide specific feedback about the work quality..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
              Cancel
            </Button>
            <Button 
              onClick={handleScore} 
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Scoring...
                </>
              ) : (
                `Approve $${calculateReward(score)}`
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}