'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface ParentalFeedbackDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (message: string) => void
  children: Array<{ id: string; name: string }>
}

export function ParentalFeedbackDialog({ isOpen, onClose, onSuccess, children }: ParentalFeedbackDialogProps) {
  const [selectedChild, setSelectedChild] = useState('')
  const [feedbackType, setFeedbackType] = useState<'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'>('POSITIVE')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [points, setPoints] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedChild || !title.trim()) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/parental-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: selectedChild,
          title: title.trim(),
          description: description.trim() || null,
          type: feedbackType,
          occurredAt: new Date().toISOString(),
          points: points || null
        })
      })

      const result = await response.json()

      if (response.ok) {
        const childName = children.find(c => c.id === selectedChild)?.name || 'Child'
        let message = `✅ Feedback logged for ${childName}`
        
        if (points > 0) {
          message += ` (+${points} points awarded)`
        } else if (points < 0) {
          message += ` (${points} points deducted)`
        }
        
        if (result.patternWarning) {
          message += `\n${result.patternWarning}`
        }
        
        onSuccess(message)
        
        // Reset form
        setSelectedChild('')
        setFeedbackType('POSITIVE')
        setTitle('')
        setDescription('')
        setPoints(0)
        onClose()
      } else {
        console.error('Failed to log feedback:', result.error)
        onSuccess(`❌ Failed to log feedback: ${result.error}`)
      }
    } catch (error) {
      console.error('Error logging feedback:', error)
      onSuccess('❌ Failed to log feedback. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTypeChange = (type: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL') => {
    setFeedbackType(type)
    
    // Auto-set common titles and point values based on type
    if (type === 'POSITIVE') {
      if (!title) setTitle('Great behavior!')
      if (points <= 0) setPoints(1)
    } else if (type === 'NEGATIVE') {
      if (!title) setTitle('Needs improvement')
      if (points >= 0) setPoints(-1)
    } else {
      if (!title) setTitle('General note')
      setPoints(0)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📝 Add Parental Feedback
          </CardTitle>
          <CardDescription>
            Record positive or negative behavior observations about your child
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Child Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Child</label>
              <select
                value={selectedChild}
                onChange={(e) => setSelectedChild(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a child...</option>
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Feedback Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Feedback Type</label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={feedbackType === 'POSITIVE' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleTypeChange('POSITIVE')}
                  className={feedbackType === 'POSITIVE' ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  👍 Positive
                </Button>
                <Button
                  type="button"
                  variant={feedbackType === 'NEGATIVE' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleTypeChange('NEGATIVE')}
                  className={feedbackType === 'NEGATIVE' ? 'bg-red-600 hover:bg-red-700' : ''}
                >
                  👎 Negative
                </Button>
                <Button
                  type="button"
                  variant={feedbackType === 'NEUTRAL' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleTypeChange('NEUTRAL')}
                  className={feedbackType === 'NEUTRAL' ? 'bg-gray-600 hover:bg-gray-700' : ''}
                >
                  📝 Note
                </Button>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                What happened? *
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief description of the behavior"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Details (optional)
              </label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Additional context or details..."
                rows={3}
              />
            </div>

            {/* Points */}
            <div className="space-y-2">
              <label htmlFor="points" className="text-sm font-medium">
                Points Impact (optional)
              </label>
              <div className="flex items-center gap-2">
                <Input
                  id="points"
                  type="number"
                  value={points || ''}
                  onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className="w-20"
                />
                <span className="text-sm text-gray-500">
                  {points > 0 ? 'points awarded' : points < 0 ? 'points deducted' : 'no point change'}
                </span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !selectedChild || !title.trim()}
                className={
                  feedbackType === 'POSITIVE' ? 'bg-green-600 hover:bg-green-700' :
                  feedbackType === 'NEGATIVE' ? 'bg-red-600 hover:bg-red-700' :
                  'bg-blue-600 hover:bg-blue-700'
                }
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  'Add Feedback'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}