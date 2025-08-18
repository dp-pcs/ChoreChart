import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updatePointsSystem() {
  console.log('Updating families to new points system default...')
  
  try {
    // Update families that have the old default rate of 0.10 to the new default of 1.00
    const result = await prisma.family.updateMany({
      where: {
        pointsToMoneyRate: 0.10
      },
      data: {
        pointsToMoneyRate: 1.00
      }
    })
    
    console.log(`Updated ${result.count} families to new points system (1 point = $1)`)
    
    // Also make sure enablePointsSystem is true for all families
    const enableResult = await prisma.family.updateMany({
      where: {
        enablePointsSystem: false
      },
      data: {
        enablePointsSystem: true
      }
    })
    
    console.log(`Enabled points system for ${enableResult.count} additional families`)
    
  } catch (error) {
    console.error('Error updating points system:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updatePointsSystem() 