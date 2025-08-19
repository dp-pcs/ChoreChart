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
  const [scoringMode, setScoringMode] = useState<'quick' | 'custom'>('quick')

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
    if (score > 100) return 'text-purple-600'
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    if (score >= 50) return 'text-orange-600'
    if (score > 0) return 'text-red-600'
    return 'text-red-800'
  }

  const getScoreLabel = (score: number) => {
    if (score > 100) return 'Bonus! Exceptional work!'
    if (score >= 90) return 'Excellent!'
    if (score >= 70) return 'Good job!'
    if (score >= 50) return 'Needs improvement'
    if (score > 0) return 'Poor quality'
    if (score === 0) return 'Rejected'
    return 'Point deduction'
  }

  const quickScoreOptions = [
    { value: -50, label: 'Deduct Points', color: 'bg-red-600', icon: '⚡', feedback: 'Work was unsatisfactory and requires correction.' },
    { value: 0, label: 'Reject', color: 'bg-red-500', icon: '❌', feedback: 'Work not completed to standard.' },
    { value: 50, label: 'Half Credit', color: 'bg-orange-500', icon: '⚠️', feedback: 'Partially completed but needs improvement.' },
    { value: 100, label: 'Approve', color: 'bg-green-500', icon: '✅', feedback: 'Good work! Task completed satisfactorily.' },
    { value: 110, label: 'Bonus', color: 'bg-purple-500', icon: '💯', feedback: 'Exceptional work! Above and beyond expectations.' }
  ]

  const calculateReward = (score: number) => {
    const reward = submission.reward || 0
    return Math.round((score / 100) * reward * 100) / 100
  }

  const calculatePoints = (score: number) => {
    const points = submission.points || 0
    return Math.round((score / 100) * points)
  }

  const handleQuickScore = (option: typeof quickScoreOptions[0]) => {
    setScore(option.value)
    setFeedback(option.feedback)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Evaluate Chore Performance</CardTitle>
          <CardDescription>
            Rate "{submission.choreName}" by {submission.childName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Chore Details */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm font-medium">Chore: {submission.choreName}</p>
            <p className="text-sm text-gray-600">Child: {submission.childName}</p>
            <p className="text-sm text-gray-600">Full Points: {submission.points || 0} pts (${submission.reward || 0})</p>
            {submission.notes && (
              <p className="text-sm text-gray-600 mt-2">
                <strong>Child's notes:</strong> {submission.notes}
              </p>
            )}
          </div>

          {/* Scoring Mode Toggle */}
          <div className="flex gap-2">
            <Button
              variant={scoringMode === 'quick' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setScoringMode('quick')}
              className="flex-1"
            >
              Quick Score
            </Button>
            <Button
              variant={scoringMode === 'custom' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setScoringMode('custom')}
              className="flex-1"
            >
              Custom Score
            </Button>
          </div>

          {/* Quick Scoring Options */}
          {scoringMode === 'quick' && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Select scoring option:</h4>
              <div className="grid grid-cols-1 gap-2">
                {quickScoreOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleQuickScore(option)}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      score === option.value 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{option.icon}</span>
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-gray-600">
                            {option.value}% = {calculatePoints(option.value)} pts (${calculateReward(option.value).toFixed(2)})
                          </div>
                        </div>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${option.color}`}></div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Score Slider */}
          {scoringMode === 'custom' && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Custom Score:</h4>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Score: {score}%
                </label>
                <input
                  type="range"
                  min="-100"
                  max="150"
                  value={score}
                  onChange={(e) => setScore(parseInt(e.target.value))}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>-100%</span>
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                  <span>150%</span>
                </div>
                <p className={`text-sm font-medium ${getScoreColor(score)}`}>
                  {getScoreLabel(score)}
                </p>
              </div>
            </div>
          )}

          {/* Result Calculation */}
          <div className={`p-3 rounded-lg ${score < 0 ? 'bg-red-50' : score > 100 ? 'bg-purple-50' : 'bg-blue-50'}`}>
            <p className="text-sm font-medium">Final Result</p>
            <div className="flex justify-between text-sm">
              <span>Full Value:</span>
              <span>{submission.points || 0} pts (${submission.reward || 0})</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Score Applied:</span>
              <span>{score}%</span>
            </div>
            <div className="flex justify-between text-sm font-medium">
              <span>Points Awarded:</span>
              <span className={getScoreColor(score)}>
                {calculatePoints(score)} pts
              </span>
            </div>
            <div className="flex justify-between text-sm font-medium">
              <span>Money Value:</span>
              <span className={getScoreColor(score)}>
                ${calculateReward(score).toFixed(2)}
              </span>
            </div>
            {score < 100 && score >= 0 && (
              <p className="text-xs text-gray-600 mt-1">
                {(submission.points || 0) - calculatePoints(score)} points deducted for quality
              </p>
            )}
            {score > 100 && (
              <p className="text-xs text-purple-600 mt-1">
                +{calculatePoints(score) - (submission.points || 0)} bonus points for exceptional work!
              </p>
            )}
            {score < 0 && (
              <p className="text-xs text-red-600 mt-1">
                {Math.abs(calculatePoints(score))} points deducted as penalty
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
              className={`${
                score < 0 ? 'bg-red-600 hover:bg-red-700' :
                score === 0 ? 'bg-gray-600 hover:bg-gray-700' :
                score > 100 ? 'bg-purple-600 hover:bg-purple-700' :
                'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : score < 0 ? (
                `Deduct ${Math.abs(calculatePoints(score))} pts`
              ) : score === 0 ? (
                'Reject Submission'
              ) : score > 100 ? (
                `Award Bonus: ${calculatePoints(score)} pts`
              ) : (
                `Award ${calculatePoints(score)} pts`
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}