#!/usr/bin/env tsx

/**
 * Fix Authentication Password Issues
 * This script ensures demo users have the correct password format for authentication
 */

import { PrismaClient } from '../src/generated/prisma'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function fixAuthPasswords() {
  console.log('🔧 Fixing authentication password issues...\n')

  try {
    await prisma.$connect()
    console.log('✅ Database connection successful\n')

    // Find demo users
    const demoUsers = await prisma.user.findMany({
      where: {
        email: {
          in: ['parent@demo.com', 'child@demo.com']
        }
      }
    })

    console.log(`Found ${demoUsers.length} demo users`)

    for (const user of demoUsers) {
      console.log(`Checking user: ${user.email}`)
      
      // Check if password is already in the right format
      const currentPassword = user.password
      
      if (!currentPassword) {
        console.log(`   ⚠️  User ${user.email} has no password, setting to 'password'`)
        await prisma.user.update({
          where: { id: user.id },
          data: { password: 'password' }
        })
        console.log(`   ✅ Password set for ${user.email}`)
      } else if (currentPassword === 'password') {
        console.log(`   ✅ User ${user.email} has correct plain text password`)
      } else if (currentPassword.startsWith('$2a$') || currentPassword.startsWith('$2b$')) {
        console.log(`   ℹ️  User ${user.email} has hashed password, checking if 'password' matches...`)
        
        try {
          const isValid = await bcrypt.compare('password', currentPassword)
          if (isValid) {
            console.log(`   ✅ Hashed password is correct for ${user.email}`)
          } else {
            console.log(`   ⚠️  Hashed password doesn't match, updating to plain text for demo`)
            await prisma.user.update({
              where: { id: user.id },
              data: { password: 'password' }
            })
            console.log(`   ✅ Password updated for ${user.email}`)
          }
        } catch (error) {
          console.log(`   ❌ Error checking hashed password: ${(error as Error).message}`)
          console.log(`   🔧 Setting to plain text for demo`)
          await prisma.user.update({
            where: { id: user.id },
            data: { password: 'password' }
          })
          console.log(`   ✅ Password updated for ${user.email}`)
        }
      } else {
        console.log(`   ⚠️  User ${user.email} has unknown password format, updating to 'password'`)
        await prisma.user.update({
          where: { id: user.id },
          data: { password: 'password' }
        })
        console.log(`   ✅ Password updated for ${user.email}`)
      }
    }

    // If demo users don't exist, create them
    if (demoUsers.length === 0) {
      console.log('\n⚠️  No demo users found, creating them...')
      
      // Create demo family if it doesn't exist
      let demoFamily = await prisma.family.findFirst({ where: { name: 'Demo Family' } })
      if (!demoFamily) {
        demoFamily = await prisma.family.create({
          data: { name: 'Demo Family' }
        })
        console.log('   ✅ Demo family created')
      }

      // Create demo users
      const newUsers = [
        {
          email: 'parent@demo.com',
          name: 'Demo Parent',
          password: 'password',
          role: 'PARENT' as const,
          familyId: demoFamily.id
        },
        {
          email: 'child@demo.com',
          name: 'Noah (Demo Child)',
          password: 'password',
          role: 'CHILD' as const,
          familyId: demoFamily.id
        }
      ]

      for (const userData of newUsers) {
        await prisma.user.create({ data: userData })
        console.log(`   ✅ Created demo user: ${userData.email}`)
      }
    }

    // Test authentication logic
    console.log('\n🧪 Testing authentication...')
    const testUser = await prisma.user.findUnique({
      where: { email: 'parent@demo.com' },
      include: { family: true }
    })

    if (testUser) {
      console.log(`   ✅ Demo parent found: ${testUser.name}`)
      console.log(`   ✅ Family: ${testUser.family?.name}`)
      console.log(`   ✅ Password: ${testUser.password === 'password' ? 'Plain text (correct for demo)' : 'Hashed/Other'}`)
    } else {
      console.log('   ❌ Demo parent not found after fix')
    }

    console.log('\n🎉 Authentication password fix complete!')
    
  } catch (error) {
    console.error('❌ Error during password fix:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  fixAuthPasswords()
}