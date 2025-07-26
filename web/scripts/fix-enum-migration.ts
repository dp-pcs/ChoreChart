#!/usr/bin/env tsx

/**
 * Fix Enum Migration Issues
 * This script fixes PostgreSQL enum type issues that may be causing login failures
 */

import { PrismaClient, Prisma } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function fixEnumMigration() {
  console.log('🔧 Fixing PostgreSQL enum migration issues...\n')

  try {
    await prisma.$connect()
    console.log('✅ Database connection successful\n')

    // Check and fix all enum types
    const enumFixes = [
      {
        name: 'ImpromptuSubmissionStatus',
        values: ['PENDING', 'ACKNOWLEDGED', 'REWARDED', 'DENIED'],
        table: 'impromptu_submissions',
        column: 'status',
        default: 'PENDING'
      },
      {
        name: 'BehaviorSeverity',
        values: ['MINOR', 'MODERATE', 'MAJOR'],
        table: 'corrective_behaviors',
        column: 'severity',
        default: 'MINOR'
      },
      {
        name: 'BehaviorStatus',
        values: ['NOTED', 'ACTION_TAKEN', 'RESOLVED'],
        table: 'corrective_behaviors',
        column: 'status',
        default: 'NOTED'
      }
    ]

    for (const enumDef of enumFixes) {
      console.log(`Checking enum: ${enumDef.name}`)
      
      try {
        // Test if enum exists by trying to use it
        await prisma.$queryRaw`SELECT unnest(enum_range(NULL::public."${Prisma.raw(enumDef.name)}"))`
        console.log(`   ✅ ${enumDef.name} enum exists`)
      } catch (error) {
        console.log(`   ⚠️  ${enumDef.name} enum missing, creating...`)
        
        // Create the enum type
        const enumValues = enumDef.values.map(v => `'${v}'`).join(', ')
        await prisma.$executeRaw`
          DO $$ BEGIN
              CREATE TYPE "public"."${Prisma.raw(enumDef.name)}" AS ENUM (${Prisma.raw(enumValues)});
          EXCEPTION
              WHEN duplicate_object THEN null;
          END $$;
        `
        console.log(`   ✅ ${enumDef.name} enum created`)
      }

      // Check if table column is using the enum type
      try {
        const columnInfo = await prisma.$queryRaw`
          SELECT data_type, udt_name 
          FROM information_schema.columns 
          WHERE table_name = ${enumDef.table} 
          AND column_name = ${enumDef.column}
        `
        
        const column = (columnInfo as any[])[0]
        if (column && column.data_type === 'USER-DEFINED' && column.udt_name === enumDef.name) {
          console.log(`   ✅ Column ${enumDef.table}.${enumDef.column} uses ${enumDef.name} enum`)
        } else {
          console.log(`   🔧 Updating column ${enumDef.table}.${enumDef.column} to use ${enumDef.name} enum...`)
          
          // Update the column to use the enum type
          await prisma.$executeRaw`
            ALTER TABLE "${Prisma.raw(enumDef.table)}" 
                ALTER COLUMN "${Prisma.raw(enumDef.column)}" DROP DEFAULT,
                ALTER COLUMN "${Prisma.raw(enumDef.column)}" TYPE "public"."${Prisma.raw(enumDef.name)}" 
                USING "${Prisma.raw(enumDef.column)}"::"public"."${Prisma.raw(enumDef.name)}",
                ALTER COLUMN "${Prisma.raw(enumDef.column)}" SET DEFAULT '${Prisma.raw(enumDef.default)}';
          `
          console.log(`   ✅ Column updated to use enum type`)
        }
      } catch (error) {
        console.log(`   ⚠️  Column check/update failed: ${(error as Error).message}`)
        
        // If the table doesn't exist, that's also a problem
        try {
          await prisma.$queryRaw`SELECT 1 FROM "${Prisma.raw(enumDef.table)}" LIMIT 1`
        } catch (tableError) {
          console.log(`   ❌ Table ${enumDef.table} doesn't exist or is inaccessible`)
        }
      }
    }

    // Test basic operations on tables that use enums
    console.log('\nTesting enum-dependent operations...')
    
    try {
      // Test impromptu submissions
      const impSubmissionCount = await prisma.impromptuSubmission.count()
      console.log(`   ✅ ImpromptuSubmission table accessible (${impSubmissionCount} records)`)
    } catch (error) {
      console.log(`   ❌ ImpromptuSubmission table error: ${(error as Error).message}`)
    }

    try {
      // Test corrective behaviors
      const behaviorCount = await prisma.correctiveBehavior.count()
      console.log(`   ✅ CorrectiveBehavior table accessible (${behaviorCount} records)`)
    } catch (error) {
      console.log(`   ❌ CorrectiveBehavior table error: ${(error as Error).message}`)
    }

    console.log('\n🎉 Enum migration fix complete!')
    
  } catch (error) {
    console.error('❌ Error during enum fix:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  fixEnumMigration()
}