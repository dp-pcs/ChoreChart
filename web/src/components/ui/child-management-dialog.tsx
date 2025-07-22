"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Child {
  id: string
  name: string
  email: string
  joinedAt: string
}

interface ChildManagementDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (message: string) => void
  children: Child[]
}

export function ChildManagementDialog({ isOpen, onClose, onSuccess, children }: ChildManagementDialogProps) {
  const [removingChildren, setRemovingChildren] = useState<Set<string>>(new Set())

  if (!isOpen) return null

  const handleRemoveChild = async (childId: string, childName: string) => {
    if (!confirm(`Are you sure you want to remove ${childName} from the family? This will:
    
• Remove them from all chores and assignments
• Delete their progress and rewards history  
• They will no longer be able to access this family's chore system

This action cannot be undone.`)) {
      return
    }

    setRemovingChildren(prev => new Set([...prev, childId]))

    try {
      // First, check if this is a family membership removal or complete user removal
      const response = await fetch(`/api/memberships/remove-child`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to remove child')
      }

      const result = await response.json()
      
      onSuccess(`${childName} has been successfully removed from the family.`)
      
    } catch (error) {
      console.error('Error removing child:', error)
      alert(`Failed to remove ${childName}. Please try again or contact support.`)
    } finally {
      setRemovingChildren(prev => {
        const newSet = new Set(prev)
        newSet.delete(childId)
        return newSet
      })
    }
  }

  const formatJoinedDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl bg-white shadow-2xl max-h-[80vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>👨‍👩‍👧‍👦 Manage Children</CardTitle>
          <CardDescription>
            View and manage children in your family. You can remove children who have grown up or no longer need access to the chore system.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {children.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No children in your family yet.</p>
              <p className="text-sm text-gray-400">Use "Add Child Account" to add children to your family.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                <strong>Total Children:</strong> {children.length}
              </div>
              
              {children.map((child) => (
                <Card key={child.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{child.name}</h3>
                          <Badge variant="secondary">Child</Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><strong>Email:</strong> {child.email}</p>
                          <p><strong>Joined:</strong> {formatJoinedDate(child.joinedAt)}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={removingChildren.has(child.id)}
                          onClick={() => handleRemoveChild(child.id, child.name)}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          {removingChildren.has(child.id) ? (
                            <div className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                              Removing...
                            </div>
                          ) : (
                            <>🗑️ Remove</>
                          )}
                        </Button>
                        <div className="text-xs text-gray-400 text-center">
                          Permanent
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Important Notes</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Removing a child deletes all their chore history and progress</li>
                  <li>• Their user account will be deactivated if they're only part of this family</li>
                  <li>• If they belong to multiple families, they'll only be removed from this one</li>
                  <li>• This action cannot be undone - they would need to be re-invited</li>
                </ul>
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 