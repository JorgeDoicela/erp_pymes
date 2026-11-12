-- CreateTable
CREATE TABLE "whatsapp_conversation_contexts" (
    "id" TEXT NOT NULL,
    "phoneKey" TEXT NOT NULL,
    "activeTenantId" TEXT,
    "pendingTenantSelectionJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_conversation_contexts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_action_sessions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "phoneKey" TEXT NOT NULL,
    "skillName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_CONFIRMATION',
    "payloadJson" JSONB NOT NULL,
    "otpHash" TEXT,
    "otpSentToEmail" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "sourceMessageId" TEXT,
    "confirmMessageId" TEXT,
    "resultingEntityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_action_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_conversation_contexts_phoneKey_key" ON "whatsapp_conversation_contexts"("phoneKey");

-- CreateIndex
CREATE INDEX "whatsapp_conversation_contexts_activeTenantId_idx" ON "whatsapp_conversation_contexts"("activeTenantId");

-- CreateIndex
CREATE INDEX "whatsapp_action_sessions_tenantId_employeeId_status_idx" ON "whatsapp_action_sessions"("tenantId", "employeeId", "status");

-- CreateIndex
CREATE INDEX "whatsapp_action_sessions_phoneKey_status_idx" ON "whatsapp_action_sessions"("phoneKey", "status");

-- CreateIndex
CREATE INDEX "whatsapp_action_sessions_expiresAt_idx" ON "whatsapp_action_sessions"("expiresAt");

-- AddForeignKey
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') THEN
        ALTER TABLE "whatsapp_conversation_contexts"
            ADD CONSTRAINT "whatsapp_conversation_contexts_activeTenantId_fkey"
            FOREIGN KEY ("activeTenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

        ALTER TABLE "whatsapp_action_sessions"
            ADD CONSTRAINT "whatsapp_action_sessions_tenantId_fkey"
            FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees') THEN
        ALTER TABLE "whatsapp_action_sessions"
            ADD CONSTRAINT "whatsapp_action_sessions_employeeId_fkey"
            FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

