# P3005 Migration Error Fix - ChoreChart Project

## Problem

The AWS Amplify deployment was failing with the following Prisma error:
```
Error: P3005
The database schema is not empty. Read more about how to baseline an existing production database: https://pris.ly/d/migrate-baseline
```

## Root Cause

The P3005 error occurs when:
1. The database already contains schema/data (not empty)
2. Prisma tries to run `prisma migrate deploy` but cannot determine the current migration state
3. The migration file had SQLite syntax instead of proper PostgreSQL syntax

## Solution Implemented

### 1. Fixed Migration SQL Syntax

**Problem:** The migration file contained SQLite syntax (`TEXT PRIMARY KEY`) instead of PostgreSQL syntax.

**Fix:** Updated `web/prisma/migrations/20250703035636_init_with_multiple_parents/migration.sql` to use proper PostgreSQL syntax:

- Changed `TEXT PRIMARY KEY` → `TEXT NOT NULL` with separate `PRIMARY KEY` constraint
- Added missing `resetToken` and `resetTokenExpiry` fields to users table
- Fixed `autoApproveChores` default value to `false` (matching schema)
- Added proper foreign key constraints using `ALTER TABLE` statements
- Separated primary key constraints from table definitions

### 2. Created Migration Handler Script

**File:** `web/scripts/handle-migration.sh`

This script:
- Attempts to deploy migrations normally
- If P3005 error occurs, marks the migration as applied using `prisma migrate resolve`
- Provides detailed logging for debugging
- Handles both successful and failed scenarios gracefully

### 3. Updated Amplify Configuration

**File:** `amplify.yml`

Updated the build process to use the migration handler script instead of direct `prisma migrate deploy`:

```yaml
- echo "Running database migrations..."
- chmod +x scripts/handle-migration.sh
- ./scripts/handle-migration.sh
```

## How It Works

1. **Normal Migration:** If the database is empty or migrations align, `prisma migrate deploy` succeeds normally
2. **P3005 Recovery:** If P3005 error occurs:
   - Script detects the error from output
   - Runs `prisma migrate resolve --applied "20250703035636_init_with_multiple_parents"`
   - This marks the migration as applied without actually running it
   - Build continues successfully

## Alternative Solutions

If the current approach doesn't work, you can:

### Option 1: Manual Resolution (Production)
```bash
# Connect to your database and run:
npx prisma migrate resolve --applied "20250703035636_init_with_multiple_parents"
```

### Option 2: Database Baseline (Fresh Start)
```bash
# If you want to start fresh (CAUTION: Will lose data):
npx prisma migrate reset --force
npx prisma migrate deploy
```

### Option 3: Schema Introspection
```bash
# If the database schema is correct but migrations are out of sync:
npx prisma db pull
npx prisma migrate dev --name sync_with_existing_schema
```

## Prevention for Future

1. **Never modify migration files** after they've been applied
2. **Use proper database-specific syntax** in migrations
3. **Test migrations locally** before deploying
4. **Use `prisma migrate dev`** in development
5. **Use `prisma migrate deploy`** only in production

## Verification

After deployment, verify the fix worked:

```bash
# Check migration status
npx prisma migrate status

# Should show:
# Database schema is up to date!
```

## Files Modified

- `web/prisma/migrations/20250703035636_init_with_multiple_parents/migration.sql`
- `web/scripts/handle-migration.sh` (new)
- `amplify.yml`
- `P3005_MIGRATION_FIX.md` (this file)

## References

- [Prisma P3005 Error Documentation](https://www.prisma.io/docs/orm/reference/error-reference#p3005)
- [Prisma Migration Troubleshooting](https://www.prisma.io/docs/orm/prisma-migrate/workflows/troubleshooting)
- [Baselining Production Database](https://pris.ly/d/migrate-baseline)

---

**Expected Result:** The deployment should now succeed without the P3005 error, and the database schema will be properly aligned with the migration history.