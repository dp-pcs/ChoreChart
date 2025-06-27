# ChoreChart Setup Guide

## 🚀 GitHub Repository Setup

### Step 1: Create GitHub Repository
1. Go to [GitHub.com](https://github.com) and sign in
2. Click **"New repository"** (green button)
3. Repository name: `ChoreChart`
4. Description: `AI-Powered Family Chore Management System`
5. Set to **Public** (or Private if preferred)
6. ✅ **Do NOT** check "Add a README file" (we already have one)
7. ✅ **Do NOT** check "Add .gitignore" (we already have one)
8. Click **"Create repository"**

### Step 2: Connect Local Repository to GitHub
```bash
# In your ChoreChart directory
git remote add origin https://github.com/YOUR_USERNAME/ChoreChart.git
git branch -M main
git push -u origin main
```

**Replace `YOUR_USERNAME` with your actual GitHub username!**

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- OpenAI API key
- Apple Developer Account (for iOS deployment)

### Quick Start Commands

```bash
# Install all dependencies for both web and mobile
npm install

# Start web development server
npm run dev:web

# Start mobile development (in another terminal)
npm run dev:mobile

# Database setup (web app)
cd web
cp .env.example .env
# Edit .env with your database URL and API keys
npx prisma migrate dev --name init
npx prisma generate
```

### Environment Variables (.env in web directory)
```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/chorechart"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-secure-secret-here"

# OpenAI API
OPENAI_API_KEY="your-openai-api-key-here"

# Email (optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
```

## 📱 Mobile Development Setup

### Prerequisites for Mobile
- iOS Simulator (Xcode) or physical iOS device
- Expo CLI: `npm install -g @expo/cli`

### Mobile Development Commands
```bash
# Start Expo development server
npm run dev:mobile

# Run on iOS simulator
cd mobile && npx expo run:ios

# Run on iOS device (requires Apple Developer Account)
cd mobile && npx expo run:ios --device
```

### Apple Developer Account Setup
1. Sign in to [Apple Developer](https://developer.apple.com)
2. Configure your development team in Xcode
3. Update `mobile/app.json` with your bundle identifier:
   ```json
   "ios": {
     "bundleIdentifier": "com.yourcompany.chorechart"
   }
   ```

## 🌐 Deployment Strategy

### Web App (AWS Amplify)
1. **Connect Repository**: Link your GitHub repo to AWS Amplify
2. **Build Settings**: Amplify will auto-detect Next.js
3. **Environment Variables**: Add your production environment variables
4. **Custom Domain**: Set up subdomain on latentgenius.ai
5. **Database**: Use AWS RDS PostgreSQL for production

### Mobile App (App Store)
1. **Development**: Use Expo for rapid development
2. **Testing**: Test on physical iOS devices
3. **Build**: Create production build with `expo build:ios`
4. **Submission**: Submit to App Store through Xcode or Expo

## 🔄 Development Workflow

### Daily Development
```bash
# Start both applications
npm run dev:web    # Terminal 1: Web app (localhost:3000)
npm run dev:mobile # Terminal 2: Mobile app (Expo DevTools)
```

### Database Management
```bash
# Create migration after schema changes
npm run db:migrate

# Regenerate Prisma client
npm run db:generate

# Open Prisma Studio (database GUI)
npm run db:studio
```

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "Add your feature description"

# Push and create pull request
git push origin feature/your-feature-name
```

## 🎯 Next Development Priorities

### Phase 1: Core Web Features (Week 1-2)
- [ ] Parent dashboard with family overview
- [ ] Child dashboard with today's chores
- [ ] Chore creation and management system
- [ ] Submission and approval workflow

### Phase 2: Mobile App (Week 3-4)
- [ ] Authentication screens
- [ ] Child dashboard mobile UI
- [ ] Chore submission with photo upload
- [ ] Push notifications setup

### Phase 3: AI Integration (Week 5-6)
- [ ] OpenAI API integration
- [ ] Weekly report generation
- [ ] Behavioral insights dashboard
- [ ] Recommendation system

### Phase 4: Production Ready (Week 7-8)
- [ ] Email notification system
- [ ] Advanced reporting and analytics
- [ ] App Store submission
- [ ] Production deployment

## 🆘 Troubleshooting

### Common Issues

**Database Connection Issues:**
```bash
# Check if PostgreSQL is running
brew services list | grep postgresql

# Start PostgreSQL if needed
brew services start postgresql
```

**Mobile App Won't Load:**
```bash
# Clear Expo cache
cd mobile && npx expo start -c
```

**Prisma Issues:**
```bash
# Reset and regenerate
cd web
npx prisma db reset
npx prisma migrate dev
npx prisma generate
```

## 📞 Support

For development questions:
1. Check this SETUP.md file
2. Review the main README.md
3. Check GitHub Issues
4. Create new issue with detailed description

---

Happy coding! 🚀 