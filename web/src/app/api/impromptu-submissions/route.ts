import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getActiveFamilyId } from '@/lib/family'
import { convertDecimalsDeep } from '@/lib/utils'

// GET: Fetch impromptu submissions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const childId = url.searchParams.get('childId')
    const status = url.searchParams.get('status')

    // Build where clause based on user role and filters
    const whereClause: any = {}
    
    if (session.user.role === 'CHILD') {
      // Children can only see their own submissions
      whereClause.childId = session.user.id
    } else if (session.user.role === 'PARENT') {
      // Parents can see submissions from their family's children
      if (childId) {
        whereClause.childId = childId
      } else {
        // Get all children in the family
        const familyId = await getActiveFamilyId(session.user.id)
        const familyChildren = await prisma.user.findMany({
          where: {
            familyId: familyId || undefined,
            role: 'CHILD'
          },
          select: { id: true }
        })
        whereClause.childId = { in: familyChildren.map(child => child.id) }
      }
    }

    if (status) {
      whereClause.status = status
    }

    const submissions = await prisma.impromptuSubmission.findMany({
      where: whereClause,
      include: {
        child: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    })

    return NextResponse.json(convertDecimalsDeep({
      success: true,
      submissions
    }))

  } catch (error) {
    console.error('Impromptu submissions fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch impromptu submissions' },
      { status: 500 }
    )
  }
}

// POST: Create new impromptu submission (children only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'CHILD') {
      return NextResponse.json({ error: 'Only children can create impromptu submissions' }, { status: 403 })
    }

    const { title, description } = await request.json()

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      )
    }

    const submission = await prisma.impromptuSubmission.create({
      data: {
        childId: session.user.id,
        title: title.trim(),
        description: description.trim()
      },
      include: {
        child: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      submission,
      message: 'Submission sent to parents for review!'
    })

  } catch (error) {
    console.error('Impromptu submission creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create impromptu submission' },
      { status: 500 }
    )
  }
}

// PATCH: Respond to impromptu submission (parents only)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Only parents can respond to submissions' }, { status: 403 })
    }

    const { submissionId, status, parentNote, pointsAwarded } = await request.json()

    if (!submissionId || !status) {
      return NextResponse.json(
        { error: 'Submission ID and status are required' },
        { status: 400 }
      )
    }

    // Verify submission exists and belongs to active family
    const familyId = await getActiveFamilyId(session.user.id)
    const submission = await prisma.impromptuSubmission.findFirst({
      where: {
        id: submissionId,
        child: {
          familyId: familyId || undefined
        }
      },
      include: {
        child: true
      }
    })

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    // Update submission
    const updatedSubmission = await prisma.impromptuSubmission.update({
      where: { id: submissionId },
      data: {
        status,
        responseAt: new Date(),
        parentNote,
        pointsAwarded: pointsAwarded || 0
      },
      include: {
        child: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Award points if this is a rewarded submission
    if (status === 'REWARDED' && pointsAwarded > 0) {
      await prisma.user.update({
        where: { id: submission.childId },
        data: {
          availablePoints: { increment: pointsAwarded },
          lifetimePoints: { increment: pointsAwarded }
        }
      })

      // Create a reward record for tracking
      await prisma.reward.create({
        data: {
          userId: submission.childId,
          title: `Recognition: ${submission.title}`,
          description: submission.description,
          amount: 0, // Points-based, not money
          type: 'EXPERIENCE',
          awardedBy: session.user.id
        }
      })
    }

    return NextResponse.json(convertDecimalsDeep({
      success: true,
      submission: updatedSubmission,
      message: `Submission ${status.toLowerCase()} successfully!`
    }))

  } catch (error) {
    console.error('Impromptu submission response error:', error)
    return NextResponse.json(
      { error: 'Failed to respond to submission' },
      { status: 500 }
    )
  }
} 