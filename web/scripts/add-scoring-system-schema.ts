#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addScoringSystemSchema() {
  console.log('🔄 Adding scoring system schema changes...')
  
  try {
    // Add score and partialReward columns to chore_submissions table
    await prisma.$executeRaw`
      ALTER TABLE chore_submissions 
      ADD COLUMN IF NOT EXISTS score INTEGER,
      ADD COLUMN IF NOT EXISTS "partialReward" INTEGER;
    `
    console.log('✅ Added score and partialReward columns to chore_submissions')

    // Add score, partialReward, and originalReward columns to chore_approvals table
    await prisma.$executeRaw`
      ALTER TABLE chore_approvals 
      ADD COLUMN IF NOT EXISTS score INTEGER,
      ADD COLUMN IF NOT EXISTS "partialReward" INTEGER,
      ADD COLUMN IF NOT EXISTS "originalReward" INTEGER;
    `
    console.log('✅ Added scoring fields to chore_approvals')

    console.log('🎉 Scoring system schema update completed!')
    
  } catch (error) {
    console.error('❌ Error updating schema:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  addScoringSystemSchema()
    .then(() => {
      console.log('📋 Database schema is now ready for scoring system!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Failed to update schema:', error)
      process.exit(1)
    })
}

export { addScoringSystemSchema } 