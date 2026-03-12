-- CreateTable
CREATE TABLE "acc_periods" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "acc_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acc_accounts" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "isTransactional" BOOLEAN NOT NULL DEFAULT false,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "acc_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acc_cost_centers" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "acc_cost_centers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acc_journal_entries" (
    "id" TEXT NOT NULL,
    "entryNumber" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "totalDebit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCredit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "referenceModule" TEXT,
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "acc_journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acc_journal_lines" (
    "id" TEXT NOT NULL,
    "journalEntryId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "costCenterId" TEXT,
    "description" TEXT,
    "debit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "credit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "acc_journal_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "acc_periods_year_month_key" ON "acc_periods"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "acc_accounts_code_key" ON "acc_accounts"("code");

-- CreateIndex
CREATE INDEX "acc_accounts_code_idx" ON "acc_accounts"("code");

-- CreateIndex
CREATE UNIQUE INDEX "acc_cost_centers_code_key" ON "acc_cost_centers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "acc_journal_entries_entryNumber_key" ON "acc_journal_entries"("entryNumber");

-- CreateIndex
CREATE INDEX "acc_journal_entries_date_idx" ON "acc_journal_entries"("date");

-- CreateIndex
CREATE INDEX "acc_journal_entries_entryNumber_idx" ON "acc_journal_entries"("entryNumber");

-- CreateIndex
CREATE INDEX "acc_journal_lines_journalEntryId_idx" ON "acc_journal_lines"("journalEntryId");

-- CreateIndex
CREATE INDEX "acc_journal_lines_accountId_idx" ON "acc_journal_lines"("accountId");

-- AddForeignKey
ALTER TABLE "acc_accounts" ADD CONSTRAINT "acc_accounts_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "acc_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acc_journal_lines" ADD CONSTRAINT "acc_journal_lines_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "acc_journal_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acc_journal_lines" ADD CONSTRAINT "acc_journal_lines_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "acc_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acc_journal_lines" ADD CONSTRAINT "acc_journal_lines_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "acc_cost_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
