-- Add isActive column to chores table
ALTER TABLE "chores" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;