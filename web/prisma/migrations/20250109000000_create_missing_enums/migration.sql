-- Create missing enum types that are referenced in the schema but don't exist in the database

-- Create ImpromptuSubmissionStatus enum
DO $$ BEGIN
    CREATE TYPE "public"."ImpromptuSubmissionStatus" AS ENUM ('PENDING', 'ACKNOWLEDGED', 'REWARDED', 'DENIED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create BehaviorSeverity enum
DO $$ BEGIN
    CREATE TYPE "public"."BehaviorSeverity" AS ENUM ('MINOR', 'MODERATE', 'MAJOR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create BehaviorStatus enum
DO $$ BEGIN
    CREATE TYPE "public"."BehaviorStatus" AS ENUM ('NOTED', 'ACTION_TAKEN', 'RESOLVED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update the impromptu_submissions table to use the enum type
ALTER TABLE "impromptu_submissions" 
    ALTER COLUMN "status" DROP DEFAULT,
    ALTER COLUMN "status" TYPE "public"."ImpromptuSubmissionStatus" USING "status"::"public"."ImpromptuSubmissionStatus",
    ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- Update the corrective_behaviors table to use the enum types
ALTER TABLE "corrective_behaviors" 
    ALTER COLUMN "severity" DROP DEFAULT,
    ALTER COLUMN "severity" TYPE "public"."BehaviorSeverity" USING "severity"::"public"."BehaviorSeverity",
    ALTER COLUMN "severity" SET DEFAULT 'MINOR';

ALTER TABLE "corrective_behaviors" 
    ALTER COLUMN "status" DROP DEFAULT,
    ALTER COLUMN "status" TYPE "public"."BehaviorStatus" USING "status"::"public"."BehaviorStatus",
    ALTER COLUMN "status" SET DEFAULT 'NOTED';