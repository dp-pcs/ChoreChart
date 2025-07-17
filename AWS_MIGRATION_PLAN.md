# ChoreChart → Chorbie.app AWS Migration Plan

## 🎯 Migration Overview

**Current Setup:**
- Domain: `chorechart.latentgenius.ai` 
- AWS Account: Current (Latent Genius)
- Git Repository: `dp-pcs/ChoreChart` (keeping same)

**Target Setup:**
- Domain: `chorbie.app`
- AWS Account: New dedicated account
- Same Git Repository: `dp-pcs/ChoreChart`
- Parallel deployment during migration

---

## 📋 Current Infrastructure Analysis

### 1. **Application Stack**
- **Frontend:** Next.js 15.3.4 with React 19
- **Backend:** Next.js API routes (Lambda functions via Amplify)
- **Database:** PostgreSQL (requires migration)
- **Authentication:** NextAuth.js with credentials provider
- **AI Integration:** OpenAI GPT-3.5/GPT-4 (Chorbit assistant)
- **Mobile:** PWA + React Native Expo app

### 2. **Environment Variables Required**
```bash
# Core Database
DATABASE_URL=postgresql://username:password@hostname:port/database_name
DIRECT_URL=postgresql://username:password@hostname:port/database_name

# Authentication
NEXTAUTH_URL=https://chorbie.app
NEXTAUTH_SECRET=generate_new_secure_random_string

# AI Services
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-3.5-turbo  # Optional, defaults appropriately

# Email Services (for password reset)
SMTP_HOST=smtp.gmail.com  # or your email provider
SMTP_PORT=587
SMTP_USER=your_email@domain.com
SMTP_PASSWORD=your_app_specific_password
SMTP_FROM=noreply@chorbie.app

# Application
NODE_ENV=production
```

### 3. **Key Dependencies**
- **Database:** PostgreSQL with Prisma ORM
- **External APIs:** OpenAI API for Chorbit AI assistant
- **Email Service:** SMTP for password reset functionality
- **File Storage:** None currently (all data in database)
- **CDN:** AWS Amplify built-in CloudFront

---

## 🚀 Migration Strategy

### Phase 1: New Environment Setup (Week 1)

#### 1.1 AWS Account Preparation
- [ ] **New AWS Account Setup**
  - Create dedicated AWS account for Chorbie
  - Set up billing and cost monitoring
  - Configure IAM users/roles for deployment

#### 1.2 Domain Configuration
- [ ] **DNS Setup for chorbie.app**
  - Point domain to AWS Route 53 (or current DNS provider)
  - Create SSL certificate via AWS Certificate Manager
  - Set up DNS records for email (if needed)

#### 1.3 Database Migration Planning
- [ ] **Database Options Analysis**
  
  **Option A: AWS RDS PostgreSQL (Recommended)**
  ```bash
  # Benefits: Native AWS integration, automated backups, scaling
  # Setup: Create RDS instance in new account
  # Connection: Direct PostgreSQL connection
  ```
  
  **Option B: Migrate Existing Database**
  ```bash
  # If current DB is accessible, dump and restore
  pg_dump current_db > migration.sql
  psql new_db < migration.sql
  ```
  
  **Option C: Supabase**
  ```bash
  # Alternative: Supabase PostgreSQL
  # Benefits: Built-in auth, real-time features, easier setup
  ```

#### 1.4 Environment Variables Secure Storage
- [ ] **AWS Systems Manager Parameter Store**
  - Store all sensitive environment variables securely
  - Set up parameter references in Amplify

### Phase 2: Application Deployment (Week 1-2)

#### 2.1 Amplify App Creation
- [ ] **New Amplify App in Target Account**
  ```bash
  # Repository: Same GitHub repo (dp-pcs/ChoreChart)
  # Branch: main (or create migration branch)
  # App root: web
  # Build command: npm run build
  # Output directory: .next
  ```

#### 2.2 Build Configuration
- [ ] **Update Configuration Files**
  
  **amplify.yml (no changes needed - already correct)**
  ```yaml
  # Current config works for new deployment
  # Environment variables configured in Amplify console
  ```
  
  **Update NEXTAUTH_URL**
  ```bash
  # In Amplify environment variables
  NEXTAUTH_URL=https://chorbie.app
  ```

#### 2.3 Database Setup & Migration
- [ ] **Database Creation**
  ```bash
  # Create new PostgreSQL instance
  # Run Prisma migrations
  npx prisma migrate deploy
  
  # Seed demo data
  npx tsx scripts/seed-demo-users.ts
  ```

- [ ] **Data Migration (if applicable)**
  ```bash
  # Export from current database
  # Import to new database
  # Verify data integrity
  ```

### Phase 3: Testing & Validation (Week 2)

#### 3.1 Functional Testing
- [ ] **Core Functionality Verification**
  - [ ] User authentication (parent/child roles)
  - [ ] Chore creation and assignment
  - [ ] Chore submission and approval workflow
  - [ ] Chorbit AI assistant functionality
  - [ ] Daily check-in system
  - [ ] Family management features
  - [ ] Mobile PWA installation

#### 3.2 Performance Testing
- [ ] **Load Testing**
  - [ ] API response times
  - [ ] Database query performance
  - [ ] Lambda function cold start times
  - [ ] CDN caching effectiveness

#### 3.3 Integration Testing
- [ ] **External Services**
  - [ ] OpenAI API connectivity
  - [ ] Email delivery (password reset)
  - [ ] Mobile app API calls
  - [ ] PWA offline functionality

