# Supabase Setup Steps

## ✅ What I've Done So Far:
1. Updated `.env` file with your Supabase connection strings
2. Updated Prisma schema to use PostgreSQL instead of SQLite
3. Configured connection pooling and direct URL for migrations

## 🔐 What You Need to Do Next:

### Step 1: Update Password in .env
Replace `[YOUR-PASSWORD]` with your actual Supabase password in `web/.env`:

```bash
# Find your password in Supabase Dashboard:
# Project → Settings → Database → Password (or reset it there)

# Then update both lines in .env:
DATABASE_URL="postgresql://postgres.kxppmmbmdxcjkhjabdce:YOUR_ACTUAL_PASSWORD@aws-0-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.kxppmmbmdxcjkhjabdce:YOUR_ACTUAL_PASSWORD@aws-0-us-east-2.pooler.supabase.com:5432/postgres"
```

### Step 2: Run These Commands (in order)
```bash
# 1. Generate Prisma client for PostgreSQL
npx prisma generate

# 2. Run migrations to create tables in Supabase
npx prisma migrate deploy

# 3. Seed demo data into your Supabase database
npx tsx scripts/seed-demo-users.ts

# 4. Run the multiple families migration
npx tsx scripts/migrate-to-multiple-families.ts

# 5. Start the development server
npm run dev
```

### Step 3: Test the Fix
1. Go to `http://localhost:3000`
2. Sign in with: `parent@demo.com` / `password`
3. You should now see the parent dashboard with data instead of "no dashboard info found"

## 🎯 Expected Result:
- ✅ Parent dashboard loads with family data
- ✅ Demo chores and children show up
- ✅ No more "no dashboard info found" error
- ✅ Application uses your Supabase database

## 🔧 If You Get Errors:
1. **Connection Error**: Check that your Supabase password is correct
2. **Migration Error**: Make sure your Supabase project allows connections
3. **Authentication Error**: Verify the connection string format is correct

Let me know when you've updated the password and I can help run the commands!