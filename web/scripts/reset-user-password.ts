import { PrismaClient } from '../src/generated/prisma'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function resetPassword(email: string, newPassword: string) {
  try {
    console.log(`🔍 Looking for user with email: ${email}`)

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { family: true }
    })

    if (!user) {
      console.error(`❌ User with email "${email}" not found`)
      return false
    }

    console.log(`✅ Found user: ${user.name}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   Family: ${user.family?.name || 'No family'}`)

    // Hash the new password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds)

    // Update the user's password
    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    })

    console.log(`\n🔐 Password successfully reset for ${email}`)
    console.log(`   New password: ${newPassword}`)
    return true

  } catch (error) {
    console.error('❌ Error resetting password:', error)
    return false
  } finally {
    await prisma.$disconnect()
  }
}

// Get email and password from command line arguments
const email = process.argv[2]
const newPassword = process.argv[3] || 'ChoreChart123!'

if (!email) {
  console.log('Usage: npx tsx scripts/reset-user-password.ts <email> [newPassword]')
  console.log('Example: npx tsx scripts/reset-user-password.ts user@example.com MyNewPassword123')
  process.exit(1)
}

resetPassword(email, newPassword).then(success => {
  process.exit(success ? 0 : 1)
})
