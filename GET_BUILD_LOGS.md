# How to Get AWS Amplify Build Logs

## Method 1: Using AWS CLI (Most Detailed)

### Step 1: List Recent Build Jobs
```bash
aws amplify list-jobs --app-id YOUR_APP_ID --branch-name main
```

### Step 2: Get Specific Job Details with Logs
```bash
aws amplify get-job --app-id YOUR_APP_ID --branch-name main --job-id JOB_ID_FROM_STEP_1
```

### Step 3: Find Your App ID and Branch
If you don't know your app ID:
```bash
aws amplify list-apps
```

## Method 2: Using Amplify Console (Web Interface)

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click on your ChoreChart app
3. Click on the branch (likely `main`)
4. Look for recent build attempts in the deployment history
5. Click on the failed build to see detailed logs

## Method 3: Check Build Status in Console

1. **Build History**: Shows all recent builds with status
2. **Build Details**: Click on any build to see:
   - Build logs (preBuild, build, postBuild phases)
   - Error messages
   - Duration and timestamps
   - Environment variables used

## What to Look For

Since environment variables are set up, look for:
- Database connection errors
- Prisma migration failures
- Missing secrets or API keys
- Node.js/npm version issues
- Build timeout errors

## Expected Current Status

With the recent fixes:
- ✅ **useSearchParams issue**: Fixed (Suspense boundary added)
- ✅ **Environment variables**: You confirmed these are set
- ⚠️ **Possible remaining issues**:
  - Database connection problems
  - Prisma schema/migration issues
  - API key validation failures
  - Build timeout (if database operations take too long)

## Quick Check Commands

```bash
# If you have AWS CLI configured
aws amplify list-jobs --app-id YOUR_APP_ID --branch-name main --max-items 5

# This will show the 5 most recent builds with their status
```

## Common Post-Environment-Variable Issues

1. **Database Connection**: Even with `DATABASE_URL` set, connection might fail
2. **Prisma Migrations**: Database schema might be out of sync
3. **API Keys**: OpenAI key might be invalid or have insufficient quota
4. **Build Timeout**: Database operations during build taking too long

## Next Steps

1. **Get the specific error** from recent build logs
2. **Check if it's a database connection issue** (common with Supabase)
3. **Verify API keys are valid** (especially OpenAI)
4. **Check if Prisma migrations are working** in the build environment

---

**Please share the specific error message from your most recent build attempt so I can help diagnose the exact issue!**