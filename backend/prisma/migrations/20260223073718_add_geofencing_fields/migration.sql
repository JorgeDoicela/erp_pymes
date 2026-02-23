-- AlterTable
ALTER TABLE "attendance" ADD COLUMN     "ipAddress" TEXT;

-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "ip" TEXT;

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "currentChallenge" TEXT,
ADD COLUMN     "enforceGeofence" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "geofenceRadius" DOUBLE PRECISION DEFAULT 200,
ADD COLUMN     "workLatitude" DOUBLE PRECISION,
ADD COLUMN     "workLongitude" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "system_settings" ADD COLUMN     "biometricEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "biometric_credentials" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "counter" INTEGER NOT NULL DEFAULT 0,
    "transports" TEXT,
    "deviceInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "biometric_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "biometric_credentials_credentialId_key" ON "biometric_credentials"("credentialId");

-- CreateIndex
CREATE INDEX "biometric_credentials_employeeId_idx" ON "biometric_credentials"("employeeId");

-- AddForeignKey
ALTER TABLE "biometric_credentials" ADD CONSTRAINT "biometric_credentials_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
