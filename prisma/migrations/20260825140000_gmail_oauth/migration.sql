-- Per-user Gmail OAuth email preferences (tokens stay on IntegrationAccount)

ALTER TABLE "UserSettings" ADD COLUMN IF NOT EXISTS "emailCalendarReminders" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "UserSettings" ADD COLUMN IF NOT EXISTS "emailEventReminders" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "UserSettings" ADD COLUMN IF NOT EXISTS "emailImportantDates" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "UserSettings" ADD COLUMN IF NOT EXISTS "emailRelationshipReminders" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "UserSettings" ADD COLUMN IF NOT EXISTS "emailScheduledMessages" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "UserSettings" ADD COLUMN IF NOT EXISTS "autoPartnerEmail" BOOLEAN NOT NULL DEFAULT false;
