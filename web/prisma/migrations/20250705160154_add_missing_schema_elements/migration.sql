-- Add missing columns to families table
ALTER TABLE families ADD COLUMN IF NOT EXISTS "allowMultipleParents" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE families ADD COLUMN IF NOT EXISTS "shareReports" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE families ADD COLUMN IF NOT EXISTS "crossFamilyApproval" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE families ADD COLUMN IF NOT EXISTS "enableStreaks" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE families ADD COLUMN IF NOT EXISTS "enableLeaderboard" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE families ADD COLUMN IF NOT EXISTS "enableAchievements" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE families ADD COLUMN IF NOT EXISTS "streakFreezeLimit" INTEGER NOT NULL DEFAULT 3;

-- Add missing columns to users table for password reset functionality
ALTER TABLE users ADD COLUMN IF NOT EXISTS "resetToken" TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "resetTokenExpiry" TIMESTAMP;

-- Create family_memberships table if it doesn't exist
CREATE TABLE IF NOT EXISTS "family_memberships" (
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
);

-- Create unique index for family_memberships
CREATE UNIQUE INDEX IF NOT EXISTS "family_memberships_userId_familyId_key" 
ON "family_memberships"("userId", "familyId");