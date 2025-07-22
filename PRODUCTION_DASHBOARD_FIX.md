# Production Dashboard Fix Guide

## 🚨 Current Issue
The dashboard is returning **500 Internal Server Error** in production due to missing database schema fields for the scoring system.

**Error in browser console:**
```
GET https://chorbie.app/api/dashboard/parent/ 500 (Internal Server Error)
Error fetching dashboard data: Error: Failed to fetch dashboard data
```

## 🔍 Root Cause
The recent scoring system implementation added new database fields that exist locally but **haven't been applied to the production database** yet:

- `chore_submissions.score` (INTEGER)
- `chore_submissions.partialReward` (INTEGER) 
- `chore_approvals.score` (INTEGER)
- `chore_approvals.partialReward` (INTEGER)
- `chore_approvals.originalReward` (INTEGER)

## ✅ Solutions

### Option 1: Automatic Migration During Build (Recommended)
Add the migration script to the Amplify build process:

1. **Update `amplify.yml`** to include the migration step:
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
        - npx tsx scripts/add-scoring-system-schema.ts  # Add this line
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

### Option 2: Manual Database Update
Connect to the production database and run:

```sql
-- Add scoring fields to chore_submissions
ALTER TABLE chore_submissions 
ADD COLUMN IF NOT EXISTS score INTEGER,
ADD COLUMN IF NOT EXISTS "partialReward" INTEGER;

-- Add scoring fields to chore_approvals  
ALTER TABLE chore_approvals 
ADD COLUMN IF NOT EXISTS score INTEGER,
ADD COLUMN IF NOT EXISTS "partialReward" INTEGER,
ADD COLUMN IF NOT EXISTS "originalReward" INTEGER;
```

### Option 3: Deploy with Migration Script
Ensure the migration script runs in production by using the AWS Systems Manager or running it via Amplify console:

```bash
cd web
npx tsx scripts/add-scoring-system-schema.ts
```

## 🛠️ Files Available for Diagnosis

### Production Debug Script
Run this in production to diagnose the exact issue:
```bash
cd web
npx tsx scripts/production-dashboard-debug.ts
```

This will check:
- Database connectivity
- Table existence  
- Column existence
- Query compatibility
- Environment variables

### Schema Migration Script
Apply the database changes:
```bash
cd web
npx tsx scripts/add-scoring-system-schema.ts
```

## 📋 Verification Steps

After applying the fix:

1. **Check API Response**: Visit `/api/dashboard/parent/` - should return data instead of 500 error
2. **Check Dashboard**: Parent dashboard should load without errors
3. **Check Console**: No more "Failed to fetch dashboard data" errors
4. **Run Debug Script**: Should show all green checkmarks

## 🔄 Expected Results

After the fix:
- ✅ Dashboard loads successfully
- ✅ No 500 errors in browser console
- ✅ Scoring system features work properly
- ✅ All existing functionality remains intact

## 📞 Next Steps

1. **Immediate**: Apply database schema changes to production
2. **Long-term**: Set up automated migrations in the CI/CD pipeline
3. **Monitoring**: Run the debug script periodically to catch issues early

The build and code are working correctly - this is purely a database schema synchronization issue. 