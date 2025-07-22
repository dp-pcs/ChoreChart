# Dashboard Troubleshooting Guide

## Problem: "No dashboard data available"

This error occurs when the parent dashboard cannot load family data. This guide will help you diagnose and fix the issue.

## Quick Diagnosis

Run the diagnostic script to identify the specific issue:

```bash
cd web
npx tsx scripts/diagnose-dashboard-issue.ts
```

## Common Causes & Solutions

### 1. Database Connection Issues

**Symptoms:**
- "Cannot reach database server" error
- "Environment variable not found: DATABASE_URL" error

**Solution:**
1. Create a `.env` file in the `web/` directory:
   ```bash
   DATABASE_URL="postgresql://username:password@localhost:5432/chorechart"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-here"
   ```

2. Update the `DATABASE_URL` with your actual database credentials

3. Ensure your database server is running

### 2. No Users or Families in Database

**Symptoms:**
- Dashboard loads but shows "No dashboard data available"
- Diagnostic script shows 0 users or 0 families

**Solution:**
```bash
cd web
npx tsx scripts/seed-demo-users.ts
```

This creates:
- Demo family "The Demo Family"
- Parent account: `parent@demo.com` / `password`
- Child account: `child@demo.com` / `password`

### 3. Missing FamilyMembership Records

**Symptoms:**
- Users exist but dashboard still shows no data
- Diagnostic shows FamilyMembership table exists but is empty

**Solution:**
```bash
cd web
npx tsx scripts/migrate-to-multiple-families.ts
```

This populates the FamilyMembership table for existing users.

### 4. User Not Associated with a Family

**Symptoms:**
- User can log in but gets "No family found for user" error
- User exists but has no `familyId` or invalid `familyId`

**Solution:**
1. Check user's family association in database
2. Run the seed script to create demo data
3. Or manually update user's `familyId` in database

### 5. Database Schema Out of Date

**Symptoms:**
- Various database-related errors
- Missing tables or columns

**Solution:**
```bash
cd web
npx prisma migrate dev
npx prisma generate
```

## Manual Testing Steps

### 1. Check Database Connection
```bash
cd web
npx prisma studio
```
This opens a database browser to verify:
- Users table has records
- Families table has records
- Users have valid familyId values

### 2. Test API Endpoint Directly
Visit: `http://localhost:3000/api/dashboard/parent`

You should see either:
- JSON data with family information (success)
- Error message indicating specific issue

### 3. Check Browser Console
1. Open browser developer tools (F12)
2. Go to Console tab
3. Look for error messages when loading dashboard
4. Note any 401, 403, or 500 errors

## API Error Codes

| Error Code | Meaning | Solution |
|------------|---------|----------|
| 401 | Not authenticated | Login again |
| 403 | Not a parent user | Login as parent user |
| 404 with `NO_FAMILY` | No family found | Run seed script or fix user's familyId |
| 500 | Database/server error | Check logs and database connection |

## Troubleshooting by User Role

### For Parents
- Must be logged in with `role: "PARENT"`
- Must have a valid `familyId`
- Family must exist in database

### For Development
1. Use demo accounts: `parent@demo.com` / `password`
2. Ensure database is seeded with demo data
3. Check environment variables are set correctly

## Advanced Debugging

### Enable Detailed Logging
Add to your `.env` file:
```bash
DEBUG=prisma:*
NODE_ENV=development
```

### Check Database Manually
```sql
-- Check users
SELECT id, email, role, "familyId" FROM users;

-- Check families
SELECT id, name, "weeklyAllowance" FROM families;

-- Check family memberships (if table exists)
SELECT * FROM family_memberships;
```

### Verify API Response
```javascript
// In browser console
fetch('/api/dashboard/parent')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

## After Fixing

1. Clear browser cache and cookies
2. Restart the development server
3. Test with demo accounts
4. Verify dashboard loads correctly

## Get Help

If none of these solutions work:

1. Run the diagnostic script and share the output
2. Check the browser console for specific error messages
3. Include your environment setup (local DB, Docker, cloud, etc.)
4. Share any relevant error logs from the server

## Related Files

- API: `web/src/app/api/dashboard/parent/route.ts`
- Frontend: `web/src/app/dashboard/parent/page.tsx`
- Database: `web/prisma/schema.prisma`
- Seeding: `web/scripts/seed-demo-users.ts`
- Migration: `web/scripts/migrate-to-multiple-families.ts`