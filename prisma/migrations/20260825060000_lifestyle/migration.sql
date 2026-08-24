-- City-aware food / restaurant / places (additive)

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "UserSettings" ADD COLUMN IF NOT EXISTS "diningBudget" TEXT;
ALTER TABLE "UserSettings" ADD COLUMN IF NOT EXISTS "preciseLocationOptIn" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "CachedVenue" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerId" TEXT,
    "kind" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "area" TEXT,
    "address" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "cuisine" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "priceRange" TEXT,
    "hoursJson" JSONB,
    "popularDishes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "menuItems" JSONB,
    "venueType" TEXT,
    "familyFriendly" BOOLEAN,
    "outdoor" BOOLEAN,
    "delivery" BOOLEAN,
    "reservation" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "social" JSONB,
    "mapsUrl" TEXT,
    "rating" DOUBLE PRECISION,
    "reviewCount" INTEGER,
    "source" TEXT NOT NULL,
    "freshness" TEXT NOT NULL,
    "lastVerifiedAt" TIMESTAMP(3),
    "raw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CachedVenue_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CachedVenue_key_key" ON "CachedVenue"("key");
CREATE INDEX IF NOT EXISTS "CachedVenue_city_kind_idx" ON "CachedVenue"("city", "kind");
CREATE INDEX IF NOT EXISTS "CachedVenue_provider_idx" ON "CachedVenue"("provider");

CREATE TABLE IF NOT EXISTS "SavedVenue" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "venueKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "liked" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SavedVenue_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SavedVenue_userId_venueKey_key" ON "SavedVenue"("userId", "venueKey");
CREATE INDEX IF NOT EXISTS "SavedVenue_userId_idx" ON "SavedVenue"("userId");

CREATE TABLE IF NOT EXISTS "VenueVisit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "venueKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "visitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    CONSTRAINT "VenueVisit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "VenueVisit_userId_idx" ON "VenueVisit"("userId");
CREATE INDEX IF NOT EXISTS "VenueVisit_visitedAt_idx" ON "VenueVisit"("visitedAt");

CREATE TABLE IF NOT EXISTS "LifestylePlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "city" TEXT,
    "venueName" TEXT,
    "venueKey" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LifestylePlan_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "LifestylePlan_userId_idx" ON "LifestylePlan"("userId");
CREATE INDEX IF NOT EXISTS "LifestylePlan_scheduledAt_idx" ON "LifestylePlan"("scheduledAt");

DO $$ BEGIN
  ALTER TABLE "SavedVenue" ADD CONSTRAINT "SavedVenue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "VenueVisit" ADD CONSTRAINT "VenueVisit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "LifestylePlan" ADD CONSTRAINT "LifestylePlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
