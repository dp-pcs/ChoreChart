#!/usr/bin/env tsx

/**
 * Post-deployment setup script for ChoreChart
 * Run this after successful Amplify deployment to:
 * 1. Apply database migrations
 * 2. Seed demo users
 */

import { PrismaClient } from '../src/generated/prisma'
import type { ChoreType, ChoreFrequency } from '../src/generated/prisma'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Starting post-deployment setup...')

  try {
    // Check database connection
    await prisma.$connect()
    console.log('✅ Database connection successful')

    // Check if users already exist
    const existingUsers = await prisma.user.count()
    if (existingUsers > 0) {
      console.log(`📊 Found ${existingUsers} existing users, skipping seed`)
      return
    }

    console.log('👨‍👩‍👧‍👦 Creating demo family and users...')

    // Create family
    const family = await prisma.family.create({
      data: {
        name: 'Demo Family',
        weeklyAllowance: 20.00,
        autoApproveChores: false,
        emailNotifications: true,
      }
    })

    // Create parent user
    const parentPassword = await bcrypt.hash('password', 10)
    const parent = await prisma.user.create({
      data: {
        email: 'parent@demo.com',
        name: 'Demo Parent',
        password: parentPassword,
        role: 'PARENT',
        familyId: family.id,
      }
    })

    // Create child user
    const childPassword = await bcrypt.hash('password', 10)
    const child = await prisma.user.create({
      data: {
        email: 'child@demo.com',
        name: 'Demo Child',
        password: childPassword,
        role: 'CHILD',
        familyId: family.id,
      }
    })

    // Create some sample chores
    const chores = await prisma.chore.createMany({
      data: [
        {
          familyId: family.id,
          title: 'Make Your Bed',
          description: 'Make your bed every morning before school',
          type: 'DAILY',
          frequency: 'DAILY',
          isRequired: true,
          reward: 1.00,
          scheduledDays: JSON.stringify([1, 2, 3, 4, 5]), // Monday-Friday
          scheduledTime: '08:00',
          estimatedMinutes: 5,
        },
        {
          familyId: family.id,
          title: 'Take Out Trash',
          description: 'Take the trash bins to the curb',
          type: 'WEEKLY',
          frequency: 'WEEKLY',
          isRequired: false,
          reward: 3.00,
          scheduledDays: JSON.stringify([1]), // Monday
          scheduledTime: '19:00',
          estimatedMinutes: 10,
        },
        {
          familyId: family.id,
          title: 'Clean Your Room',
          description: 'Organize and clean your bedroom',
          type: 'WEEKLY',
          frequency: 'WEEKLY',
          isRequired: false,
          reward: 5.00,
          scheduledDays: JSON.stringify([6]), // Saturday
          estimatedMinutes: 30,
        }
      ]
    })

    console.log('✅ Demo setup complete!')
    console.log('\n📋 Demo Accounts Created:')
    console.log('👨 Parent: parent@demo.com / password')
    console.log('👧 Child: child@demo.com / password')
    console.log('\n🎯 Next steps:')
    console.log('1. Visit https://chorechart.latentgenius.ai')
    console.log('2. Sign in with demo accounts')
    console.log('3. Test the parent and child dashboards')
    console.log('4. Try the Chorbit AI assistant')

  } catch (error) {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }) 