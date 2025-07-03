-- CreateEnum
CREATE TYPE "PaymentFrequency" AS ENUM ('WEEKLY', 'MONTHLY', 'ONE_TIME');

-- CreateEnum  
CREATE TYPE "PaymentSourceType" AS ENUM ('ALLOWANCE', 'BONUS_FUND', 'GIFT_MONEY', 'CHORE_FUND', 'OTHER');

-- CreateTable
CREATE TABLE "payment_sources" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "frequency" "PaymentFrequency" NOT NULL DEFAULT 'WEEKLY',
    "type" "PaymentSourceType" NOT NULL DEFAULT 'ALLOWANCE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "managedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_sources_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "payment_sources" ADD CONSTRAINT "payment_sources_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_sources" ADD CONSTRAINT "payment_sources_managedBy_fkey" FOREIGN KEY ("managedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;