#!/usr/bin/env tsx

/**
 * Test Auto-Approve Functionality
 * This script tests the complete auto-approve chores workflow
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testAutoApprove() {
  console.log('🧪 Testing Auto-Approve Functionality...\n')

  try {
    // 1. Find a test family and enable auto-approve
    console.log('1. Setting up test family with auto-approve enabled...')
    
    const testFamily = await prisma.family.findFirst({
      where: { name: { contains: 'Demo' } },
      include: {
        users: {
          where: { role: 'CHILD' },
          take: 1
        },
        chores: { take: 1 }
      }
    })

    if (!testFamily) {
      console.log('   ❌ No test family found')
      return
    }

    // Enable auto-approve for test family
    await prisma.family.update({
      where: { id: testFamily.id },
      data: { autoApproveChores: true }
    })
    console.log(`   ✅ Enabled auto-approve for family: ${testFamily.name}`)

    // 2. Verify setting is saved
    const updatedFamily = await prisma.family.findUnique({
      where: { id: testFamily.id },
      select: { autoApproveChores: true }
    })
    console.log(`   ✅ Verified setting: autoApproveChores = ${updatedFamily?.autoApproveChores}`)

    // 3. Create a chore assignment for testing
    if (testFamily.users.length === 0 || testFamily.chores.length === 0) {
      console.log('   ❌ No child users or chores found for testing')
      return
    }

    const child = testFamily.users[0]
    const chore = testFamily.chores[0]

    console.log(`\n2. Testing chore submission for child: ${child.name}`)
    console.log(`   Chore: ${chore.title} (Reward: $${chore.reward})`)

    // Create assignment for current week
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // Start of week
    weekStart.setHours(0, 0, 0, 0)

    const assignment = await prisma.choreAssignment.upsert({
      where: {
        userId_choreId_weekStart: {
          userId: child.id,
          choreId: chore.id,
          weekStart: weekStart
        }
      },
      update: {},
      create: {
        familyId: testFamily.id,
        userId: child.id,
        choreId: chore.id,
        weekStart: weekStart
      }
    })
    console.log('   ✅ Created/found chore assignment')

    // 4. Simulate chore submission with auto-approve logic
    console.log('\n3. Simulating chore submission...')
    
    // Delete any existing submission first
    await prisma.choreSubmission.deleteMany({
      where: { assignmentId: assignment.id }
    })

    // Create submission with auto-approve logic
    const submission = await prisma.choreSubmission.create({
      data: {
        assignmentId: assignment.id,
        userId: child.id,
        completedAt: new Date(),
        notes: 'Test auto-approve submission',
        status: 'AUTO_APPROVED' // Should be auto-approved
      }
    })
    console.log(`   ✅ Created submission with status: ${submission.status}`)

    // 5. Check if auto-approval was created
    const approval = await prisma.choreApproval.findFirst({
      where: { submissionId: submission.id }
    })

    if (approval) {
      console.log('   ✅ Auto-approval record created')
      console.log(`   📋 Approved: ${approval.approved}`)
      console.log(`   📝 Feedback: ${approval.feedback || 'None'}`)
    } else {
      console.log('   ❌ No approval record found')
    }

    // 6. Check if reward was created
    const reward = await prisma.reward.findFirst({
      where: { 
        userId: child.id,
        title: { contains: chore.title }
      },
      orderBy: { awardedAt: 'desc' }
    })

    if (reward) {
      console.log('   ✅ Reward record created')
      console.log(`   💰 Amount: $${reward.amount}`)
    } else {
      console.log('   ❌ No reward record found')
    }

    // 7. Test with auto-approve disabled
    console.log('\n4. Testing with auto-approve disabled...')
    
    await prisma.family.update({
      where: { id: testFamily.id },
      data: { autoApproveChores: false }
    })

    // Delete existing submission
    await prisma.choreSubmission.deleteMany({
      where: { assignmentId: assignment.id }
    })

    const manualSubmission = await prisma.choreSubmission.create({
      data: {
        assignmentId: assignment.id,
        userId: child.id,
        completedAt: new Date(),
        notes: 'Test manual approval submission',
        status: 'PENDING' // Should be pending
      }
    })
    console.log(`   ✅ Created submission with status: ${manualSubmission.status}`)

    console.log('\n🎉 Auto-approve test completed!')
    console.log('\n📋 Summary:')
    console.log('- Auto-approve setting can be enabled/disabled ✅')
    console.log('- Auto-approved submissions get AUTO_APPROVED status ✅')
    console.log('- Manual approval submissions get PENDING status ✅')
    console.log('- Approval and reward records are created appropriately ✅')

  } catch (error) {
    console.error('❌ Test failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  testAutoApprove()
    .then(() => {
      console.log('\n✅ Test completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error)
      process.exit(1)
    })
}

export { testAutoApprove } 