-- AlterTable
ALTER TABLE "biometric_credentials" ADD COLUMN     "aaguid" TEXT,
ADD COLUMN     "lastVerified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "system_settings" ADD COLUMN     "allowedIPs" TEXT,
ADD COLUMN     "globalLatitude" DOUBLE PRECISION,
ADD COLUMN     "globalLongitude" DOUBLE PRECISION,
ADD COLUMN     "globalRadius" DOUBLE PRECISION DEFAULT 200;
