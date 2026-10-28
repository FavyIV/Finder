-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'SECURITY', 'ADMIN');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('ELECTRONICS', 'CLOTHING', 'ACCESSORIES', 'BOOKS', 'DOCUMENTS', 'KEYS', 'BAGS', 'OTHER');

-- CreateEnum
CREATE TYPE "FoundStatus" AS ENUM ('AVAILABLE', 'CLAIMED');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'DISMISSED', 'REMOVED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isSecurityPost" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoundListing" (
    "id" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "description" TEXT,
    "foundAt" TIMESTAMP(3) NOT NULL,
    "status" "FoundStatus" NOT NULL DEFAULT 'AVAILABLE',
    "removedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reportedById" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "claimedById" TEXT,
    "claimedAt" TIMESTAMP(3),

    CONSTRAINT "FoundListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LostListing" (
    "id" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "postedById" TEXT NOT NULL,

    CONSTRAINT "LostListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reportedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "foundListingId" TEXT NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Location_name_key" ON "Location"("name");

-- CreateIndex
CREATE INDEX "FoundListing_status_idx" ON "FoundListing"("status");

-- CreateIndex
CREATE INDEX "FoundListing_category_idx" ON "FoundListing"("category");

-- CreateIndex
CREATE INDEX "FoundListing_locationId_idx" ON "FoundListing"("locationId");

-- CreateIndex
CREATE INDEX "FoundListing_createdAt_idx" ON "FoundListing"("createdAt");

-- CreateIndex
CREATE INDEX "FoundListing_reportedById_idx" ON "FoundListing"("reportedById");

-- CreateIndex
CREATE INDEX "LostListing_postedById_idx" ON "LostListing"("postedById");

-- CreateIndex
CREATE INDEX "LostListing_category_idx" ON "LostListing"("category");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");

-- CreateIndex
CREATE INDEX "Report_foundListingId_idx" ON "Report"("foundListingId");

-- CreateIndex
CREATE UNIQUE INDEX "Report_reportedById_foundListingId_key" ON "Report"("reportedById", "foundListingId");

-- AddForeignKey
ALTER TABLE "FoundListing" ADD CONSTRAINT "FoundListing_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoundListing" ADD CONSTRAINT "FoundListing_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoundListing" ADD CONSTRAINT "FoundListing_claimedById_fkey" FOREIGN KEY ("claimedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LostListing" ADD CONSTRAINT "LostListing_postedById_fkey" FOREIGN KEY ("postedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_foundListingId_fkey" FOREIGN KEY ("foundListingId") REFERENCES "FoundListing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
