#!/usr/bin/env tsx

/**
 * Diagnostic script for dashboard data issues
 * This script helps identify and fix common problems with the dashboard
 */

import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()
const Decimal = Prisma.Decimal

async function diagnoseDashboardIssue() {
  console.log('🔍 Diagnosing dashboard data issues...\n')

  try {
    // Check database connection
    console.log('1. Testing database connection...')
    await prisma.$connect()
    console.log('   ✅ Database connection successful\n')

    // Check if users exist
    console.log('2. Checking users...')
    const userCount = await prisma.user.count()
    console.log(`   📊 Total users: ${userCount}`)
    
    if (userCount === 0) {
      console.log('   ❌ No users found in database')
      console.log('   💡 Run: npx tsx scripts/seed-demo-users.ts\n')
      return
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        familyId: true
      }
    })

    console.log('   Users found:')
    users.forEach((user: { email: string; role: string; familyId: string | null }) => {
      console.log(`   - ${user.email} (${user.role}) - Family: ${user.familyId}`)
    })
    console.log()

    // Check families
    console.log('3. Checking families...')
    const familyCount = await prisma.family.count()
    console.log(`   📊 Total families: ${familyCount}`)
    
    if (familyCount === 0) {
      console.log('   ❌ No families found in database')
      console.log('   💡 Run: npx tsx scripts/seed-demo-users.ts\n')
      return
    }

    const families = await prisma.family.findMany({
      include: {
        users: {
          select: {
            email: true,
            role: true
          }
        }
      }
    })

    console.log('   Families found:')
    families.forEach((family: { id: string; name: string; users: Array<{ email: string; role: string }> }) => {
      console.log(`   - ${family.name} (ID: ${family.id})`)
      console.log(`     Members: ${family.users.length}`)
      family.users.forEach((user: { email: string; role: string }) => {
        console.log(`       • ${user.email} (${user.role})`)
      })
    })
    console.log()

    // Check FamilyMembership table
    console.log('4. Checking FamilyMembership table...')
    let familyMembershipExists = false
    let membershipCount = 0
    
    try {
      membershipCount = await prisma.familyMembership.count()
      familyMembershipExists = true
      console.log(`   📊 Total family memberships: ${membershipCount}`)
      
      if (membershipCount === 0) {
        console.log('   ⚠️  FamilyMembership table exists but is empty')
        console.log('   💡 Run: npx tsx scripts/migrate-to-multiple-families.ts')
      } else {
        const memberships = await prisma.familyMembership.findMany({
          include: {
            user: {
              select: {
                email: true,
                role: true
              }
            },
            family: {
              select: {
                name: true
              }
            }
          }
        })

        console.log('   Memberships found:')
        memberships.forEach((membership: { user: { email: string; role: string }; family: { name: string }; role: string; isActive: boolean; isPrimary: boolean }) => {
          console.log(`   - ${membership.user.email} in ${membership.family.name} (${membership.role}, Active: ${membership.isActive}, Primary: ${membership.isPrimary})`)
        })
      }
    } catch (error) {
      console.log('   ❌ FamilyMembership table does not exist')
      console.log('   💡 This is normal for older database schemas. The dashboard should use fallback logic.')
    }
    console.log()

    // Check chores
    console.log('5. Checking chores...')
    const choreCount = await prisma.chore.count()
    console.log(`   📊 Total chores: ${choreCount}`)
    
    if (choreCount === 0) {
      console.log('   ⚠️  No chores found')
      console.log('   💡 This is normal for new families. Chores can be added via the dashboard.')
    } else {
      const chores = await prisma.chore.findMany({
        include: {
          family: {
            select: {
              name: true
            }
          }
        }
      })

      console.log('   Chores found:')
      chores.forEach((chore: { title: string; reward: Prisma.Decimal; family: { name: string } }) => {
        console.log(`   - "${chore.title}" in ${chore.family.name} ($${chore.reward.toNumber()})`)
      })
    }
    console.log()

    // Test the dashboard API logic for each parent
    console.log('6. Testing dashboard API logic...')
    const parents = users.filter((u: { role: string; email: string; id: string }) => u.role === 'PARENT')
    
    for (const parent of parents) {
      console.log(`   Testing for parent: ${parent.email}`)
      
      try {
        // Simulate the dashboard API logic
        let familyMembership = null
        
        if (familyMembershipExists) {
          familyMembership = await prisma.familyMembership.findFirst({
            where: {
              userId: parent.id,
              isActive: true
            }
          })
        }

        if (!familyMembership) {
          const user = await prisma.user.findUnique({
            where: { id: parent.id },
            include: {
              family: {
                include: {
                  users: true
                }
              }
            }
          })

          if (user?.family) {
            console.log(`   ✅ Dashboard would work using fallback (direct family relationship)`)
            console.log(`      Family: ${user.family.name} with ${user.family.users.length} members`)
          } else {
            console.log(`   ❌ Dashboard would fail - no family found`)
          }
        } else {
          console.log(`   ✅ Dashboard would work using FamilyMembership`)
        }
      } catch (error) {
        console.log(`   ❌ Dashboard would fail with error: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    console.log('\n🎉 Diagnosis complete!')
    
    if (userCount === 0 || familyCount === 0) {
      console.log('\n📋 Next steps:')
      console.log('1. Run: npx tsx scripts/seed-demo-users.ts')
      console.log('2. Try accessing the dashboard again')
    } else if (familyMembershipExists && membershipCount === 0) {
      console.log('\n📋 Next steps:')
      console.log('1. Run: npx tsx scripts/migrate-to-multiple-families.ts')
      console.log('2. Try accessing the dashboard again')
    } else {
      console.log('\n📋 The dashboard should be working. If you still see "No dashboard data available":')
      console.log('1. Check the browser console for specific error messages')
      console.log('2. Verify the DATABASE_URL environment variable is correct')
      console.log('3. Make sure you are logged in as a PARENT user')
    }

  } catch (error) {
    console.error('❌ Diagnosis failed:', error)
    
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    if (errorMessage.includes('Environment variable not found: DATABASE_URL')) {
      console.log('\n💡 DATABASE_URL is not set. Please:')
      console.log('1. Copy .env.example to .env (if it exists)')
      console.log('2. Set DATABASE_URL in your .env file')
      console.log('3. Make sure your database server is running')
    } else if (errorMessage.includes("Can't reach database server")) {
      console.log('\n💡 Cannot connect to database. Please:')
      console.log('1. Check your DATABASE_URL in .env file')
      console.log('2. Make sure your database server is running')
      console.log('3. Run database migrations if needed: npx prisma migrate dev')
    }
  } finally {
    await prisma.$disconnect()
  }
}

// Run the diagnosis
if (require.main === module) {
  diagnoseDashboardIssue().catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  })
}

export { diagnoseDashboardIssue }