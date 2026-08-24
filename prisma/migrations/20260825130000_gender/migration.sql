-- Required male/female identity for the user and partner (additive)

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "gender" TEXT;
ALTER TABLE "Relationship" ADD COLUMN IF NOT EXISTS "partnerGender" TEXT;
