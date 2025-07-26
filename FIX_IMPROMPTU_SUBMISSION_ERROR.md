# Fix for ImpromptuSubmissionStatus Error

## Problem
When trying to submit an impromptu task from a child account, you get the error:

```
Failed to create impromptu submission: 
Invalid `prisma.impromptuSubmission.create()` invocation:

Error occurred during query execution:
ConnectorError(ConnectorError { user_facing_error: None, kind: QueryError(PostgresError { code: "42704", message: "type \"public.ImpromptuSubmissionStatus\" does not exist", severity: "ERROR", detail: None, column: None, hint: None }), transient: false })
```

## Root Cause
The PostgreSQL database is missing the enum types that are defined in the Prisma schema. The original migration in `20250108000000_enhanced_behavior_system/migration.sql` created the `impromptu_submissions` table with a `TEXT` field for the status column, but the Prisma schema expects an enum type `ImpromptuSubmissionStatus`.

## Solution
A new migration has been created at:
```
/workspace/web/prisma/migrations/20250109000000_create_missing_enums/migration.sql
```

This migration:
1. Creates the missing PostgreSQL enum types:
   - `ImpromptuSubmissionStatus` (PENDING, ACKNOWLEDGED, REWARDED, DENIED)
   - `BehaviorSeverity` (MINOR, MODERATE, MAJOR)  
   - `BehaviorStatus` (NOTED, ACTION_TAKEN, RESOLVED)

2. Updates the existing tables to use the proper enum types:
   - `impromptu_submissions.status` → `ImpromptuSubmissionStatus`
   - `corrective_behaviors.severity` → `BehaviorSeverity`
   - `corrective_behaviors.status` → `BehaviorStatus`

## How to Apply the Fix

### Option 1: Run Prisma Migration (Recommended)
```bash
cd /workspace/web
npx prisma migrate deploy
```

### Option 2: Apply SQL Manually
If you have direct database access, you can run the SQL from the migration file directly:
```bash
psql your_database < prisma/migrations/20250109000000_create_missing_enums/migration.sql
```

### Option 3: Reset and Recreate (Development Only)
If this is a development environment, you can reset the database:
```bash
cd /workspace/web
npx prisma migrate reset
```

## Verification
After applying the migration, you can verify the fix by:
1. Trying to submit an impromptu task from a child account
2. Checking that the enum types exist in your database:
   ```sql
   SELECT typname FROM pg_type WHERE typtype = 'e';
   ```

## Prevention
This issue occurred because the original migration used `TEXT` fields instead of creating proper PostgreSQL enums. In the future, when adding new enum types to the Prisma schema, ensure that the migration properly creates the enum types in PostgreSQL.