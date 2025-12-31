-- CreateTable
CREATE TABLE "absence_requests" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "evidenceUrl" TEXT,
    "adminComment" TEXT,
    "employeeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "absence_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "absence_requests_employeeId_idx" ON "absence_requests"("employeeId");

-- AddForeignKey
ALTER TABLE "absence_requests" ADD CONSTRAINT "absence_requests_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
