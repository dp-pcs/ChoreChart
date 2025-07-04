import { PrismaClient } from '../src/generated/prisma'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function seedDemoUsers() {
  try {
    console.log('🌱 Seeding demo users...')

    // Create demo family
    const demoFamily = await prisma.family.create({
      data: {
        name: 'The Demo Family',
        weeklyAllowance: 50.00,
        autoApproveChores: false,
      }
    })

    console.log('✅ Created demo family:', demoFamily.name)

    // Hash password for demo accounts
    const hashedPassword = await bcrypt.hash('password', 12)

    // Create parent user
    const parentUser = await prisma.user.create({
      data: {
        name: 'Demo Parent',
        email: 'parent@demo.com',
        password: hashedPassword,
        role: 'PARENT',
        familyId: demoFamily.id,
      }
    })

    console.log('✅ Created parent user:', parentUser.email)

    // Create child user (Noah)
    const childUser = await prisma.user.create({
      data: {
        name: 'Noah',
        email: 'child@demo.com', 
        password: hashedPassword,
        role: 'CHILD',
        familyId: demoFamily.id,
      }
    })

    console.log('✅ Created child user:', childUser.email)

    // Create some demo chores
    const chores = await Promise.all([
      prisma.chore.create({
        data: {
          familyId: demoFamily.id,
          title: 'Make your bed',
          description: 'Make your bed neatly every morning',
          type: 'DAILY',
          frequency: 'DAILY',
          isRequired: true,
          reward: 2.00,
          scheduledDays: JSON.stringify([1, 2, 3, 4, 5]), // Monday-Friday
          estimatedMinutes: 5,
        }
      }),
      prisma.chore.create({
        data: {
          familyId: demoFamily.id,
          title: 'Clean bedroom',
          description: 'Tidy up your bedroom and put clothes away',
          type: 'WEEKLY',
          frequency: 'WEEKLY',
          isRequired: false,
          reward: 5.00,
          scheduledDays: JSON.stringify([6]), // Saturday
          estimatedMinutes: 30,
        }
      }),
      prisma.chore.create({
        data: {
          familyId: demoFamily.id,
          title: 'Take out trash',
          description: 'Empty all wastebaskets and take to curb',
          type: 'WEEKLY',
          frequency: 'WEEKLY',
          isRequired: true,
          reward: 3.00,
          scheduledDays: JSON.stringify([2]), // Tuesday
          estimatedMinutes: 10,
        }
      }),
      prisma.chore.create({
        data: {
          familyId: demoFamily.id,
          title: 'Feed the pets',
          description: 'Feed cats and dogs morning and evening',
          type: 'DAILY',
          frequency: 'DAILY',
          isRequired: true,
          reward: 1.50,
          scheduledDays: JSON.stringify([0, 1, 2, 3, 4, 5, 6]), // Every day
          estimatedMinutes: 5,
        }
      })
    ])

    console.log('✅ Created', chores.length, 'demo chores')

    console.log('\n🎉 Demo data seeded successfully!')
    console.log('\n📋 Demo Accounts:')
    console.log('   Parent: parent@demo.com / password')
    console.log('   Child:  child@demo.com / password')
    console.log('\n🏠 Family:', demoFamily.name)
    console.log('💰 Weekly Allowance: $' + demoFamily.weeklyAllowance)

  } catch (error) {
    console.error('❌ Error seeding demo users:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seeding function
seedDemoUsers()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  }) 