/*
  Warnings:

  - A unique constraint covering the columns `[identityCard]` on the table `employees` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `address` to the `employees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `birthDate` to the `employees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `civilStatus` to the `employees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contractType` to the `employees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hireDate` to the `employees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `identityCard` to the `employees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `employees` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "birthDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "civilStatus" TEXT NOT NULL,
ADD COLUMN     "contractType" TEXT NOT NULL,
ADD COLUMN     "hireDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "identityCard" TEXT NOT NULL,
ADD COLUMN     "phone" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "employees_identityCard_key" ON "employees"("identityCard");
