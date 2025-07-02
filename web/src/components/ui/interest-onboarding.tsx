"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface InterestOnboardingProps {
  userId: string
  userName: string
  onComplete: () => void
}

const INTEREST_PROMPTS = [
  {
    question: "What's your favorite thing to do after school?",
    category: "hobby",
    examples: ["play basketball", "video games", "read books", "hang out with friends"]
  },
  {
    question: "Do you have a favorite sports team?",
    category: "sports", 
    examples: ["Lakers", "Warriors", "Cowboys", "not really into sports"]
  },
  {
    question: "What kind of shows or movies do you like?",
    category: "entertainment",
    examples: ["Marvel movies", "anime", "Disney+", "YouTube videos"]
  },
  {
    question: "Any foods you absolutely love?",
    category: "food",
    examples: ["pizza", "tacos", "sushi", "ice cream"]
  },
  {
    question: "What's something you're learning about or want to get better at?",
    category: "learning",
    examples: ["coding", "drawing", "guitar", "basketball skills", "math"]
  }
]

export function InterestOnboarding({ userId, userName, onComplete }: InterestOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [responses, setResponses] = useState<string[]>([])
  const [currentResponse, setCurrentResponse] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentPrompt = INTEREST_PROMPTS[currentStep]
  const isLastStep = currentStep === INTEREST_PROMPTS.length - 1

  const handleNext = async () => {
    if (!currentResponse.trim()) return
    
    const newResponses = [...responses, currentResponse.trim()]
    setResponses(newResponses)
    
    if (isLastStep) {
      // Submit all responses to learning API
      await submitInterests(newResponses)
    } else {
      setCurrentStep(currentStep + 1)
      setCurrentResponse('')
    }
  }

  const submitInterests = async (allResponses: string[]) => {
    setIsSubmitting(true)
    
    try {
      // Build conversation text from all responses
      const conversation = INTEREST_PROMPTS.map((prompt, i) => 
        `Chorbit: ${prompt.question}\n${userName}: ${allResponses[i]}`
      ).join('\n\n')

      // Submit to learning API
      await fetch('/api/chorbit/learn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          conversation,
          source: 'onboarding'
        })
      })

      onComplete()
    } catch (error) {
      console.error('Failed to submit interests:', error)
      // Still complete onboarding even if learning fails
      onComplete()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleExampleClick = (example: string) => {
    setCurrentResponse(example)
  }

  const handleSkip = () => {
    setResponses([...responses, "I'd rather not say"])
    if (isLastStep) {
      onComplete()
    } else {
      setCurrentStep(currentStep + 1)
      setCurrentResponse('')
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-t-lg">
        <div className="text-4xl mb-2">🤖</div>
        <CardTitle className="text-2xl">Getting to Know You!</CardTitle>
        <CardDescription className="text-purple-100">
          Hi {userName}! I'm Chorbit, and I'd love to learn about your interests so I can help you better.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500">Question {currentStep + 1} of {INTEREST_PROMPTS.length}</span>
            <Badge variant="outline">{Math.round(((currentStep + 1) / INTEREST_PROMPTS.length) * 100)}%</Badge>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / INTEREST_PROMPTS.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">{currentPrompt.question}</h3>
            
            <Input
              value={currentResponse}
              onChange={(e) => setCurrentResponse(e.target.value)}
              placeholder="Tell me about it..."
              className="mb-4"
              onKeyPress={(e) => e.key === 'Enter' && handleNext()}
            />

            <div className="space-y-2">
              <p className="text-sm text-gray-600">Or pick from these examples:</p>
              <div className="flex flex-wrap gap-2">
                {currentPrompt.examples.map((example) => (
                  <Button
                    key={example}
                    variant="outline"
                    size="sm"
                    onClick={() => handleExampleClick(example)}
                    className="text-xs"
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={handleSkip}>
              Skip this one
            </Button>
            
            <Button 
              onClick={handleNext}
              disabled={!currentResponse.trim() || isSubmitting}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              {isSubmitting ? 'Learning...' : isLastStep ? 'All done!' : 'Next'}
            </Button>
          </div>
        </div>

        {/* Show previous responses */}
        {responses.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">What I've learned so far:</p>
            <div className="space-y-1">
              {responses.map((response, i) => (
                <p key={i} className="text-sm text-gray-600">
                  • {response}
                </p>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 