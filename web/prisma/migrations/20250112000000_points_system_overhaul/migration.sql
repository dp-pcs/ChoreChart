-- Points System Overhaul Migration
-- This migration transitions from integer points to decimal precision
-- and adds banking/ledger functionality

-- First, update existing integer columns to decimal
ALTER TABLE "users" 
  ALTER COLUMN "availablePoints" TYPE DECIMAL(10,2) USING "availablePoints"::DECIMAL(10,2),
  ALTER COLUMN "lifetimePoints" TYPE DECIMAL(10,2) USING "lifetimePoints"::DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "bankedPoints" DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "bankedMoney" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Update chores to use decimal for rewards and points
ALTER TABLE "chores"
  ALTER COLUMN "reward" TYPE DECIMAL(10,2) USING "reward"::DECIMAL(10,2),
  ALTER COLUMN "points" TYPE DECIMAL(10,2) USING "points"::DECIMAL(10,2);

-- Update chore submissions
ALTER TABLE "chore_submissions"
  ALTER COLUMN "partialReward" TYPE DECIMAL(10,2) USING "partialReward"::DECIMAL(10,2),
  ALTER COLUMN "pointsAwarded" TYPE DECIMAL(10,2) USING "pointsAwarded"::DECIMAL(10,2);

-- Update chore approvals
ALTER TABLE "chore_approvals"
  ALTER COLUMN "partialReward" TYPE DECIMAL(10,2) USING "partialReward"::DECIMAL(10,2),
  ALTER COLUMN "originalReward" TYPE DECIMAL(10,2) USING "originalReward"::DECIMAL(10,2),
  ALTER COLUMN "pointsAwarded" TYPE DECIMAL(10,2) USING "pointsAwarded"::DECIMAL(10,2),
  ALTER COLUMN "originalPoints" TYPE DECIMAL(10,2) USING "originalPoints"::DECIMAL(10,2);

-- Update impromptu submissions
ALTER TABLE "impromptu_submissions"
  ALTER COLUMN "pointsAwarded" TYPE DECIMAL(10,2) USING "pointsAwarded"::DECIMAL(10,2);

-- Update parental feedback
ALTER TABLE "parental_feedback"
  ALTER COLUMN "points" TYPE DECIMAL(10,2) USING "points"::DECIMAL(10,2);

-- Create new enums for banking system
CREATE TYPE "PointTransactionType" AS ENUM (
  'EARNED',
  'BANKING_REQUEST',
  'BANKING_APPROVED',
  'BANKING_DENIED',
  'DEDUCTION',
  'BONUS',
  'TRANSFER',
  'ADJUSTMENT'
);

CREATE TYPE "TransactionStatus" AS ENUM (
  'PENDING',
  'APPROVED',
  'DENIED',
  'COMPLETED',
  'CANCELLED'
);

CREATE TYPE "ChoreCompletionStatus" AS ENUM (
  'ASSIGNED',
  'COMPLETED',
  'NOT_COMPLETED',
  'EXCUSED',
  'DEFERRED',
  'OVERDUE'
);

CREATE TYPE "ParentAction" AS ENUM (
  'EXCUSE',
  'DENY_INCOMPLETE',
  'DEFER',
  'APPROVE_INCOMPLETE'
);

-- Create point transactions table for banking system
CREATE TABLE IF NOT EXISTS "point_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "type" "PointTransactionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "processedBy" TEXT,
    "description" TEXT NOT NULL,
    "moneyValue" DECIMAL(10,2),
    "pointRate" DECIMAL(10,2),
    CONSTRAINT "point_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "point_transactions_processedBy_fkey" FOREIGN KEY ("processedBy") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create chore completions table for better tracking
CREATE TABLE IF NOT EXISTS "chore_completions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "choreId" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "status" "ChoreCompletionStatus" NOT NULL DEFAULT 'ASSIGNED',
    "submittedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "reason" TEXT,
    "parentAction" "ParentAction",
    "actionBy" TEXT,
    "actionAt" TIMESTAMP(3),
    "deferredTo" TIMESTAMP(3),
    "points" DECIMAL(10,2),
    CONSTRAINT "chore_completions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "chore_completions_actionBy_fkey" FOREIGN KEY ("actionBy") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "point_transactions_userId_idx" ON "point_transactions"("userId");
CREATE INDEX IF NOT EXISTS "point_transactions_familyId_idx" ON "point_transactions"("familyId");
CREATE INDEX IF NOT EXISTS "point_transactions_status_idx" ON "point_transactions"("status");
CREATE INDEX IF NOT EXISTS "point_transactions_type_idx" ON "point_transactions"("type");

CREATE UNIQUE INDEX IF NOT EXISTS "chore_completions_userId_choreId_scheduledDate_key" ON "chore_completions"("userId", "choreId", "scheduledDate");
CREATE INDEX IF NOT EXISTS "chore_completions_userId_idx" ON "chore_completions"("userId");
CREATE INDEX IF NOT EXISTS "chore_completions_choreId_idx" ON "chore_completions"("choreId");
CREATE INDEX IF NOT EXISTS "chore_completions_status_idx" ON "chore_completions"("status");
CREATE INDEX IF NOT EXISTS "chore_completions_scheduledDate_idx" ON "chore_completions"("scheduledDate");