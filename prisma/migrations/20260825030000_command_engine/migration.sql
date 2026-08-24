-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN IF NOT EXISTS "quietUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CommandRun" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "relationshipId" TEXT,
    "command" TEXT NOT NULL,
    "parsed" JSONB NOT NULL,
    "result" JSONB NOT NULL,
    "emotion" TEXT,
    "situation" TEXT,
    "recommendation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommandRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CommandFeedback" (
    "id" TEXT NOT NULL,
    "commandRunId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "helpful" BOOLEAN,
    "sent" BOOLEAN,
    "outcome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommandFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CommandRun_userId_idx" ON "CommandRun"("userId");
CREATE INDEX IF NOT EXISTS "CommandRun_relationshipId_idx" ON "CommandRun"("relationshipId");
CREATE INDEX IF NOT EXISTS "CommandRun_emotion_idx" ON "CommandRun"("emotion");
CREATE INDEX IF NOT EXISTS "CommandRun_situation_idx" ON "CommandRun"("situation");
CREATE INDEX IF NOT EXISTS "CommandRun_createdAt_idx" ON "CommandRun"("createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "CommandFeedback_commandRunId_key" ON "CommandFeedback"("commandRunId");
CREATE INDEX IF NOT EXISTS "CommandFeedback_userId_idx" ON "CommandFeedback"("userId");
CREATE INDEX IF NOT EXISTS "CommandFeedback_outcome_idx" ON "CommandFeedback"("outcome");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "CommandRun" ADD CONSTRAINT "CommandRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "CommandRun" ADD CONSTRAINT "CommandRun_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "Relationship"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "CommandFeedback" ADD CONSTRAINT "CommandFeedback_commandRunId_fkey" FOREIGN KEY ("commandRunId") REFERENCES "CommandRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
