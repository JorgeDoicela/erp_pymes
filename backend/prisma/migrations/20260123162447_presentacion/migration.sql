-- AlterTable
ALTER TABLE "attendance" ADD COLUMN     "breakEnd" TIMESTAMP(3),
ADD COLUMN     "breakStart" TIMESTAMP(3),
ADD COLUMN     "isEarlyDeparture" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isLate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "overtimeHours" DOUBLE PRECISION DEFAULT 0;

-- AlterTable
ALTER TABLE "contracts" ADD COLUMN     "hasDoubleOvertime" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "hasNightSurcharge" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "shifts" ADD COLUMN     "breakMinutes" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "toleranceMinutes" INTEGER NOT NULL DEFAULT 15;
