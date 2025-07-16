import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Only parents can update family settings' }, { status: 403 })
    }

    const { 
      autoApproveChores,
      allowMultipleParents,
      emailNotifications,
      shareReports,
      crossFamilyApproval,
      weeklyAllowance
    } = await request.json()

    // Verify parent has permission to edit family settings
    const familyMembership = await prisma.familyMembership.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
        canManage: true
      }
    })

    if (!familyMembership) {
      return NextResponse.json(
        { error: 'You do not have permission to edit family settings' },
        { status: 403 }
      )
    }

    // Prepare update data (only include fields that were provided)
    const updateData: any = {}
    
    if (typeof autoApproveChores === 'boolean') {
      updateData.autoApproveChores = autoApproveChores
    }
    if (typeof allowMultipleParents === 'boolean') {
      updateData.allowMultipleParents = allowMultipleParents
    }
    if (typeof emailNotifications === 'boolean') {
      updateData.emailNotifications = emailNotifications
    }
    if (typeof shareReports === 'boolean') {
      updateData.shareReports = shareReports
    }
    if (typeof crossFamilyApproval === 'boolean') {
      updateData.crossFamilyApproval = crossFamilyApproval
    }
    if (typeof weeklyAllowance === 'number') {
      updateData.weeklyAllowance = weeklyAllowance
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid settings provided' },
        { status: 400 }
      )
    }

    // Update family settings
    const updatedFamily = await prisma.family.update({
      where: { id: familyMembership.familyId },
      data: updateData,
      select: {
        autoApproveChores: true,
        allowMultipleParents: true,
        emailNotifications: true,
        shareReports: true,
        crossFamilyApproval: true,
        weeklyAllowance: true
      }
    })

    return NextResponse.json({
      success: true,
      settings: updatedFamily,
      message: 'Family settings updated successfully'
    })

  } catch (error) {
    console.error('Family settings update error:', error)
    return NextResponse.json(
      { error: 'Failed to update family settings' },
      { status: 500 }
    )
  }
} 