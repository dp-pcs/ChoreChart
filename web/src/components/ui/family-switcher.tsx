'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { FamilyMembership } from '@/../../shared/types'

interface FamilySwitcherProps {
  className?: string
  onFamilySwitch?: (familyId: string) => void
}

export function FamilySwitcher({ className, onFamilySwitch }: FamilySwitcherProps) {
  const { data: session, update } = useSession()
  const [memberships, setMemberships] = useState<FamilyMembership[]>([])
  const [activeFamilyId, setActiveFamilyId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSwitching, setIsSwitching] = useState(false)

  // Fetch user's family memberships
  useEffect(() => {
    fetchMemberships()
  }, [session])

  const fetchMemberships = async () => {
    if (!session?.user?.id) return

    try {
      setIsLoading(true)
      const response = await fetch('/api/memberships', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      if (data.success) {
        setMemberships(data.data)
        
        // Set active family (primary or first)
        const primaryFamily = data.data.find((m: FamilyMembership) => m.isPrimary)
        const activeFamily = primaryFamily || data.data[0]
        if (activeFamily) {
          setActiveFamilyId(activeFamily.familyId)
        }
      }
    } catch (error) {
      console.error('Error fetching memberships:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFamilySwitch = async (familyId: string) => {
    if (familyId === activeFamilyId) return

    try {
      setIsSwitching(true)
      
      const response = await fetch('/api/memberships/switch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ familyId })
      })

      const data = await response.json()
      if (data.success) {
        setActiveFamilyId(familyId)
        
        // Update session to reflect new active family
        await update({
          activeFamilyId: familyId
        })

        // Notify parent component
        onFamilySwitch?.(familyId)
      }
    } catch (error) {
      console.error('Error switching family:', error)
    } finally {
      setIsSwitching(false)
    }
  }

  const getRoleDisplay = (role: string) => {
    return role === 'PARENT' ? '👨‍👩‍👧‍👦 Parent' : '🧒 Child'
  }

  const getActiveMembership = () => {
    return memberships.find(m => m.familyId === activeFamilyId)
  }

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-sm text-gray-600">Loading families...</span>
      </div>
    )
  }

  // Only show switcher if user has multiple families
  if (memberships.length <= 1) {
    const membership = memberships[0]
    if (membership) {
      return (
        <div className={`flex items-center gap-2 ${className}`}>
          <span className="text-sm font-medium">{membership.family?.name}</span>
          <Badge variant="secondary">{getRoleDisplay(membership.role)}</Badge>
        </div>
      )
    }
    return null
  }

  const activeMembership = getActiveMembership()

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Family Selector */}
      <div className="flex items-center gap-2">
        <Select 
          value={activeFamilyId} 
          onValueChange={handleFamilySwitch}
          disabled={isSwitching}
        >
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select family">
              {activeMembership && (
                <div className="flex items-center gap-2">
                  <span>{activeMembership.family?.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {getRoleDisplay(activeMembership.role)}
                  </Badge>
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {memberships.map((membership) => (
              <SelectItem key={membership.id} value={membership.familyId}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span>{membership.family?.name}</span>
                    {membership.isPrimary && (
                      <Badge variant="default" className="text-xs">Primary</Badge>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs ml-2">
                    {getRoleDisplay(membership.role)}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isSwitching && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        )}
      </div>

      {/* Family Context Info */}
      {activeMembership && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <span>{activeMembership.family?.name}</span>
              {activeMembership.isPrimary && (
                <Badge variant="default" className="text-xs">Primary Family</Badge>
              )}
            </CardTitle>
            <CardDescription className="text-xs">
              You are a {activeMembership.role.toLowerCase()} in this family
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-1">
              {activeMembership.canInvite && (
                <Badge variant="outline" className="text-xs">Can Invite</Badge>
              )}
              {activeMembership.canManage && (
                <Badge variant="outline" className="text-xs">Can Manage</Badge>
              )}
              {activeMembership.role === 'PARENT' && (
                <Badge variant="outline" className="text-xs">Can Approve</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Co-parenting Info */}
      {memberships.length > 1 && (
        <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
          <strong>Co-parenting Active:</strong> You have access to {memberships.length} families. 
          Switch between them to manage different households.
        </div>
      )}
    </div>
  )
}

export default FamilySwitcher