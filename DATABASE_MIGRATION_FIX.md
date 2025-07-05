# Database Migration Fix - ChoreChart Project

## Problem
The deployment was failing with the following error:
```
Error: P3019
The datasource provider `postgresql` specified in your schema does not match the one specified in the migration_lock.toml, `sqlite`. Please remove your current migration directory and start a new migration history with prisma migrate dev.
```

## Root Cause
- The Prisma schema was configured for PostgreSQL
- The migration lock file still specified SQLite as the provider
- The migration SQL file contained SQLite-specific syntax

## Solution Applied

### 1. Updated Migration Lock File
**File**: `web/prisma/migrations/migration_lock.toml`
```diff
- provider = "sqlite"
+ provider = "postgresql"
```

### 2. Updated Migration SQL File
**File**: `web/prisma/migrations/20250703035636_init_with_multiple_parents/migration.sql`

**Changes Made:**
- Changed `DATETIME` → `TIMESTAMP` (PostgreSQL compatible)
- Changed `TEXT NOT NULL PRIMARY KEY` → `TEXT PRIMARY KEY` (PostgreSQL compatible)
- Changed `REAL` → `DOUBLE PRECISION` (PostgreSQL compatible)
- Kept `JSONB` unchanged (PostgreSQL-specific type)
- Kept `CURRENT_TIMESTAMP` unchanged (PostgreSQL compatible)

### 3. Tables Updated
All tables were updated with PostgreSQL-compatible syntax:
- `users`
- `family_memberships`
- `families`
- `chores`
- `chore_assignments`
- `chore_submissions`
- `chore_approvals`
- `messages`
- `rewards`
- `weekly_reports`
- `achievements`
- `user_achievements`

## Expected Result
The deployment should now succeed as:
1. The migration lock file correctly specifies PostgreSQL
2. The migration SQL uses PostgreSQL-compatible syntax
3. The schema configuration matches the migration provider

## Verification
The build process should now successfully run:
```bash
npx prisma migrate deploy
```

This fix ensures consistency between the Prisma schema configuration and the migration files, resolving the P3019 provider mismatch error.