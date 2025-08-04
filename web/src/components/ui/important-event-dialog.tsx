'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface ImportantEventDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (message: string) => void
  editingEvent?: any | null
}

export function ImportantEventDialog({ isOpen, onClose, onSuccess, editingEvent }: ImportantEventDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventType, setEventType] = useState('GENERAL')
  const [priority, setPriority] = useState('MEDIUM')
  const [isAllDay, setIsAllDay] = useState(true)
  const [reminderDays, setReminderDays] = useState([7, 3, 1])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form when dialog opens/closes or when editing event changes
  useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title || '')
      setDescription(editingEvent.description || '')
      setEventDate(editingEvent.eventDate ? new Date(editingEvent.eventDate).toISOString().split('T')[0] : '')
      setEventType(editingEvent.eventType || 'GENERAL')
      setPriority(editingEvent.priority || 'MEDIUM')
      setIsAllDay(editingEvent.isAllDay !== false)
      setReminderDays(editingEvent.reminderDays || [7, 3, 1])
    } else {
      // Reset to defaults for new event
      setTitle('')
      setDescription('')
      setEventDate('')
      setEventType('GENERAL')
      setPriority('MEDIUM')
      setIsAllDay(true)
      setReminderDays([7, 3, 1])
    }
  }, [editingEvent, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() || !eventDate) {
      return
    }

    setIsSubmitting(true)

    try {
      const eventData = {
        title: title.trim(),
        description: description.trim() || null,
        eventDate: new Date(eventDate + 'T12:00:00').toISOString(), // Set to noon local time
        eventType,
        priority,
        isAllDay,
        reminderDays
      }

      let response
      if (editingEvent) {
        // Update existing event
        response = await fetch('/api/important-events', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId: editingEvent.id,
            ...eventData
          })
        })
      } else {
        // Create new event
        response = await fetch('/api/important-events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData)
        })
      }

      const result = await response.json()

      if (response.ok) {
        onSuccess(result.message)
        onClose()
      } else {
        console.error('Failed to save event:', result.error)
        onSuccess(`❌ Failed to save event: ${result.error}`)
      }
    } catch (error) {
      console.error('Error saving event:', error)
      onSuccess('❌ Failed to save event. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReminderDaysChange = (days: string) => {
    try {
      const daysArray = days.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d) && d > 0)
      setReminderDays(daysArray.length > 0 ? daysArray : [7, 3, 1])
    } catch {
      setReminderDays([7, 3, 1])
    }
  }

  if (!isOpen) return null

  const eventTypeOptions = [
    { value: 'GENERAL', label: '📅 General Event', icon: '📅' },
    { value: 'BIRTHDAY', label: '🎂 Birthday', icon: '🎂' },
    { value: 'ANNIVERSARY', label: '💕 Anniversary', icon: '💕' },
    { value: 'MEETING', label: '👥 Meeting/Appointment', icon: '👥' },
    { value: 'REMINDER', label: '⏰ Reminder', icon: '⏰' },
    { value: 'OTHER', label: '📝 Other', icon: '📝' }
  ]

  const priorityOptions = [
    { value: 'LOW', label: 'Low Priority', color: 'text-gray-600' },
    { value: 'MEDIUM', label: 'Medium Priority', color: 'text-blue-600' },
    { value: 'HIGH', label: 'High Priority', color: 'text-orange-600' },
    { value: 'URGENT', label: 'Urgent', color: 'text-red-600' }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📅 {editingEvent ? 'Edit' : 'Add'} Important Event
          </CardTitle>
          <CardDescription>
            {editingEvent ? 'Update this important event' : 'Create a new important date or event for your family'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Event Title *
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., First day of school, Birthday party..."
                required
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <label htmlFor="eventDate" className="text-sm font-medium">
                Event Date *
              </label>
              <Input
                id="eventDate"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
              />
            </div>

            {/* Event Type */}
            <div className="space-y-2">
              <label htmlFor="eventType" className="text-sm font-medium">
                Event Type
              </label>
              <select
                id="eventType"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {eventTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <label htmlFor="priority" className="text-sm font-medium">
                Priority Level
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description (optional)
              </label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Additional details about this event..."
                rows={3}
              />
            </div>

            {/* All Day Toggle */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="isAllDay"
                checked={isAllDay}
                onChange={(e) => setIsAllDay(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isAllDay" className="text-sm font-medium">
                All-day event
              </label>
            </div>

            {/* Reminder Days */}
            <div className="space-y-2">
              <label htmlFor="reminderDays" className="text-sm font-medium">
                Show reminders (days before)
              </label>
              <Input
                id="reminderDays"
                value={reminderDays.join(', ')}
                onChange={(e) => handleReminderDaysChange(e.target.value)}
                placeholder="e.g., 7, 3, 1"
              />
              <p className="text-xs text-gray-500">
                Comma-separated list of days before the event to show reminders
              </p>
            </div>

            {/* Preview */}
            {title && eventDate && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-sm mb-1">Preview:</h4>
                <div className="text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <span>{eventTypeOptions.find(t => t.value === eventType)?.icon}</span>
                    <span className="font-medium">{title}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      priority === 'LOW' ? 'bg-gray-100 text-gray-700' :
                      priority === 'MEDIUM' ? 'bg-blue-100 text-blue-700' :
                      priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {priorityOptions.find(p => p.value === priority)?.label}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(eventDate + 'T12:00:00').toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                    {(() => {
                      const daysUntil = Math.ceil((new Date(eventDate + 'T12:00:00').getTime() - new Date().getTime()) / (1000 * 3600 * 24))
                      return daysUntil >= 0 ? ` (in ${daysUntil} day${daysUntil !== 1 ? 's' : ''})` : ` (${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? 's' : ''} ago)`
                    })()}
                  </div>
                </div>
              </div>
            )}

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
                disabled={isSubmitting || !title.trim() || !eventDate}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  editingEvent ? 'Update Event' : 'Create Event'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}