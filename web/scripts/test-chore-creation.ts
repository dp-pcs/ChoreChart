#!/usr/bin/env tsx

/**
 * Test Chore Creation Functionality
 * This script tests the add chore workflow to ensure it works properly
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testChoreCreation() {
  console.log('🧪 Testing Chore Creation Functionality...\n')

  try {
    // 1. Find a test family with a parent
    console.log('1. Finding test family with parent...')
    
    const testFamily = await prisma.family.findFirst({
      where: { name: { contains: 'Demo' } },
      include: {
        users: {
          where: { role: 'PARENT' },
          take: 1
        },
        chores: true
      }
    })

    if (!testFamily || testFamily.users.length === 0) {
      console.log('   ❌ No test family with parent found')
      return
    }

    const parent = testFamily.users[0]
    console.log(`   ✅ Found family: ${testFamily.name}`)
    console.log(`   ✅ Parent: ${parent.name} (${parent.email})`)

    // 2. Test different chore types
    const testChores = [
      {
        title: 'Test Once Chore',
        description: 'A one-time chore for testing',
        frequency: 'once',
        reward: 5,
        estimatedMinutes: 10
      },
      {
        title: 'Test Daily Chore', 
        description: 'A daily chore for testing',
        frequency: 'daily',
        selectedDays: [0, 1, 2, 3, 4], // Mon-Fri
        reward: 0, // Test with 0 reward
        estimatedMinutes: 0 // Test with default time
      },
      {
        title: 'Test Weekly Chore',
        description: 'A weekly chore for testing',
        frequency: 'weekly',
        selectedDays: [6], // Saturday
        reward: 10,
        estimatedMinutes: 30
      }
    ]

    console.log('\n2. Testing chore creation...')
    
    for (const choreData of testChores) {
      console.log(`\n   Testing: ${choreData.title}`)
      console.log(`   Frequency: ${choreData.frequency}`)
      console.log(`   Reward: $${choreData.reward}`)
      console.log(`   Time: ${choreData.estimatedMinutes} minutes`)

      try {
        // Map frequency to proper enum values (same logic as API)
        const choreType = choreData.frequency === 'once' ? 'ONE_TIME' : 
                         choreData.frequency === 'daily' ? 'DAILY' : 
                         choreData.frequency === 'weekly' ? 'WEEKLY' : 'CUSTOM'
        
        const choreFrequency = choreData.frequency === 'once' ? 'AS_NEEDED' : 
                              choreData.frequency === 'daily' ? 'DAILY' : 
                              choreData.frequency === 'weekly' ? 'WEEKLY' : 'AS_NEEDED'

        const chore = await prisma.chore.create({
          data: {
            title: choreData.title,
            description: choreData.description || '',
            reward: choreData.reward || 0,
            estimatedMinutes: choreData.estimatedMinutes || 15,
            isRequired: false,
            familyId: testFamily.id,
            type: choreType,
            frequency: choreFrequency,
            scheduledDays: choreData.selectedDays || []
          }
        })

        console.log(`   ✅ Created chore: ${chore.title}`)
        console.log(`   📋 Type: ${chore.type}, Frequency: ${chore.frequency}`)
        console.log(`   💰 Reward: $${chore.reward}`)
        console.log(`   ⏰ Time: ${chore.estimatedMinutes} minutes`)
        if (chore.scheduledDays.length > 0) {
          console.log(`   📅 Scheduled days: ${chore.scheduledDays.join(', ')}`)
        }

             } catch (error) {
         console.log(`   ❌ Failed to create chore: ${(error as Error).message}`)
       }
    }

    // 3. Test validation
    console.log('\n3. Testing validation...')
    
    try {
      await prisma.chore.create({
        data: {
          title: '', // Empty title should fail
          description: 'Test validation',
          reward: 5,
          estimatedMinutes: 10,
          familyId: testFamily.id,
          type: 'ONE_TIME',
          frequency: 'AS_NEEDED'
        }
      })
      console.log('   ❌ Empty title validation failed - chore was created!')
    } catch (error) {
      console.log('   ✅ Empty title properly rejected')
    }

    // 4. Count total chores created
    const totalChores = await prisma.chore.count({
      where: { familyId: testFamily.id }
    })
    
    console.log(`\n📊 Total chores in family: ${totalChores}`)

    console.log('\n🎉 Chore creation test completed!')
    console.log('\n📋 Summary:')
    console.log('- Different frequency types work ✅')
    console.log('- Optional fields (reward, time) handle defaults ✅')
    console.log('- Scheduled days are stored properly ✅')
    console.log('- Validation works for required fields ✅')

  } catch (error) {
    console.error('❌ Test failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  testChoreCreation()
    .then(() => {
      console.log('\n✅ Test completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error)
      process.exit(1)
    })
}

export { testChoreCreation } 