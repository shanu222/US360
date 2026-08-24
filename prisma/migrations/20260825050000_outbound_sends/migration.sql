-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN IF NOT EXISTS "autoInstagram" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "UserSettings" ADD COLUMN IF NOT EXISTS "autoFacebook" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "UserSettings" ADD COLUMN IF NOT EXISTS "autoWhatsapp" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "UserSettings" ADD COLUMN IF NOT EXISTS "autoEmail" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE IF NOT EXISTS "OutboundSend" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "body" TEXT NOT NULL,
    "subject" TEXT,
    "toAddress" TEXT,
    "openUrl" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "error" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutboundSend_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "OutboundSend_userId_idx" ON "OutboundSend"("userId");
CREATE INDEX IF NOT EXISTS "OutboundSend_status_idx" ON "OutboundSend"("status");
CREATE INDEX IF NOT EXISTS "OutboundSend_scheduledAt_idx" ON "OutboundSend"("scheduledAt");

ALTER TABLE "OutboundSend" DROP CONSTRAINT IF EXISTS "OutboundSend_userId_fkey";
ALTER TABLE "OutboundSend" ADD CONSTRAINT "OutboundSend_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
