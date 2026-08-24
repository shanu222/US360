import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@us360.local";
  const passwordHash = await bcrypt.hash("demo12345", 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "Alex",
      passwordHash,
      timezone: "UTC",
      settings: { create: { automationMode: "ASSISTED" } },
      onboarding: { create: { completed: true, step: 8, completedAt: new Date() } },
    },
  });

  await prisma.relationship.upsert({
    where: { id: "demo-relationship" },
    update: {},
    create: {
      id: "demo-relationship",
      userId: user.id,
      partnerName: "Maya",
      communicationStyle: "Simple, Romantic",
      timezone: "UTC",
    },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
