-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "trackingConsent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "trackingConsentDate" TIMESTAMP(3);
