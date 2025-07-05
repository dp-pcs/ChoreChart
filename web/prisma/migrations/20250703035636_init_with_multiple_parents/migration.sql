-- CreateTable
CREATE TABLE "users" (
    "id" TEXT PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT,
    "role" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    "preferences" JSONB,
    "currentLoginStreak" INTEGER NOT NULL DEFAULT 0,
    "longestLoginStreak" INTEGER NOT NULL DEFAULT 0,
    "lastLoginDate" TIMESTAMP,
    "currentCheckInStreak" INTEGER NOT NULL DEFAULT 0,
    "longestCheckInStreak" INTEGER NOT NULL DEFAULT 0,
    "lastCheckInDate" TIMESTAMP,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "experiencePoints" INTEGER NOT NULL DEFAULT 0,
    "streakFreezes" INTEGER NOT NULL DEFAULT 0,
    "lastStreakFreezeUsed" TIMESTAMP,
    CONSTRAINT "users_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "family_memberships" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "canInvite" BOOLEAN NOT NULL DEFAULT false,
    "canManage" BOOLEAN NOT NULL DEFAULT false,
    "permissions" JSONB,
    CONSTRAINT "family_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "family_memberships_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "families" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    "weeklyAllowance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "autoApproveChores" BOOLEAN NOT NULL DEFAULT true,
    "weekCloseDay" INTEGER NOT NULL DEFAULT 0,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "allowMultipleParents" BOOLEAN NOT NULL DEFAULT true,
    "shareReports" BOOLEAN NOT NULL DEFAULT false,
    "crossFamilyApproval" BOOLEAN NOT NULL DEFAULT false,
    "enableStreaks" BOOLEAN NOT NULL DEFAULT true,
    "enableLeaderboard" BOOLEAN NOT NULL DEFAULT true,
    "enableAchievements" BOOLEAN NOT NULL DEFAULT true,
    "streakFreezeLimit" INTEGER NOT NULL DEFAULT 3
);

-- CreateTable
CREATE TABLE "chores" (
    "id" TEXT PRIMARY KEY,
    "familyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "reward" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    "scheduledDays" TEXT,
    "scheduledTime" TEXT,
    "estimatedMinutes" INTEGER,
    CONSTRAINT "chores_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "chore_assignments" (
    "id" TEXT PRIMARY KEY,
    "familyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "choreId" TEXT NOT NULL,
    "weekStart" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chore_assignments_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "chore_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "chore_assignments_choreId_fkey" FOREIGN KEY ("choreId") REFERENCES "chores" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "chore_submissions" (
    "id" TEXT PRIMARY KEY,
    "assignmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP NOT NULL,
    "notes" TEXT,
    "imageUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    CONSTRAINT "chore_submissions_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "chore_assignments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "chore_submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "chore_approvals" (
    "id" TEXT PRIMARY KEY,
    "submissionId" TEXT NOT NULL,
    "approvedBy" TEXT NOT NULL,
    "approvedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved" BOOLEAN NOT NULL,
    "feedback" TEXT,
    CONSTRAINT "chore_approvals_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "chore_submissions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "chore_approvals_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT PRIMARY KEY,
    "familyId" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,
    "toId" TEXT,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'CHAT',
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP,
    CONSTRAINT "messages_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "messages_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rewards" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'MONEY',
    "awardedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "awardedBy" TEXT NOT NULL,
    CONSTRAINT "rewards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "weekly_reports" (
    "id" TEXT PRIMARY KEY,
    "familyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekStart" TIMESTAMP NOT NULL,
    "weekEnd" TIMESTAMP NOT NULL,
    "generatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalChores" INTEGER NOT NULL,
    "completedChores" INTEGER NOT NULL,
    "approvedChores" INTEGER NOT NULL,
    "deniedChores" INTEGER NOT NULL,
    "totalEarnings" DOUBLE PRECISION NOT NULL,
    "potentialEarnings" DOUBLE PRECISION NOT NULL,
    "aiInsights" JSONB,
    "recommendations" TEXT,
    CONSTRAINT "weekly_reports_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "weekly_reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" TEXT PRIMARY KEY,
    "familyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requirements" JSONB NOT NULL,
    "rewardType" TEXT NOT NULL DEFAULT 'MONEY',
    "rewardAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rewardDescription" TEXT,
    CONSTRAINT "achievements_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_achievements" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "user_achievements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_achievements_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "achievements" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "family_memberships_userId_familyId_key" ON "family_memberships"("userId", "familyId");

-- CreateIndex
CREATE UNIQUE INDEX "chore_assignments_userId_choreId_weekStart_key" ON "chore_assignments"("userId", "choreId", "weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "chore_approvals_submissionId_key" ON "chore_approvals"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_reports_userId_weekStart_key" ON "weekly_reports"("userId", "weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "user_achievements_userId_achievementId_key" ON "user_achievements"("userId", "achievementId");
