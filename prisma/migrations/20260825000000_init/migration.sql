-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "MemoryCategory" AS ENUM ('FAVORITES', 'LIKES', 'DISLIKES', 'IMPORTANT', 'MEMORIES', 'PROMISES', 'GOALS', 'PREFERENCES', 'GENERAL');

-- CreateEnum
CREATE TYPE "Importance" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "CalendarEventType" AS ENUM ('BIRTHDAY', 'ANNIVERSARY', 'EVENT', 'EXAM', 'WORK', 'FAMILY', 'PERSONAL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "SituationStatus" AS ENUM ('OPEN', 'RESOLVED', 'UNRESOLVED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RecommendationType" AS ENUM ('APOLOGIZE', 'TALK_CALMLY', 'GIVE_SPACE', 'CLARIFY', 'APPRECIATE', 'DO_SOMETHING_THOUGHTFUL', 'WAIT_BEFORE_RESPONDING', 'TALK_IN_PERSON', 'NO_ACTION_NEEDED', 'SEND', 'WAIT', 'ASK_USER', 'SUGGEST_GESTURE', 'SUGGEST_REEL', 'SUGGEST_MESSAGE', 'SUGGEST_CARD');

-- CreateEnum
CREATE TYPE "MessageCategory" AS ENUM ('ROMANTIC', 'APOLOGY', 'APPRECIATION', 'FUNNY', 'GOOD_MORNING', 'GOOD_NIGHT', 'CONGRATULATIONS', 'ENCOURAGEMENT', 'BIRTHDAY', 'ANNIVERSARY', 'THINKING_OF_YOU', 'MISS_YOU', 'CUSTOM');

-- CreateEnum
CREATE TYPE "CardCategory" AS ENUM ('GOOD_MORNING', 'GOOD_NIGHT', 'ROMANTIC', 'APPRECIATION', 'SORRY', 'BIRTHDAY', 'ANNIVERSARY', 'CONGRATULATIONS', 'MOTIVATION', 'THINKING_OF_YOU', 'MISS_YOU', 'CUSTOM');

-- CreateEnum
CREATE TYPE "CardStatus" AS ENUM ('DRAFT', 'READY', 'SCHEDULED', 'SHARED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "ReelCategory" AS ENUM ('ROMANTIC', 'FUNNY', 'CUTE', 'APPRECIATION', 'SORRY', 'MOTIVATION', 'CELEBRATION', 'MEMORY');

-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('SCHEDULED', 'SENT', 'SKIPPED', 'FAILED', 'REQUIRES_ACTION');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('MORNING_CARD', 'NIGHT_CARD', 'EVENING_REMINDER', 'EVENT_REMINDER', 'REEL_READY', 'UNRESOLVED_SITUATION', 'WEEKLY_FOCUS', 'SYSTEM');

-- CreateEnum
CREATE TYPE "DailyAction" AS ENUM ('SEND', 'WAIT', 'NO_ACTION', 'ASK_USER', 'SUGGEST_GESTURE', 'SUGGEST_REEL', 'SUGGEST_MESSAGE', 'SUGGEST_CARD');

-- CreateEnum
CREATE TYPE "AutomationMode" AS ENUM ('SMART', 'ASSISTED', 'MANUAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "name" TEXT,
    "passwordHash" TEXT,
    "image" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "language" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Relationship" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "partnerName" TEXT NOT NULL,
    "partnerNickname" TEXT,
    "startDate" TIMESTAMP(3),
    "communicationStyle" TEXT,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Relationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "step" INTEGER NOT NULL DEFAULT 1,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelationshipMemory" (
    "id" TEXT NOT NULL,
    "relationshipId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" "MemoryCategory" NOT NULL DEFAULT 'GENERAL',
    "importance" "Importance" NOT NULL DEFAULT 'MEDIUM',
    "reminderAt" TIMESTAMP(3),
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RelationshipMemory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Preference" (
    "id" TEXT NOT NULL,
    "relationshipId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Preference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "relationshipId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dislike" (
    "id" TEXT NOT NULL,
    "relationshipId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dislike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportantDate" (
    "id" TEXT NOT NULL,
    "relationshipId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "recurring" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportantDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "relationshipId" TEXT,
    "title" TEXT NOT NULL,
    "type" "CalendarEventType" NOT NULL DEFAULT 'CUSTOM',
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),
    "allDay" BOOLEAN NOT NULL DEFAULT true,
    "recurring" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "notes" TEXT,
    "reminderDays" INTEGER[] DEFAULT ARRAY[7, 3, 1, 0]::INTEGER[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventReminder" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "daysBefore" INTEGER NOT NULL,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Situation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "relationshipId" TEXT,
    "description" TEXT NOT NULL,
    "howUserFeels" TEXT,
    "whatUserWants" TEXT,
    "status" "SituationStatus" NOT NULL DEFAULT 'OPEN',
    "category" TEXT,
    "afterArgument" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Situation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SituationAnalysis" (
    "id" TEXT NOT NULL,
    "situationId" TEXT NOT NULL,
    "recommendation" "RecommendationType" NOT NULL,
    "confidence" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "reasoningSummary" TEXT NOT NULL,
    "avoid" TEXT[],
    "nextStep" TEXT NOT NULL,
    "suggestedMessage" TEXT,
    "gesture" TEXT,
    "needsSpace" BOOLEAN NOT NULL DEFAULT false,
    "rawJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SituationAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "relationshipId" TEXT,
    "category" "MessageCategory" NOT NULL DEFAULT 'CUSTOM',
    "tone" TEXT,
    "length" TEXT,
    "content" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'studio',
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageTemplate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" "MessageCategory" NOT NULL DEFAULT 'CUSTOM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WritingStyle" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "samples" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WritingStyle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Card" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "relationshipId" TEXT,
    "category" "CardCategory" NOT NULL,
    "theme" TEXT NOT NULL,
    "color" TEXT,
    "style" TEXT,
    "message" TEXT NOT NULL,
    "imageUrl" TEXT,
    "html" TEXT,
    "photoUrl" TEXT,
    "occasion" TEXT,
    "status" "CardStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduledAt" TIMESTAMP(3),
    "sharedAt" TIMESTAMP(3),
    "fingerprint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "CardCategory" NOT NULL,
    "theme" TEXT NOT NULL,
    "htmlTemplate" TEXT NOT NULL,
    "previewColor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CardTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reel" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "relationshipId" TEXT,
    "url" TEXT NOT NULL,
    "category" "ReelCategory" NOT NULL,
    "notes" TEXT,
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReelSchedule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reelId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "status" "ScheduleStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "actionHint" TEXT,
    "sentAt" TIMESTAMP(3),
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReelSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Insight" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Insight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyRecommendation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "relationshipId" TEXT,
    "date" DATE NOT NULL,
    "slot" TEXT NOT NULL,
    "action" "DailyAction" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "payload" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ready',
    "fingerprint" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyFocus" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekStart" DATE NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeeklyFocus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GiftSuggestion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "occasion" TEXT NOT NULL,
    "budget" TEXT NOT NULL,
    "ideas" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GiftSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "scopes" TEXT[],
    "metadata" JSONB,
    "status" TEXT NOT NULL DEFAULT 'connected',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "automationMode" "AutomationMode" NOT NULL DEFAULT 'ASSISTED',
    "morningTime" TEXT NOT NULL DEFAULT '08:00',
    "afternoonTime" TEXT NOT NULL DEFAULT '14:00',
    "eveningTime" TEXT NOT NULL DEFAULT '19:00',
    "nightTime" TEXT NOT NULL DEFAULT '22:00',
    "quietHoursStart" TEXT NOT NULL DEFAULT '23:00',
    "quietHoursEnd" TEXT NOT NULL DEFAULT '07:00',
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "notifyMorning" BOOLEAN NOT NULL DEFAULT true,
    "notifyAfternoon" BOOLEAN NOT NULL DEFAULT false,
    "notifyEvening" BOOLEAN NOT NULL DEFAULT true,
    "notifyNight" BOOLEAN NOT NULL DEFAULT true,
    "notifyEvents" BOOLEAN NOT NULL DEFAULT true,
    "maxReelsPerDay" INTEGER NOT NULL DEFAULT 1,
    "preferredReelTimes" TEXT[] DEFAULT ARRAY['19:00']::TEXT[],
    "skipReelDays" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "allowedReelCategories" TEXT[] DEFAULT ARRAY['ROMANTIC', 'FUNNY', 'CUTE', 'APPRECIATION', 'SORRY', 'MOTIVATION', 'CELEBRATION', 'MEMORY']::TEXT[],
    "aiShareMemories" BOOLEAN NOT NULL DEFAULT true,
    "aiShareCalendar" BOOLEAN NOT NULL DEFAULT true,
    "aiShareSituations" BOOLEAN NOT NULL DEFAULT true,
    "aiShareStyle" BOOLEAN NOT NULL DEFAULT true,
    "dailyAiLimit" INTEGER NOT NULL DEFAULT 40,
    "cardRepeatDays" INTEGER NOT NULL DEFAULT 14,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIUsageLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "tokensIn" INTEGER NOT NULL DEFAULT 0,
    "tokensOut" INTEGER NOT NULL DEFAULT 0,
    "cached" BOOLEAN NOT NULL DEFAULT false,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobRun" (
    "id" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "error" TEXT,
    "metadata" JSONB,

    CONSTRAINT "JobRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "Relationship_userId_idx" ON "Relationship"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingState_userId_key" ON "OnboardingState"("userId");

-- CreateIndex
CREATE INDEX "RelationshipMemory_relationshipId_idx" ON "RelationshipMemory"("relationshipId");

-- CreateIndex
CREATE INDEX "RelationshipMemory_category_idx" ON "RelationshipMemory"("category");

-- CreateIndex
CREATE INDEX "RelationshipMemory_createdAt_idx" ON "RelationshipMemory"("createdAt");

-- CreateIndex
CREATE INDEX "Preference_relationshipId_idx" ON "Preference"("relationshipId");

-- CreateIndex
CREATE UNIQUE INDEX "Preference_relationshipId_key_key" ON "Preference"("relationshipId", "key");

-- CreateIndex
CREATE INDEX "Favorite_relationshipId_idx" ON "Favorite"("relationshipId");

-- CreateIndex
CREATE INDEX "Favorite_category_idx" ON "Favorite"("category");

-- CreateIndex
CREATE INDEX "Dislike_relationshipId_idx" ON "Dislike"("relationshipId");

-- CreateIndex
CREATE INDEX "ImportantDate_relationshipId_idx" ON "ImportantDate"("relationshipId");

-- CreateIndex
CREATE INDEX "ImportantDate_date_idx" ON "ImportantDate"("date");

-- CreateIndex
CREATE INDEX "ImportantDate_type_idx" ON "ImportantDate"("type");

-- CreateIndex
CREATE INDEX "CalendarEvent_userId_idx" ON "CalendarEvent"("userId");

-- CreateIndex
CREATE INDEX "CalendarEvent_relationshipId_idx" ON "CalendarEvent"("relationshipId");

-- CreateIndex
CREATE INDEX "CalendarEvent_startAt_idx" ON "CalendarEvent"("startAt");

-- CreateIndex
CREATE INDEX "CalendarEvent_type_idx" ON "CalendarEvent"("type");

-- CreateIndex
CREATE INDEX "EventReminder_eventId_idx" ON "EventReminder"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "EventReminder_eventId_daysBefore_key" ON "EventReminder"("eventId", "daysBefore");

-- CreateIndex
CREATE INDEX "Situation_userId_idx" ON "Situation"("userId");

-- CreateIndex
CREATE INDEX "Situation_relationshipId_idx" ON "Situation"("relationshipId");

-- CreateIndex
CREATE INDEX "Situation_status_idx" ON "Situation"("status");

-- CreateIndex
CREATE INDEX "Situation_createdAt_idx" ON "Situation"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SituationAnalysis_situationId_key" ON "SituationAnalysis"("situationId");

-- CreateIndex
CREATE INDEX "Message_userId_idx" ON "Message"("userId");

-- CreateIndex
CREATE INDEX "Message_relationshipId_idx" ON "Message"("relationshipId");

-- CreateIndex
CREATE INDEX "Message_category_idx" ON "Message"("category");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");

-- CreateIndex
CREATE INDEX "MessageTemplate_userId_idx" ON "MessageTemplate"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WritingStyle_userId_key" ON "WritingStyle"("userId");

-- CreateIndex
CREATE INDEX "Card_userId_idx" ON "Card"("userId");

-- CreateIndex
CREATE INDEX "Card_relationshipId_idx" ON "Card"("relationshipId");

-- CreateIndex
CREATE INDEX "Card_category_idx" ON "Card"("category");

-- CreateIndex
CREATE INDEX "Card_status_idx" ON "Card"("status");

-- CreateIndex
CREATE INDEX "Card_scheduledAt_idx" ON "Card"("scheduledAt");

-- CreateIndex
CREATE INDEX "Card_fingerprint_idx" ON "Card"("fingerprint");

-- CreateIndex
CREATE INDEX "Reel_userId_idx" ON "Reel"("userId");

-- CreateIndex
CREATE INDEX "Reel_relationshipId_idx" ON "Reel"("relationshipId");

-- CreateIndex
CREATE INDEX "Reel_category_idx" ON "Reel"("category");

-- CreateIndex
CREATE INDEX "Reel_createdAt_idx" ON "Reel"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReelSchedule_idempotencyKey_key" ON "ReelSchedule"("idempotencyKey");

-- CreateIndex
CREATE INDEX "ReelSchedule_userId_idx" ON "ReelSchedule"("userId");

-- CreateIndex
CREATE INDEX "ReelSchedule_reelId_idx" ON "ReelSchedule"("reelId");

-- CreateIndex
CREATE INDEX "ReelSchedule_scheduledAt_idx" ON "ReelSchedule"("scheduledAt");

-- CreateIndex
CREATE INDEX "ReelSchedule_status_idx" ON "ReelSchedule"("status");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "Notification_scheduledAt_idx" ON "Notification"("scheduledAt");

-- CreateIndex
CREATE INDEX "Notification_read_idx" ON "Notification"("read");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- CreateIndex
CREATE INDEX "Insight_userId_idx" ON "Insight"("userId");

-- CreateIndex
CREATE INDEX "Insight_period_idx" ON "Insight"("period");

-- CreateIndex
CREATE INDEX "DailyRecommendation_userId_idx" ON "DailyRecommendation"("userId");

-- CreateIndex
CREATE INDEX "DailyRecommendation_relationshipId_idx" ON "DailyRecommendation"("relationshipId");

-- CreateIndex
CREATE INDEX "DailyRecommendation_date_idx" ON "DailyRecommendation"("date");

-- CreateIndex
CREATE INDEX "DailyRecommendation_fingerprint_idx" ON "DailyRecommendation"("fingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "DailyRecommendation_userId_date_slot_key" ON "DailyRecommendation"("userId", "date", "slot");

-- CreateIndex
CREATE INDEX "WeeklyFocus_userId_idx" ON "WeeklyFocus"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyFocus_userId_weekStart_key" ON "WeeklyFocus"("userId", "weekStart");

-- CreateIndex
CREATE INDEX "GiftSuggestion_userId_idx" ON "GiftSuggestion"("userId");

-- CreateIndex
CREATE INDEX "IntegrationAccount_userId_idx" ON "IntegrationAccount"("userId");

-- CreateIndex
CREATE INDEX "IntegrationAccount_provider_idx" ON "IntegrationAccount"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationAccount_userId_provider_key" ON "IntegrationAccount"("userId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- CreateIndex
CREATE INDEX "AIUsageLog_userId_idx" ON "AIUsageLog"("userId");

-- CreateIndex
CREATE INDEX "AIUsageLog_feature_idx" ON "AIUsageLog"("feature");

-- CreateIndex
CREATE INDEX "AIUsageLog_createdAt_idx" ON "AIUsageLog"("createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_userId_idx" ON "AnalyticsEvent"("userId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_name_idx" ON "AnalyticsEvent"("name");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "JobRun_idempotencyKey_key" ON "JobRun"("idempotencyKey");

-- CreateIndex
CREATE INDEX "JobRun_jobName_idx" ON "JobRun"("jobName");

-- CreateIndex
CREATE INDEX "JobRun_status_idx" ON "JobRun"("status");

-- CreateIndex
CREATE INDEX "JobRun_startedAt_idx" ON "JobRun"("startedAt");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingState" ADD CONSTRAINT "OnboardingState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelationshipMemory" ADD CONSTRAINT "RelationshipMemory_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "Relationship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Preference" ADD CONSTRAINT "Preference_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "Relationship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "Relationship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dislike" ADD CONSTRAINT "Dislike_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "Relationship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportantDate" ADD CONSTRAINT "ImportantDate_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "Relationship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "Relationship"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventReminder" ADD CONSTRAINT "EventReminder_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Situation" ADD CONSTRAINT "Situation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Situation" ADD CONSTRAINT "Situation_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "Relationship"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SituationAnalysis" ADD CONSTRAINT "SituationAnalysis_situationId_fkey" FOREIGN KEY ("situationId") REFERENCES "Situation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "Relationship"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageTemplate" ADD CONSTRAINT "MessageTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WritingStyle" ADD CONSTRAINT "WritingStyle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "Relationship"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reel" ADD CONSTRAINT "Reel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reel" ADD CONSTRAINT "Reel_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "Relationship"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReelSchedule" ADD CONSTRAINT "ReelSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReelSchedule" ADD CONSTRAINT "ReelSchedule_reelId_fkey" FOREIGN KEY ("reelId") REFERENCES "Reel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Insight" ADD CONSTRAINT "Insight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyRecommendation" ADD CONSTRAINT "DailyRecommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyRecommendation" ADD CONSTRAINT "DailyRecommendation_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "Relationship"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyFocus" ADD CONSTRAINT "WeeklyFocus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftSuggestion" ADD CONSTRAINT "GiftSuggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationAccount" ADD CONSTRAINT "IntegrationAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIUsageLog" ADD CONSTRAINT "AIUsageLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

