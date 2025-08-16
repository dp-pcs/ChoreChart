import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkUsers() {
  try {
    console.log('🔍 Checking database users...')

    // Get all users
    const users = await prisma.user.findMany({
      include: {
        family: true
      }
    })

    console.log('\n📊 Database Users:')
    console.log(`Found ${users.length} users\n`)

    for (const user of users) {
      console.log(`👤 ${user.name}`)
      console.log(`   📧 Email: ${user.email}`)
      console.log(`   🎭 Role: ${user.role}`)
      console.log(`   🏠 Family: ${user.family?.name || 'No family'}`)
      console.log(`   🔐 Has Password: ${!!user.password}`)
      console.log(`   📅 Created: ${user.createdAt}`)
      console.log('')
    }

    // Check if demo users exist
    const parentDemo = users.find((u: { email: string; id: string; familyId: string | null }) => u.email === 'parent@demo.com')
    const childDemo = users.find((u: { email: string; id: string; familyId: string | null }) => u.email === 'child@demo.com')

    console.log('🎯 Demo User Status:')
    console.log(`   Parent Demo (parent@demo.com): ${parentDemo ? '✅ EXISTS' : '❌ MISSING'}`)
    console.log(`   Child Demo (child@demo.com): ${childDemo ? '✅ EXISTS' : '❌ MISSING'}`)

    if (parentDemo) {
      console.log(`   Parent ID: ${parentDemo.id}`)
      console.log(`   Parent Family ID: ${parentDemo.familyId}`)
    }

    if (childDemo) {
      console.log(`   Child ID: ${childDemo.id}`)
      console.log(`   Child Family ID: ${childDemo.familyId}`)
    }

  } catch (error) {
    console.error('❌ Error checking users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers().catch(console.error) 