# ChoreChart - AWS Amplify Deployment Guide

## 🚀 Deploy to AWS Amplify

### Prerequisites
- AWS Account with Amplify access
- GitHub repository (✅ already set up)
- Existing domain: `latentgenius.ai` with main app already on Amplify

## ⚠️ Deployment Path Options

AWS Amplify doesn't support subdirectory deployments for separate apps. Choose one of these approaches:

### Option 1: Subdomain (Recommended - Easiest)
Deploy to: `chorechart.latentgenius.ai` or `apps.latentgenius.ai`

### Option 2: CloudFront Distribution 
Deploy to: `latentgenius.ai/chorechart` (requires CloudFront setup)

---

## 🎯 Option 1: Subdomain Deployment

### Step 1: Create New Amplify App

1. **Go to AWS Amplify Console**
   - Navigate to https://console.aws.amazon.com/amplify/
   - Click "Create new app" (separate from your main site)

2. **Connect Repository**
   - Select "Deploy from Git repository"
   - Choose "GitHub"
   - Select repository: `dp-pcs/ChoreChart`
   - Branch: `main`

3. **Configure Build Settings**
   - **App root directory**: `web`
   - **Build command**: `npm run build`
   - **Output directory**: `.next`
   - Amplify will auto-detect the `amplify.yml` file

### Step 2: Environment Variables

Set these environment variables in Amplify Console:

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# NextAuth.js Configuration (UPDATE THIS URL)
NEXTAUTH_URL=https://chorechart.latentgenius.ai
NEXTAUTH_SECRET=generate_a_secure_random_string_here

# Database Configuration
DATABASE_URL=postgresql://username:password@hostname:port/database_name

# App Configuration
NODE_ENV=production
```

### Step 3: Custom Domain Configuration

1. **In Amplify Console**
   - Go to "Domain management" 
   - Click "Add domain"
   - Enter: `latentgenius.ai`
   - Add subdomain: `chorechart`

2. **DNS Configuration**
   AWS will provide CNAME records to add to your DNS:
   ```
   Type: CNAME
   Name: chorechart
   Value: [provided by AWS Amplify]
   ```

**Result**: App will be available at `https://chorechart.latentgenius.ai`

---

## 🎯 Option 2: CloudFront Distribution (Advanced)

If you specifically need `latentgenius.ai/chorechart`:

### Step 1: Deploy ChoreChart to New Amplify App
Follow Option 1 steps 1-2, but skip custom domain setup.

### Step 2: Configure CloudFront Distribution

1. **Create CloudFront Distribution** (or modify existing)
2. **Add Origin** for ChoreChart Amplify app
   - Origin Domain: `[your-chorechart-app].amplifyapp.com`
   - Origin Path: leave empty

3. **Add Behavior** 
   - Path Pattern: `/chorechart/*`
   - Origin: ChoreChart Amplify app
   - Viewer Protocol Policy: Redirect HTTP to HTTPS
   - Cache Policy: CachingOptimized

4. **Update NEXTAUTH_URL**
   ```bash
   NEXTAUTH_URL=https://latentgenius.ai/chorechart
   ```

### Step 3: Handle Path Prefix in Next.js

For the `/chorechart` path, update `web/next.config.ts`:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/chorechart',
  assetPrefix: '/chorechart',
  trailingSlash: true,
};

export default nextConfig;
```

**Result**: App will be available at `https://latentgenius.ai/chorechart`

---

## 🗄️ Database Setup (Both Options)

**Option A: AWS RDS PostgreSQL (Recommended)**
```bash
# Create RDS PostgreSQL instance
# Get connection string and update DATABASE_URL
DATABASE_URL=postgresql://chordb_user:password@chorechart-db.xyz.us-east-1.rds.amazonaws.com:5432/chorechart
```

**Option B: Supabase (Alternative)**
```bash
# Create Supabase project
# Get connection string from project settings
DATABASE_URL=postgresql://postgres:password@db.xyz.supabase.co:5432/postgres
```

## 🔧 Build Configuration

The `amplify.yml` file is already configured:
- Builds from `/web` directory
- Uses Next.js build process
- Caches `node_modules` and `.next/cache`
- Outputs to `.next` directory

## 🚀 Post-Deployment Setup

1. **Database Migration**
   ```bash
   # After first deployment, run migrations
   npx prisma migrate deploy
   npx tsx scripts/seed-demo-users.ts
   ```

2. **Test Demo Accounts**
   - Parent: `parent@demo.com` / `password`
   - Child: `child@demo.com` / `password`

## 🔒 Security Checklist

- ✅ NEXTAUTH_SECRET is secure random string
- ✅ OPENAI_API_KEY is valid and has sufficient quota
- ✅ Database connection is secure (SSL enabled)
- ✅ Environment variables are not exposed in logs

## 📊 Monitoring & Performance

**Set up CloudWatch monitoring:**
- Build success/failure rates
- Response times
- Error tracking

**Performance optimizations:**
- CDN caching already configured via Amplify
- Image optimization via Next.js
- PWA caching for mobile users

## 🔧 Troubleshooting

**Common Issues:**

1. **Build Failures**
   - Check Node.js version (use 18.x)
   - Verify all dependencies in `package.json`
   - Check build logs for missing environment variables

2. **Database Connection**
   - Verify DATABASE_URL format
   - Check security group rules for RDS
   - Ensure SSL is properly configured

3. **Authentication Issues**
   - Verify NEXTAUTH_URL matches deployment URL
   - Check NEXTAUTH_SECRET is set
   - Confirm callback URLs in OAuth providers

4. **CloudFront Issues (Option 2)**
   - Check behavior path patterns
   - Verify origin configuration
   - Clear CloudFront cache after updates

## 🧪 Quick Commands

```bash
# Test build locally
cd web
npm run build

# Check environment variables
cd web  
npm run build 2>&1 | grep -i "env\|variable"

# Test database connection
npx prisma db pull
```

## ✅ Success Criteria

### Option 1: Subdomain
✅ App loads at `https://chorechart.latentgenius.ai`

### Option 2: CloudFront  
✅ App loads at `https://latentgenius.ai/chorechart`

**Both options should have:**
✅ Demo accounts work
✅ Chorbit AI responds (or shows fallback)
✅ Mobile PWA installation works
✅ Authentication flow completes
✅ Database operations succeed

---

## 🎯 Expected Result

ChoreChart will be live at either:
- **Option 1**: `https://chorechart.latentgenius.ai`
- **Option 2**: `https://latentgenius.ai/chorechart`

With full functionality:
- 📱 Mobile-optimized PWA
- 🤖 Chorbit AI assistant
- 👨‍👩‍👧‍👦 Parent/child dashboards
- 💰 Chore submission/approval system
- 📊 Daily check-in tracking

Ready for user testing and feedback collection! 