### Phase 4: DNS & Domain Cutover (Week 3)

#### 4.1 SSL Certificate
- [ ] **Certificate Setup**
  - Request SSL certificate for chorbie.app in AWS Certificate Manager
  - Add domain verification records to DNS
  - Configure Amplify to use custom domain

#### 4.2 DNS Configuration
- [ ] **Domain Pointing**
  ```bash
  # DNS Records needed:
  chorbie.app -> AWS Amplify distribution
  www.chorbie.app -> chorbie.app (redirect)
  
  # Optional email records if using custom email
  MX records for email delivery
  ```

#### 4.3 Parallel Testing
- [ ] **Side-by-Side Comparison**
  - Run both versions simultaneously
  - Compare functionality and performance
  - User acceptance testing on new domain

### Phase 5: Migration Execution (Week 3-4)

#### 5.1 Final Data Sync
- [ ] **Data Consistency**
  - Final database export/import if needed
  - User data verification
  - System state synchronization

#### 5.2 DNS Cutover
- [ ] **Go-Live Process**
  - Update DNS records to point to new deployment
  - Monitor for issues during transition
  - Verify all functionality post-cutover

#### 5.3 Old System Decommission
- [ ] **Cleanup**
  - Keep old system running for 1-2 weeks as backup
  - Monitor new system stability
  - Archive old deployment

---

## 🔧 Technical Implementation Details

### Database Migration Script
```sql
-- Export current database
pg_dump \
  --host=current-host \
  --port=5432 \
  --username=current-user \
  --password \
  --dbname=current-db \
  --file=chorechart-migration.sql

-- Import to new database
psql \
  --host=new-host \
  --port=5432 \
  --username=new-user \
  --password \
  --dbname=new-db \
  --file=chorechart-migration.sql
```

### Environment Variables Setup
```bash
# AWS Systems Manager Parameter Store
aws ssm put-parameter \
  --name "/chorbie/database-url" \
  --value "postgresql://..." \
  --type "SecureString"

aws ssm put-parameter \
  --name "/chorbie/nextauth-secret" \
  --value "your-secret-here" \
  --type "SecureString"

aws ssm put-parameter \
  --name "/chorbie/openai-api-key" \
  --value "sk-..." \
  --type "SecureString"
```

### Amplify Configuration
```yaml
# Reference in amplify.yml
environmentVariables:
  - DATABASE_URL: _AWS_SSM_:/chorbie/database-url
  - NEXTAUTH_SECRET: _AWS_SSM_:/chorbie/nextauth-secret
  - OPENAI_API_KEY: _AWS_SSM_:/chorbie/openai-api-key
  - NEXTAUTH_URL: https://chorbie.app
```

---

## 🛡️ Risk Mitigation

### 1. **Rollback Plan**
- Keep original deployment active during transition
- DNS can be quickly reverted
- Database backups for data protection
- Gradual user migration if needed

### 2. **Zero-Downtime Strategy**
- Parallel deployment approach
- DNS-based traffic switching
- Health checks and monitoring
- Gradual rollout capability

### 3. **Data Protection**
- Complete database backups before migration
- Data validation scripts
- User data integrity checks
- GDPR compliance maintenance

---

## 📊 Migration Checklist

### Pre-Migration
- [ ] New AWS account setup and configured
- [ ] chorbie.app domain purchased and DNS accessible
- [ ] SSL certificate requested and validated
- [ ] Database instance created and configured
- [ ] All environment variables documented and secured
- [ ] Test plan created and validated

### Migration Day
- [ ] Final database backup created
- [ ] New Amplify app deployed and tested
- [ ] Environment variables configured
- [ ] Database migrations executed
- [ ] Functional testing completed
- [ ] Performance testing passed
- [ ] DNS records updated
- [ ] Monitoring enabled

### Post-Migration
- [ ] All functionality verified on new domain
- [ ] User acceptance testing completed
- [ ] Performance monitoring active
- [ ] Old system deprecated (after 2 weeks)
- [ ] Team trained on new infrastructure
- [ ] Documentation updated

---

## 🚨 Critical Success Factors

1. **Database Migration:** Most critical component - requires careful planning
2. **Environment Variables:** Secure storage and proper configuration
3. **Domain/DNS:** Proper SSL and DNS configuration for seamless transition
4. **Testing:** Comprehensive testing before and after migration
5. **Monitoring:** Real-time monitoring during and after cutover
6. **Communication:** Clear communication plan for any user-facing changes

---

## 📈 Expected Timeline

- **Week 1:** Infrastructure setup and initial deployment
- **Week 2:** Testing, validation, and refinement
- **Week 3:** Domain configuration and parallel testing
- **Week 4:** Final cutover and monitoring

**Total Duration:** 3-4 weeks for complete migration with parallel operation ensuring zero downtime.

---

## 💰 Cost Considerations

### New AWS Account Costs
- **Amplify Hosting:** ~$15-50/month (depending on traffic)
- **RDS PostgreSQL:** ~$20-100/month (depending on instance size)
- **Route 53 DNS:** ~$0.50/month per hosted zone
- **Certificate Manager:** Free for AWS services
- **Lambda Functions:** Included in Amplify (API routes)

### Migration Costs
- **Parallel Operation:** 2x hosting costs during transition (~2 weeks)
- **Data Transfer:** Minimal (database export/import)
- **Development Time:** 2-3 weeks engineering effort

**Total Monthly Cost:** Estimated $35-150/month for new infrastructure 