-- Enhanced Behavior and Points System Migration

-- Add new user fields for points system
ALTER TABLE "users" 
ADD COLUMN IF NOT EXISTS "availablePoints" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "lifetimePoints" INTEGER NOT NULL DEFAULT 0;

-- Add new family settings for points system
ALTER TABLE "families" 
ADD COLUMN IF NOT EXISTS "pointsToMoneyRate" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
ADD COLUMN IF NOT EXISTS "enablePointsSystem" BOOLEAN NOT NULL DEFAULT true;

-- Add points field to chores
ALTER TABLE "chores" 
ADD COLUMN IF NOT EXISTS "points" INTEGER NOT NULL DEFAULT 0;

-- Add points fields to chore submissions
ALTER TABLE "chore_submissions" 
ADD COLUMN IF NOT EXISTS "pointsAwarded" INTEGER;

-- Add points fields to chore approvals
ALTER TABLE "chore_approvals" 
ADD COLUMN IF NOT EXISTS "pointsAwarded" INTEGER,
ADD COLUMN IF NOT EXISTS "originalPoints" INTEGER;

-- Create ImpromptuSubmission table
CREATE TABLE IF NOT EXISTS "impromptu_submissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "childId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "responseAt" TIMESTAMP(3),
    "parentNote" TEXT,
    "pointsAwarded" INTEGER,
    CONSTRAINT "impromptu_submissions_childId_fkey" FOREIGN KEY ("childId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create RealWorldActivity table
CREATE TABLE IF NOT EXISTS "real_world_activities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "childId" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "points" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "real_world_activities_childId_fkey" FOREIGN KEY ("childId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "real_world_activities_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create CorrectiveBehavior table
CREATE TABLE IF NOT EXISTS "corrective_behaviors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "childId" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "behavior" TEXT NOT NULL,
    "description" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "severity" TEXT NOT NULL DEFAULT 'MINOR',
    "status" TEXT NOT NULL DEFAULT 'NOTED',
    "actionTaken" TEXT,
    "pointsDeducted" INTEGER,
    CONSTRAINT "corrective_behaviors_childId_fkey" FOREIGN KEY ("childId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "corrective_behaviors_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS "impromptu_submissions_childId_idx" ON "impromptu_submissions"("childId");
CREATE INDEX IF NOT EXISTS "impromptu_submissions_status_idx" ON "impromptu_submissions"("status");
CREATE INDEX IF NOT EXISTS "real_world_activities_childId_idx" ON "real_world_activities"("childId");
CREATE INDEX IF NOT EXISTS "real_world_activities_parentId_idx" ON "real_world_activities"("parentId");
CREATE INDEX IF NOT EXISTS "real_world_activities_occurredAt_idx" ON "real_world_activities"("occurredAt");
CREATE INDEX IF NOT EXISTS "corrective_behaviors_childId_idx" ON "corrective_behaviors"("childId");
CREATE INDEX IF NOT EXISTS "corrective_behaviors_parentId_idx" ON "corrective_behaviors"("parentId");
CREATE INDEX IF NOT EXISTS "corrective_behaviors_occurredAt_idx" ON "corrective_behaviors"("occurredAt");
CREATE INDEX IF NOT EXISTS "corrective_behaviors_status_idx" ON "corrective_behaviors"("status");

-- Convert existing rewards to points (assuming 1 dollar = 10 points)
-- This is optional and can be run separately if needed
-- UPDATE "chores" SET "points" = CAST("reward" * 10 AS INTEGER) WHERE "points" = 0 AND "reward" > 0; 