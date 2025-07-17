# ChoreChart → Chorbie.app Migration Quick Start

## 🚀 Immediate Action Items

### 1. **New AWS Account Setup** (Day 1)
```bash
# Create new AWS account for Chorbie
# Set up IAM user with Amplify + RDS permissions
# Configure billing alerts
```

### 2. **Domain & DNS** (Day 1-2)
```bash
# Ensure chorbie.app domain is ready
# Point DNS to AWS Route 53 (or keep current provider)
# Request SSL certificate in AWS Certificate Manager
```

### 3. **Database Decision** (Day 2)
**Recommended: AWS RDS PostgreSQL**
- Simplest integration with Amplify
- Automated backups and scaling
- Direct connection from Lambda functions

### 4. **Environment Variables Checklist**
```bash
# Required for new deployment:
DATABASE_URL=postgresql://user:pass@host:5432/db
DIRECT_URL=postgresql://user:pass@host:5432/db
NEXTAUTH_URL=https://chorbie.app
NEXTAUTH_SECRET=new_secure_random_string_32+_chars
OPENAI_API_KEY=sk-your-existing-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@chorbie.app
```

## 🔧 Deployment Steps

### Step 1: Create Amplify App
1. Go to AWS Amplify in new account
2. Connect to GitHub: `dp-pcs/ChoreChart`
3. Configure:
   - **App root:** `web`
   - **Build command:** `npm run build`
   - **Output directory:** `.next`
   - **Branch:** `main`

### Step 2: Configure Environment Variables
Add all variables listed above in Amplify Console → App Settings → Environment Variables

### Step 3: First Deployment Test
- Deploy and verify build succeeds
- Test basic functionality
- Check database connection

### Step 4: Domain Configuration
- Add custom domain in Amplify
- Configure SSL certificate
- Test HTTPS access

## ⚠️ Critical Migration Notes

1. **Keep Current Site Running:** Don't touch the existing deployment until new one is fully tested
2. **Database Migration:** Plan this carefully - it's the most critical component
3. **DNS Cutover:** Can be reverted quickly if issues arise
4. **Environment Variables:** Generate new NEXTAUTH_SECRET for security
5. **OpenAI API:** Same key works across deployments

## 🎯 Success Criteria

- [ ] New site loads at https://chorbie.app
- [ ] Demo accounts work (parent@demo.com / child@demo.com, password: "password")
- [ ] Chorbit AI responds or shows appropriate fallback
- [ ] Authentication flow completes
- [ ] Database operations work (create chore, submit, approve)
- [ ] Mobile PWA installs correctly

## 📞 Need Help?

This migration plan is comprehensive but if you need assistance with any specific step, especially:
- Database migration strategy
- DNS configuration
- AWS account setup
- Troubleshooting deployment issues

Just let me know and I can provide detailed guidance for any specific step! 