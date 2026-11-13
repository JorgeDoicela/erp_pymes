-- AlterTable
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "ipRestrictionEnabled" BOOLEAN NOT NULL DEFAULT false;

-- Backfill existing tenants that already had allowedIPs configured
UPDATE "system_settings"
SET "ipRestrictionEnabled" = true
WHERE "allowedIPs" IS NOT NULL AND TRIM("allowedIPs") <> '';
