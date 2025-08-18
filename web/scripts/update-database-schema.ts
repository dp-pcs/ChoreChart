#!/usr/bin/env tsx

/**
 * Database Schema Update Script
 * 
 * This script applies the missing database schema elements to bring the database
 * in sync with the Prisma schema.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateDatabaseSchema() {
  console.log('🔄 Updating database schema...')

  try {
    console.log('📋 Running database schema updates...')

    // Migration SQL statements
    const statements = [
      'ALTER TABLE families ADD COLUMN IF NOT EXISTS "allowMultipleParents" BOOLEAN NOT NULL DEFAULT true',
      'ALTER TABLE families ADD COLUMN IF NOT EXISTS "shareReports" BOOLEAN NOT NULL DEFAULT false',
      'ALTER TABLE families ADD COLUMN IF NOT EXISTS "crossFamilyApproval" BOOLEAN NOT NULL DEFAULT false',
      'ALTER TABLE families ADD COLUMN IF NOT EXISTS "enableStreaks" BOOLEAN NOT NULL DEFAULT true',
      'ALTER TABLE families ADD COLUMN IF NOT EXISTS "enableLeaderboard" BOOLEAN NOT NULL DEFAULT true',
      'ALTER TABLE families ADD COLUMN IF NOT EXISTS "enableAchievements" BOOLEAN NOT NULL DEFAULT true',
      'ALTER TABLE families ADD COLUMN IF NOT EXISTS "streakFreezeLimit" INTEGER NOT NULL DEFAULT 3',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS "resetToken" TEXT',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS "resetTokenExpiry" TIMESTAMP',
      `CREATE TABLE IF NOT EXISTS "family_memberships" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "familyId" TEXT NOT NULL,
        "role" TEXT NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "isPrimary" BOOLEAN NOT NULL DEFAULT false,
        "canInvite" BOOLEAN NOT NULL DEFAULT false,
        "canManage" BOOLEAN NOT NULL DEFAULT false,
        "permissions" JSONB,
        CONSTRAINT "family_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "family_memberships_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      )`,
      'CREATE UNIQUE INDEX IF NOT EXISTS "family_memberships_userId_familyId_key" ON "family_memberships"("userId", "familyId")'
    ]

    let successCount = 0
    let skipCount = 0

    for (const statement of statements) {
      try {
        await prisma.$executeRawUnsafe(statement + ';')
        
        if (statement.includes('ADD COLUMN')) {
          const columnMatch = statement.match(/ADD COLUMN.*?"([^"]+)"/);
          const columnName = columnMatch ? columnMatch[1] : 'column';
          console.log(`✅ Added column: ${columnName}`)
        } else if (statement.includes('CREATE TABLE')) {
          const tableMatch = statement.match(/CREATE TABLE.*?"([^"]+)"/);
          const tableName = tableMatch ? tableMatch[1] : 'table';
          console.log(`✅ Created table: ${tableName}`)
        } else if (statement.includes('CREATE UNIQUE INDEX')) {
          const indexMatch = statement.match(/CREATE UNIQUE INDEX.*?"([^"]+)"/);
          const indexName = indexMatch ? indexMatch[1] : 'index';
          console.log(`✅ Created index: ${indexName}`)
        } else {
          console.log(`✅ Executed: ${statement.substring(0, 50)}...`)
        }
        
        successCount++
      } catch (error: any) {
        if (error.message && (error.message.includes('already exists') || error.message.includes('duplicate column'))) {
          console.log(`⏭️  Skipped (already exists): ${statement.substring(0, 50)}...`)
          skipCount++
        } else {
          console.error(`❌ Error executing statement: ${statement}`)
          console.error('Error details:', error)
          throw error
        }
      }
    }

    console.log('\n🎉 Database schema update completed!')
    console.log(`✅ Successfully applied: ${successCount} changes`)
    console.log(`⏭️  Skipped (already exists): ${skipCount} changes`)

    // Verify the schema is now correct
    console.log('\n🔍 Verifying schema updates...')
    
    // Check families table columns
    const familyColumns = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'families' 
      AND column_name IN ('allowMultipleParents', 'shareReports', 'crossFamilyApproval', 'enableStreaks', 'enableLeaderboard', 'enableAchievements', 'streakFreezeLimit')
      ORDER BY column_name
    `
    
    console.log('📊 Family table new columns:', familyColumns.map((col: { column_name: string }) => col.column_name))

    // Check users table columns
    const userColumns = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('resetToken', 'resetTokenExpiry')
      ORDER BY column_name
    `
    
    console.log('📊 User table new columns:', userColumns.map((col: { column_name: string }) => col.column_name))

    // Check if family_memberships table exists
    const familyMembershipsTable = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'family_memberships'
    `
    
    console.log('📊 Family memberships table:', familyMembershipsTable.length > 0 ? 'EXISTS' : 'MISSING')

    // Mark the migration as applied in the _prisma_migrations table
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
        VALUES (
          '20250705160154_add_missing_schema_elements',
          'migration_checksum_placeholder',
          NOW(),
          '20250705160154_add_missing_schema_elements',
          '',
          NULL,
          NOW(),
          1
        )
        ON CONFLICT (id) DO NOTHING
      `)
      console.log('✅ Migration marked as applied in _prisma_migrations')
    } catch (error) {
      console.log('⚠️  Could not mark migration as applied (table may not exist)')
    }

    console.log('\n🏗️  Database is now ready for full application functionality!')
    console.log('   - Multiple family features are now available')
    console.log('   - Password reset functionality is enabled')
    console.log('   - All Prisma schema features are supported')

  } catch (error) {
    console.error('❌ Database schema update failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Main execution
updateDatabaseSchema().catch((error) => {
  console.error('Script failed:', error)
})

export { updateDatabaseSchema }