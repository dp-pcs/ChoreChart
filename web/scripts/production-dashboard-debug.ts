#!/usr/bin/env tsx

/**
 * Production Dashboard Debug Script
 * This script helps identify specific issues with the dashboard API in production
 */

import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function debugProductionDashboard() {
  console.log('🚨 Production Dashboard Debug Analysis...\n')

  try {
    // 1. Test basic database connection
    console.log('1. Testing database connection...')
    await prisma.$connect()
    console.log('   ✅ Database connection successful\n')

    // 2. Check if all required tables exist
    console.log('2. Checking database schema...')
    
    const tables = ['users', 'families', 'chore_submissions', 'chore_approvals', 'family_memberships']
    for (const table of tables) {
      try {
        const result = await prisma.$queryRaw`SELECT 1 FROM information_schema.tables WHERE table_name = ${table}`
        console.log(`   ✅ Table '${table}' exists`)
      } catch (error) {
        console.log(`   ❌ Table '${table}' missing or inaccessible: ${(error as Error).message}`)
      }
    }

    // 3. Check specific columns that might be missing
    console.log('\n3. Checking for new scoring system columns...')
    
    try {
      await prisma.$queryRaw`SELECT score, "partialReward" FROM chore_submissions LIMIT 1`
      console.log('   ✅ ChoreSubmission scoring columns exist')
    } catch (error) {
      console.log(`   ❌ ChoreSubmission scoring columns missing: ${(error as Error).message}`)
    }

    try {
      await prisma.$queryRaw`SELECT score, "partialReward", "originalReward" FROM chore_approvals LIMIT 1`
      console.log('   ✅ ChoreApproval scoring columns exist')
    } catch (error) {
      console.log(`   ❌ ChoreApproval scoring columns missing: ${(error as Error).message}`)
    }

    // 4. Test the exact queries used in the dashboard API
    console.log('\n4. Testing dashboard API queries...')
    
    // Find a parent user to test with
    const parentUser = await prisma.user.findFirst({
      where: { role: 'PARENT' }
    })

    if (!parentUser) {
      console.log('   ❌ No parent users found')
      return
    }

    console.log(`   Testing with parent user: ${parentUser.email}`)

    // Test FamilyMembership query
    try {
      const familyMembership = await prisma.familyMembership.findFirst({
        where: {
          userId: parentUser.id,
          isActive: true,
          isPrimary: true
        },
        include: {
          family: {
            include: {
              familyMemberships: {
                where: { isActive: true },
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      role: true,
                      createdAt: true
                    }
                  }
                }
              }
            }
          }
        }
      })
      console.log(`   ✅ FamilyMembership query successful (${familyMembership ? 'found' : 'not found'})`)
    } catch (error) {
      console.log(`   ❌ FamilyMembership query failed: ${(error as Error).message}`)
    }

    // Test direct family relationship
    try {
      const user = await prisma.user.findUnique({
        where: { id: parentUser.id },
        include: {
          family: {
            include: {
              users: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                  createdAt: true
                }
              }
            }
          }
        }
      })
      console.log(`   ✅ Direct family query successful (${user?.family ? 'found' : 'not found'})`)
    } catch (error) {
      console.log(`   ❌ Direct family query failed: ${(error as Error).message}`)
    }

    // Test ChoreSubmission query with new fields
    try {
      const submissions = await prisma.choreSubmission.findMany({
        where: {
          status: 'PENDING'
        },
        select: {
          id: true,
          score: true,
          partialReward: true,
          status: true
        },
        take: 1
      })
      console.log(`   ✅ ChoreSubmission query with new fields successful`)
    } catch (error) {
      console.log(`   ❌ ChoreSubmission query with new fields failed: ${(error as Error).message}`)
    }

    // 5. Environment checks
    console.log('\n5. Environment variable checks...')
    console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? 'Set' : 'Missing'}`)
    console.log(`   NEXTAUTH_URL: ${process.env.NEXTAUTH_URL ? 'Set' : 'Missing'}`)
    console.log(`   NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET ? 'Set' : 'Missing'}`)

    console.log('\n🎉 Production debug analysis complete!')

  } catch (error) {
    console.error('❌ Critical error during analysis:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  debugProductionDashboard()
    .then(() => {
      console.log('\n📋 Analysis complete. Check the results above for any issues.')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Failed to complete analysis:', error)
      process.exit(1)
    })
}

export { debugProductionDashboard } 