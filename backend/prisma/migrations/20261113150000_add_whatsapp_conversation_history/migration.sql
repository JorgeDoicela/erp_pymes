-- AlterTable
ALTER TABLE "whatsapp_conversation_contexts"
    ADD COLUMN "conversationHistoryJson" JSONB,
    ADD COLUMN "lastInteractionAt" TIMESTAMP(3);
