import { prisma as defaultPrisma } from '@/lib/prisma'

/**
 * Resolve the active familyId for a user.
 * - Prefer primary active FamilyMembership
 * - Fallback to the user's direct familyId
 */
export async function getActiveFamilyId(userId: string, prisma = defaultPrisma): Promise<string | null> {
  // Try primary active membership first
  const primary = await prisma.familyMembership.findFirst({
    where: { userId, isActive: true, isPrimary: true },
    select: { familyId: true }
  })
  if (primary?.familyId) return primary.familyId

  // Fallback to any active membership
  const anyActive = await prisma.familyMembership.findFirst({
    where: { userId, isActive: true },
    select: { familyId: true }
  })
  if (anyActive?.familyId) return anyActive.familyId

  // Last resort: direct user.familyId
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { familyId: true }
  })
  return user?.familyId ?? null
}

/**
 * Ensure the user is a parent in the given family (by membership or direct role+familyId).
 */
export async function ensureParentInFamily(userId: string, familyId: string, prisma = defaultPrisma): Promise<boolean> {
  const membership = await prisma.familyMembership.findFirst({
    where: { userId, familyId, isActive: true, role: 'PARENT' }
  })
  if (membership) return true

  const user = await prisma.user.findFirst({
    where: { id: userId, familyId, role: 'PARENT' }
  })
  return !!user
}


