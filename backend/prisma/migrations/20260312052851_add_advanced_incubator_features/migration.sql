-- AlterTable
ALTER TABLE "ent_projects" ADD COLUMN     "budget" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "expenses" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "innovationScore" DOUBLE PRECISION DEFAULT 0;

-- CreateTable
CREATE TABLE "ent_equities" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "holderName" TEXT NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "role" TEXT NOT NULL,
    "vestingTerms" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ent_equities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ent_funding_rounds" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "roundName" TEXT NOT NULL,
    "amountRaised" DOUBLE PRECISION NOT NULL,
    "valuation" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "investors" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ent_funding_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ent_interviews" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "feedback" TEXT NOT NULL,
    "sentiment" TEXT,
    "insights" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ent_interviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ent_target_market" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "tam" DOUBLE PRECISION,
    "sam" DOUBLE PRECISION,
    "som" DOUBLE PRECISION,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ent_target_market_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ent_equities_projectId_idx" ON "ent_equities"("projectId");

-- CreateIndex
CREATE INDEX "ent_funding_rounds_projectId_idx" ON "ent_funding_rounds"("projectId");

-- CreateIndex
CREATE INDEX "ent_interviews_projectId_idx" ON "ent_interviews"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ent_target_market_projectId_key" ON "ent_target_market"("projectId");

-- AddForeignKey
ALTER TABLE "ent_equities" ADD CONSTRAINT "ent_equities_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ent_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ent_funding_rounds" ADD CONSTRAINT "ent_funding_rounds_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ent_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ent_interviews" ADD CONSTRAINT "ent_interviews_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ent_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ent_target_market" ADD CONSTRAINT "ent_target_market_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ent_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
