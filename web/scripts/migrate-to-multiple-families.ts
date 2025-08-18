#!/usr/bin/env tsx

/**
 * Migration script to populate FamilyMembership table for existing users
 * This ensures backward compatibility when transitioning to multiple family support
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateExistingUsers() {
  console.log('🚀 Starting migration to multiple families support...')

  try {
    // Check if FamilyMembership table exists
    let familyMembershipExists = false
    try {
      await prisma.$queryRaw`SELECT 1 FROM family_memberships LIMIT 1`
      familyMembershipExists = true
    } catch (error) {
      console.log('ℹ️ FamilyMembership table does not exist yet - migration not needed')
      return
    }

    if (!familyMembershipExists) {
      console.log('ℹ️ FamilyMembership table not available, skipping migration')
      return
    }

    // Get all existing users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        familyId: true,
        role: true,
        name: true,
        email: true
      }
    })

    console.log(`📊 Found ${users.length} users to migrate`)

    let migratedCount = 0
    let skippedCount = 0

    for (const user of users) {
      // Check if user already has a family membership
      const existingMembership = await prisma.familyMembership.findUnique({
        where: {
          userId_familyId: {
            userId: user.id,
            familyId: user.familyId
          }
        }
      })

      if (existingMembership) {
        console.log(`⏭️  Skipping ${user.email} - already has membership`)
        skippedCount++
        continue
      }

      // Create family membership based on their current family and role
      await prisma.familyMembership.create({
        data: {
          userId: user.id,
          familyId: user.familyId,
          role: user.role,
          isActive: true,
          isPrimary: true, // First membership is primary
          canInvite: user.role === 'PARENT', // Parents can invite by default
          canManage: user.role === 'PARENT', // Parents can manage by default
          permissions: user.role === 'PARENT' ? {
            canApprove: true,
            canCreateChores: true,
            canEditFamily: true,
            canViewReports: true
          } : {
            canSubmitChores: true,
            canViewOwnProgress: true
          }
        }
      })

      console.log(`✅ Migrated ${user.email} (${user.role})`)
      migratedCount++
    }

    // Update family settings to allow multiple parents by default (if columns exist)
    let familyUpdateResult = { count: 0 }
    try {
      // Check if the new family columns exist
      await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'families' AND column_name = 'allowMultipleParents' LIMIT 1`
      
      familyUpdateResult = await prisma.family.updateMany({
        data: {
          allowMultipleParents: true,
          shareReports: false, // Conservative default
          crossFamilyApproval: false // Conservative default
        }
      })

      console.log(`📋 Updated ${familyUpdateResult.count} families with new settings`)
    } catch (error) {
      console.log('ℹ️ New family columns not available, skipping family settings update')
    }

    console.log('\n🎉 Migration completed successfully!')
    console.log(`✅ Migrated: ${migratedCount} users`)
    console.log(`⏭️  Skipped: ${skippedCount} users`)
    console.log(`🏠 Updated: ${familyUpdateResult.count} families`)

    console.log('\n📋 Next steps:')
    console.log('1. Test the new family membership features')
    console.log('2. Update frontend to use the new family context')
    console.log('3. Consider enabling cross-family features as needed')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Add some demo data for testing multiple families
async function createDemoMultiFamilyData() {
  console.log('\n🎭 Creating demo data for multiple families...')

  try {
    // Create a second family for co-parenting demo (or use existing one)
    let coParentFamily = await prisma.family.findFirst({
      where: {
        name: 'The Johnson Co-Parents'
      }
    })

    if (!coParentFamily) {
      coParentFamily = await prisma.family.create({
        data: {
          name: 'The Johnson Co-Parents',
          allowMultipleParents: true,
          shareReports: true,
          crossFamilyApproval: true
        }
      })
      console.log(`✅ Created demo family: ${coParentFamily.name}`)
    } else {
      console.log(`ℹ️ Demo family already exists: ${coParentFamily.name}`)
    }

    // Find existing demo child to add to the co-parent family
    const demoChild = await prisma.user.findFirst({
      where: {
        email: 'child@demo.com'
      }
    })

    if (demoChild) {
      // Check if child membership already exists
      const existingChildMembership = await prisma.familyMembership.findUnique({
        where: {
          userId_familyId: {
            userId: demoChild.id,
            familyId: coParentFamily.id
          }
        }
      })

      if (!existingChildMembership) {
        // Add child to the co-parent family
        await prisma.familyMembership.create({
          data: {
            userId: demoChild.id,
            familyId: coParentFamily.id,
            role: 'CHILD',
            isActive: true,
            isPrimary: false, // Not primary family
            canInvite: false,
            canManage: false,
            permissions: {
              canSubmitChores: true,
              canViewOwnProgress: true
            }
          }
        })
        console.log(`✅ Added ${demoChild.email} to co-parent family`)
      } else {
        console.log(`ℹ️ Child already has membership in co-parent family`)
      }
    }

    // Create a second parent for the co-parent family (or use existing one)
    let coParent = await prisma.user.findUnique({
      where: { email: 'coparent@demo.com' }
    })

    if (!coParent) {
      coParent = await prisma.user.create({
        data: {
          email: 'coparent@demo.com',
          name: 'Co-Parent Demo',
          password: 'password',
          role: 'PARENT',
          familyId: coParentFamily.id
        }
      })
      console.log(`✅ Created co-parent: ${coParent.email}`)
    } else {
      console.log(`ℹ️ Co-parent already exists: ${coParent.email}`)
    }

    // Check if membership already exists
    const existingCoParentMembership = await prisma.familyMembership.findUnique({
      where: {
        userId_familyId: {
          userId: coParent.id,
          familyId: coParentFamily.id
        }
      }
    })

    if (!existingCoParentMembership) {
      await prisma.familyMembership.create({
        data: {
          userId: coParent.id,
          familyId: coParentFamily.id,
          role: 'PARENT',
          isActive: true,
          isPrimary: true,
          canInvite: true,
          canManage: true,
          permissions: {
            canApprove: true,
            canCreateChores: true,
            canEditFamily: true,
            canViewReports: true
          }
        }
      })
      console.log(`✅ Added family membership for co-parent`)
    } else {
      console.log(`ℹ️ Co-parent already has membership in family`)
    }

    console.log('\n🎭 Demo accounts created:')
    console.log('- coparent@demo.com / password (Co-Parent)')
    console.log('- child@demo.com now belongs to both families')

  } catch (error) {
    console.error('❌ Demo data creation failed:', error)
    // Don't throw - this is optional
  }
}

// Main execution
async function main() {
  await migrateExistingUsers()
  await createDemoMultiFamilyData()
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  })
}

export { migrateExistingUsers, createDemoMultiFamilyData }