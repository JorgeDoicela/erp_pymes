-- AlterTable: Agregar campos de consentimiento LOPDP para el canal WhatsApp corporativo
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "whatsappConsent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "whatsappConsentDate" TIMESTAMP(3);

-- CreateIndex: Optimización de consultas multi-tenant por estado de consentimiento LOPDP
CREATE INDEX IF NOT EXISTS "employees_tenantId_whatsappConsent_idx" ON "employees"("tenantId", "whatsappConsent");
