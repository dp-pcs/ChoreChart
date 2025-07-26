#!/usr/bin/env tsx

/**
 * Fix Production Login Issue
 * This script diagnoses and fixes login issues in production
 */

import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function fixProductionLogin() {
  console.log('🔧 Diagnosing and fixing production login issue...\n')

  try {
    // 1. Test basic database connection
    console.log('1. Testing database connection...')
    await prisma.$connect()
    console.log('   ✅ Database connection successful\n')

    // 2. Check if users table exists and is accessible
    console.log('2. Checking users table...')
    try {
      const userCount = await prisma.user.count()
      console.log(`   ✅ Users table accessible with ${userCount} users\n`)
    } catch (error) {
      console.log(`   ❌ Users table error: ${(error as Error).message}`)
      throw error
    }

    // 3. Check for enum type issues
    console.log('3. Checking enum types...')
    try {
      // Test if enum types exist
      await prisma.$queryRaw`SELECT unnest(enum_range(NULL::public."ImpromptuSubmissionStatus"))`
      console.log('   ✅ ImpromptuSubmissionStatus enum exists')
    } catch (error) {
      console.log(`   ⚠️  ImpromptuSubmissionStatus enum issue: ${(error as Error).message}`)
      console.log('   🔧 Attempting to create missing enum...')
      
      try {
        await prisma.$executeRaw`
          DO $$ BEGIN
              CREATE TYPE "public"."ImpromptuSubmissionStatus" AS ENUM ('PENDING', 'ACKNOWLEDGED', 'REWARDED', 'DENIED');
          EXCEPTION
              WHEN duplicate_object THEN null;
          END $$;
        `
        console.log('   ✅ ImpromptuSubmissionStatus enum created')
      } catch (createError) {
        console.log(`   ❌ Failed to create enum: ${(createError as Error).message}`)
      }
    }

    // 4. Check demo users exist
    console.log('4. Checking demo users...')
    const demoParent = await prisma.user.findUnique({ where: { email: 'parent@demo.com' } })
    const demoChild = await prisma.user.findUnique({ where: { email: 'child@demo.com' } })
    
    if (!demoParent || !demoChild) {
      console.log('   ⚠️  Demo users missing, creating them...')
      
      // Create demo family if it doesn't exist
      let demoFamily = await prisma.family.findFirst({ where: { name: 'Demo Family' } })
      if (!demoFamily) {
        demoFamily = await prisma.family.create({
          data: { name: 'Demo Family' }
        })
        console.log('   ✅ Demo family created')
      }

      // Create demo users if they don't exist
      if (!demoParent) {
        await prisma.user.create({
          data: {
            email: 'parent@demo.com',
            name: 'Demo Parent',
            password: 'password',
            role: 'PARENT',
            familyId: demoFamily.id
          }
        })
        console.log('   ✅ Demo parent created')
      }

      if (!demoChild) {
        await prisma.user.create({
          data: {
            email: 'child@demo.com',
            name: 'Noah (Demo Child)',
            password: 'password',
            role: 'CHILD',
            familyId: demoFamily.id
          }
        })
        console.log('   ✅ Demo child created')
      }
    } else {
      console.log('   ✅ Demo users exist')
    }

    // 5. Test authentication logic
    console.log('5. Testing authentication logic...')
    const testUser = await prisma.user.findUnique({
      where: { email: 'parent@demo.com' },
      include: { family: true }
    })

    if (testUser) {
      console.log('   ✅ Demo user found and accessible')
      console.log(`   User: ${testUser.name} (${testUser.role})`)
      console.log(`   Family: ${testUser.family?.name || 'No family'}`)
    } else {
      console.log('   ❌ Demo user not found')
    }

    console.log('\n🎉 Production login diagnosis complete!')
    
  } catch (error) {
    console.error('❌ Error during diagnosis:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  fixProductionLogin()
}