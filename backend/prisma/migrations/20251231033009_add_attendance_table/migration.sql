/*
  Warnings:

  - You are about to drop the column `name` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `uploadDate` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `documents` table. All the data in the column will be lost.
  - Added the required column `documentUrl` to the `documents` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "documents" DROP COLUMN "name",
DROP COLUMN "uploadDate",
DROP COLUMN "url",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "documentUrl" TEXT NOT NULL,
ADD COLUMN     "expiryDate" TIMESTAMP(3),
ADD COLUMN     "mimeType" TEXT,
ADD COLUMN     "originalName" TEXT;

-- CreateTable
CREATE TABLE "attendance" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "checkIn" TIMESTAMP(3) NOT NULL,
    "checkOut" TIMESTAMP(3),
    "workedHours" DOUBLE PRECISION,
    "status" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "salary" DOUBLE PRECISION NOT NULL,
    "clauses" TEXT,
    "documentUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "employeeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "attendance_employeeId_idx" ON "attendance"("employeeId");

-- CreateIndex
CREATE INDEX "attendance_date_idx" ON "attendance"("date");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_employeeId_date_key" ON "attendance"("employeeId", "date");

-- CreateIndex
CREATE INDEX "audit_logs_entityId_idx" ON "audit_logs"("entityId");

-- CreateIndex
CREATE INDEX "contracts_employeeId_idx" ON "contracts"("employeeId");

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
