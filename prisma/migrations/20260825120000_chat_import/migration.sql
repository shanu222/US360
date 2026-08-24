-- AlterTable
ALTER TABLE "OnboardingState" ADD COLUMN IF NOT EXISTS "chatImportStatus" TEXT NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "ChatImport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "relationshipId" TEXT,
    "fileName" TEXT NOT NULL,
    "chatFileName" TEXT,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "partnerName" TEXT,
    "firstAt" TIMESTAMP(3),
    "lastAt" TIMESTAMP(3),
    "stats" JSONB NOT NULL,
    "analysis" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "importId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "sender" TEXT NOT NULL,
    "isPartner" BOOLEAN NOT NULL DEFAULT false,
    "kind" TEXT NOT NULL DEFAULT 'text',
    "text" TEXT NOT NULL,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatImport_userId_idx" ON "ChatImport"("userId");

-- CreateIndex
CREATE INDEX "ChatImport_relationshipId_idx" ON "ChatImport"("relationshipId");

-- CreateIndex
CREATE INDEX "ChatImport_createdAt_idx" ON "ChatImport"("createdAt");

-- CreateIndex
CREATE INDEX "ChatMessage_importId_idx" ON "ChatMessage"("importId");

-- CreateIndex
CREATE INDEX "ChatMessage_sentAt_idx" ON "ChatMessage"("sentAt");

-- CreateIndex
CREATE INDEX "ChatMessage_kind_idx" ON "ChatMessage"("kind");

-- AddForeignKey
ALTER TABLE "ChatImport" ADD CONSTRAINT "ChatImport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatImport" ADD CONSTRAINT "ChatImport_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "Relationship"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_importId_fkey" FOREIGN KEY ("importId") REFERENCES "ChatImport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
