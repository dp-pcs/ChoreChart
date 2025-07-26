import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create demo family first
  const family = await prisma.family.create({
    data: {
      name: 'Demo Family',
    },
  })

  // Create demo users
  await prisma.user.createMany({
    data: [
      {
        email: 'parent@demo.com',
        name: 'Demo Parent',
        password: 'password', // Plain text password for development
        role: 'PARENT',
        familyId: family.id,
      },
      {
        email: 'child@demo.com',
        name: 'Noah (Demo Child)',
        password: 'password', // Plain text password for development
        role: 'CHILD',
        familyId: family.id,
      },
    ],
  })

  console.log('✅ Demo family created with users:')
  console.log('- parent@demo.com (password: password)')
  console.log('- child@demo.com (password: password)')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })