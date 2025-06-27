# ChoreChart - AWS Amplify Deployment Guide

## 🚀 Deploy to AWS Amplify

### Prerequisites
- AWS Account with Amplify access
- GitHub repository (✅ already set up)
- Custom domain: `apps.latentgenius.ai`

### Step 1: Create Amplify App

1. **Go to AWS Amplify Console**
   - Navigate to https://console.aws.amazon.com/amplify/
   - Click "Create new app"

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

# NextAuth.js Configuration  
NEXTAUTH_URL=https://apps.latentgenius.ai/chorechart
NEXTAUTH_SECRET=generate_a_secure_random_string_here

# Database Configuration
DATABASE_URL=postgresql://username:password@hostname:port/database_name

# App Configuration
NODE_ENV=production
```

### Step 3: Database Setup

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

### Step 4: Custom Domain Configuration

1. **In Amplify Console**
   - Go to "Domain management"
   - Click "Add domain"
   - Enter: `apps.latentgenius.ai`
   - Add subdomain: `chorechart`

2. **DNS Configuration**
   Add these records to your DNS:
   ```
   Type: CNAME
   Name: chorechart.apps.latentgenius.ai
   Value: [AWS Amplify domain from console]
   ```

### Step 5: Build Configuration

The `amplify.yml` file is already configured:
- Builds from `/web` directory
- Uses Next.js build process
- Caches `node_modules` and `.next/cache`
- Outputs to `.next` directory

### Step 6: Post-Deployment Setup

1. **Database Migration**
   ```bash
   # After first deployment, run migrations
   npx prisma migrate deploy
   npx tsx scripts/seed-demo-users.ts
   ```

2. **Test Demo Accounts**
   - Parent: `parent@demo.com` / `password`
   - Child: `child@demo.com` / `password`

### Step 7: Security Checklist

- ✅ NEXTAUTH_SECRET is secure random string
- ✅ OPENAI_API_KEY is valid and has sufficient quota
- ✅ Database connection is secure (SSL enabled)
- ✅ Environment variables are not exposed in logs

### Step 8: Monitoring & Performance

**Set up CloudWatch monitoring:**
- Build success/failure rates
- Response times
- Error tracking

**Performance optimizations:**
- CDN caching already configured via Amplify
- Image optimization via Next.js
- PWA caching for mobile users

### Troubleshooting

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

### Quick Commands

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

### Success Criteria

✅ App loads at `https://apps.latentgenius.ai/chorechart`
✅ Demo accounts work
✅ Chorbit AI responds (or shows fallback)
✅ Mobile PWA installation works
✅ Authentication flow completes
✅ Database operations succeed

---

## 🎯 Expected Result

ChoreChart will be live at:
**https://apps.latentgenius.ai/chorechart**

With full functionality:
- 📱 Mobile-optimized PWA
- 🤖 Chorbit AI assistant
- 👨‍👩‍👧‍👦 Parent/child dashboards
- 💰 Chore submission/approval system
- 📊 Daily check-in tracking

Ready for user testing and feedback collection! 