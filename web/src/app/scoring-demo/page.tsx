'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChoreScoringDialog } from '@/components/ui/chore-scoring-dialog'
import { ScoringFeedback } from '@/components/ui/scoring-feedback'

export default function ScoringDemo() {
  const [showScoringDialog, setShowScoringDialog] = useState(false)
  const [scoredSubmission, setScoredSubmission] = useState<any>(null)

  const mockSubmission = {
    id: 'demo-1',
    choreName: 'Mow the Lawn',
    childName: 'Noah',
    reward: 10,
    notes: 'Mowed the front yard but missed some spots in the corners',
    submittedAt: new Date().toISOString()
  }

  const handleScore = async (score: number, feedback: string) => {
    // Simulate API call
    const partialReward = Math.round((score / 100) * mockSubmission.reward)
    
    setScoredSubmission({
      ...mockSubmission,
      score,
      partialReward,
      originalReward: mockSubmission.reward,
      feedback,
      submittedAt: new Date().toISOString()
    })
    
    setShowScoringDialog(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Chore Quality Scoring System
          </h1>
          <p className="text-gray-600">
            Demo of the new quality-based reward system
          </p>
        </div>

        {/* Demo Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Parent View */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                👨‍👩‍👧‍👦 Parent View
              </CardTitle>
              <CardDescription>
                Score chore quality and give partial rewards
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2 mb-2">
                  <p className="font-medium">{mockSubmission.childName}</p>
                  <span className="text-gray-400">completed</span>
                  <p className="font-medium">{mockSubmission.choreName}</p>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Submitted {new Date(mockSubmission.submittedAt).toLocaleString()} • ${mockSubmission.reward} reward
                </p>
                {mockSubmission.notes && (
                  <p className="text-sm text-gray-600">
                    <strong>Notes:</strong> {mockSubmission.notes}
                  </p>
                )}
              </div>
              
              <Button 
                onClick={() => setShowScoringDialog(true)}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Score Quality
              </Button>
            </CardContent>
          </Card>

          {/* Child View */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                👶 Child View
              </CardTitle>
              <CardDescription>
                See quality feedback and partial rewards
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scoredSubmission ? (
                <ScoringFeedback
                  choreName={scoredSubmission.choreName}
                  score={scoredSubmission.score}
                  originalReward={scoredSubmission.originalReward}
                  partialReward={scoredSubmission.partialReward}
                  feedback={scoredSubmission.feedback}
                  submittedAt={scoredSubmission.submittedAt}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Score a chore to see the feedback here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* How it works */}
        <Card>
          <CardHeader>
            <CardTitle>How the Scoring System Works</CardTitle>
            <CardDescription>
              Quality-based rewards encourage better work habits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl mb-2">🌟</div>
                <h3 className="font-semibold text-green-800">90-100%</h3>
                <p className="text-sm text-green-600">Excellent work - Full reward</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl mb-2">👍</div>
                <h3 className="font-semibold text-yellow-800">70-89%</h3>
                <p className="text-sm text-yellow-600">Good job - Partial reward</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl mb-2">🤔</div>
                <h3 className="font-semibold text-orange-800">50-69%</h3>
                <p className="text-sm text-orange-600">Needs improvement - Reduced reward</p>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Benefits:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Encourages attention to detail and quality</li>
                <li>• Teaches the value of doing things right the first time</li>
                <li>• Provides constructive feedback for improvement</li>
                <li>• Rewards excellence while being fair about effort</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Scoring Dialog */}
        <ChoreScoringDialog
          isOpen={showScoringDialog}
          onClose={() => setShowScoringDialog(false)}
          submission={mockSubmission}
          onScore={handleScore}
        />
      </div>
    </div>
  )
}