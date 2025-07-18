'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ScoringFeedbackProps {
  choreName: string
  score: number
  originalReward: number
  partialReward: number
  feedback?: string
  submittedAt: string
}

export function ScoringFeedback({ 
  choreName, 
  score, 
  originalReward, 
  partialReward, 
  feedback, 
  submittedAt 
}: ScoringFeedbackProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100'
    if (score >= 70) return 'text-yellow-600 bg-yellow-100'
    if (score >= 50) return 'text-orange-600 bg-orange-100'
    return 'text-red-600 bg-red-100'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent!'
    if (score >= 70) return 'Good job!'
    if (score >= 50) return 'Needs improvement'
    return 'Poor quality'
  }

  const getScoreEmoji = (score: number) => {
    if (score >= 90) return '🌟'
    if (score >= 70) return '👍'
    if (score >= 50) return '🤔'
    return '😞'
  }

  const isPartialReward = score < 100
  const deduction = originalReward - partialReward

  return (
    <Card className="bg-white shadow-sm border-l-4 border-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Quality Feedback</CardTitle>
          <Badge className={getScoreColor(score)}>
            {getScoreEmoji(score)} {score}%
          </Badge>
        </div>
        <CardDescription>
          {choreName} • {new Date(submittedAt).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Score Summary */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Quality Score:</span>
            <span className={`text-sm font-bold ${getScoreColor(score)}`}>
              {getScoreLabel(score)}
            </span>
          </div>
          
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Original Reward:</span>
              <span>${originalReward}</span>
            </div>
            <div className="flex justify-between">
              <span>Quality Score:</span>
              <span>{score}%</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Final Reward:</span>
              <span className={isPartialReward ? 'text-orange-600' : 'text-green-600'}>
                ${partialReward}
              </span>
            </div>
            {isPartialReward && (
              <div className="flex justify-between text-xs text-gray-500">
                <span>Deduction:</span>
                <span className="text-red-600">-${deduction}</span>
              </div>
            )}
          </div>
        </div>

        {/* Feedback */}
        {feedback && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-blue-800 mb-1">Parent's Feedback:</p>
            <p className="text-sm text-blue-700">{feedback}</p>
          </div>
        )}

        {/* Tips for improvement */}
        {score < 100 && (
          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-yellow-800 mb-1">💡 Tips for next time:</p>
            <ul className="text-sm text-yellow-700 space-y-1">
              {score < 70 && (
                <li>• Take your time and do the job thoroughly</li>
              )}
              {score < 80 && (
                <li>• Pay attention to details and quality</li>
              )}
              {score < 90 && (
                <li>• Double-check your work before submitting</li>
              )}
              <li>• Ask for help if you're unsure about anything</li>
            </ul>
          </div>
        )}

        {/* Positive reinforcement */}
        {score >= 70 && (
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-green-800">
              🎉 Great work! Keep up the good quality!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}