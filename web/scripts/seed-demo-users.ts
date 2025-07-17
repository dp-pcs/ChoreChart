import { PrismaClient } from '../src/generated/prisma'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function seedDemoUsers() {
  try {
    console.log('🌱 Seeding demo users...')

    // Create demo family with schema-aware field handling
    const familyData: any = {
      name: 'The Demo Family',
      weeklyAllowance: 50.00,
      autoApproveChores: false,
    }

    // Only add new fields if they exist in the schema
    try {
      // Test if the allowMultipleParents field exists
      await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'families' AND column_name = 'allowMultipleParents' LIMIT 1`
      // If query succeeds, the column exists
      familyData.allowMultipleParents = true
      familyData.shareReports = false
      familyData.crossFamilyApproval = false
      familyData.enableStreaks = true
      familyData.enableLeaderboard = true
      familyData.enableAchievements = true
      familyData.streakFreezeLimit = 3
    } catch (error) {
      // Column doesn't exist, skip the new fields
      console.log('ℹ️ New family fields not available in current schema, using basic fields only')
    }

    const demoFamily = await prisma.family.create({
      data: familyData
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
          scheduledDays: [1, 2, 3, 4, 5], // Monday-Friday
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
          scheduledDays: [6], // Saturday
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
          scheduledDays: [2], // Tuesday
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
          scheduledDays: [0, 1, 2, 3, 4, 5, 6], // Every day
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