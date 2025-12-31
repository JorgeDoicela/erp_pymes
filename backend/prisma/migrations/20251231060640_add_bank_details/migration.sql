-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "accountNumber" TEXT,
ADD COLUMN     "accountType" TEXT,
ADD COLUMN     "bankName" TEXT;

-- AlterTable
ALTER TABLE "payrolls" ADD COLUMN     "paymentDate" TIMESTAMP(3);
