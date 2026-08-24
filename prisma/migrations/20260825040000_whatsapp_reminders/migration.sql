-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN IF NOT EXISTS "whatsappNumber" TEXT;
ALTER TABLE "UserSettings" ADD COLUMN IF NOT EXISTS "whatsappReminders" BOOLEAN NOT NULL DEFAULT false;
