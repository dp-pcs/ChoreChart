# ChoreChart - AI-Powered Family Chore Management

An intelligent chore management system with separate interfaces for parents and children, featuring AI-powered insights, reward systems, and mobile notifications.

## 🎯 Project Overview

ChoreChart is designed to create structure and accountability for both children and parents while providing data-driven insights to improve family dynamics. The application features:

- **Dual Interface System**: Separate, age-appropriate interfaces for parents and children
- **AI-Powered Insights**: OpenAI integration for behavioral analysis and recommendations
- **Flexible Reward System**: Monetary rewards with potential for other incentive types
- **Smart Approval Workflow**: Child submissions → Parent approvals with optional auto-approval
- **Weekly Reporting**: Automated email summaries and detailed analytics
- **Cross-Platform**: Web application + planned iPhone app

## 🏗️ Architecture

### Web Application
- **Frontend**: Next.js 14 with TypeScript
- **UI Framework**: Tailwind CSS + shadcn/ui components
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with role-based access
- **AI Integration**: OpenAI API for insights and recommendations
- **Hosting**: AWS Amplify (production-ready)

### Planned Mobile App
- **Option 1**: React Native with Expo (code sharing with web)
- **Option 2**: Native Swift/SwiftUI (better performance, iOS-specific features)

## 📊 Database Schema

The application uses a comprehensive database schema including:

- **Users & Families**: Multi-family support with role-based access
- **Chores & Assignments**: Flexible scheduling with recurring and one-time tasks
- **Submission Workflow**: Child submissions → parent approvals
- **Messaging System**: Bi-directional communication between family members
- **Reward Tracking**: Monetary and other incentive systems
- **Weekly Reports**: AI-powered analytics and insights

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ChoreChart/web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration:
   - Database connection string
   - NextAuth secret
   - OpenAI API key
   - Email service credentials (optional)

4. **Set up the database**
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Visit [http://localhost:3000](http://localhost:3000)

## 🔑 Key Features

### For Children
- **Weekly/Daily Schedule Views**: Clear visualization of assigned chores
- **Chore Submission**: Submit completed tasks with notes and optional photos
- **Progress Tracking**: Real-time view of completed vs. pending chores
- **Earnings Dashboard**: Track current and potential earnings
- **Reminder System**: Configurable notifications for upcoming chores
- **Messaging**: Communicate with parents about chores and questions

### For Parents
- **Family Dashboard**: Overview of all children's progress
- **Chore Management**: Create, edit, and assign chores with flexible scheduling
- **Approval Workflow**: Review and approve/deny child submissions
- **Reward System**: Set monetary rewards and bonus opportunities
- **AI Insights**: Behavioral analysis and improvement recommendations
- **Weekly Reports**: Automated summaries via email
- **Settings Management**: Configure auto-approvals, allowances, and notifications

### Administrative Features
- **Week Management**: Automatic Sunday closures with historical editing capability
- **Data Analytics**: Completion rates, consistency tracking, time analysis
- **AI Recommendations**: Suggestions for chore adjustments and improvements
- **Export Capabilities**: Data export for external analysis

## 🤖 AI Integration

The application leverages OpenAI's API for:

1. **Behavioral Analysis**
   - Completion pattern recognition
   - Consistency scoring
   - Peak performance time identification

2. **Recommendations**
   - Chore difficulty adjustments
   - Reward optimization suggestions
   - Schedule improvements

3. **Insights Generation**
   - Weekly performance summaries
   - Trend analysis
   - Goal recommendations

## 📱 Mobile App Strategy

### React Native Approach
- **Pros**: Code sharing, faster development, unified business logic
- **Cons**: Potential performance limitations, less native feel

### Native Swift Approach
- **Pros**: Better performance, native iOS features, superior UX
- **Cons**: Separate codebase, longer development time

**Recommendation**: Start with React Native for rapid prototyping, consider native Swift for production.

## 🔄 Development Workflow

### Phase 1: Core Web Application ✅
- [x] Database schema design
- [x] Authentication system
- [x] Basic UI components
- [ ] Parent dashboard
- [ ] Child interface
- [ ] Chore management
- [ ] Submission workflow

### Phase 2: AI Integration
- [ ] OpenAI API integration
- [ ] Analytics dashboard
- [ ] Insight generation
- [ ] Recommendation engine

### Phase 3: Mobile Application
- [ ] Technology selection
- [ ] Core functionality port
- [ ] Push notification system
- [ ] App store deployment

### Phase 4: Advanced Features
- [ ] Email notification system
- [ ] Advanced reporting
- [ ] Multi-family support
- [ ] Integration APIs

## 🚀 Deployment

### Web Application (AWS Amplify)
1. Connect GitHub repository to Amplify
2. Configure build settings for Next.js
3. Set up environment variables
4. Configure custom domain (latentgenius.ai subdomain)

### Database (AWS RDS)
1. Create PostgreSQL instance
2. Configure security groups
3. Update connection string in environment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📋 Project Structure

```
ChoreChart/
├── web/                    # Next.js web application
│   ├── src/
│   │   ├── app/           # App router pages
│   │   ├── components/    # Reusable UI components
│   │   ├── lib/          # Utility functions and config
│   │   └── types/        # TypeScript type definitions
│   ├── prisma/           # Database schema and migrations
│   └── public/           # Static assets
├── mobile/               # Future mobile application
└── docs/                 # Additional documentation
```

## 🎯 Next Steps

1. **Complete Core Web Features**: Finish dashboard implementations
2. **Implement AI Integration**: OpenAI API connection and analytics
3. **Mobile App Development**: Choose technology and begin development
4. **Testing & QA**: Comprehensive testing strategy
5. **Production Deployment**: AWS setup and monitoring

## 📞 Support

For questions or support, please open an issue in the GitHub repository.

---

Built with ❤️ for families who want to make chores fun and educational. 