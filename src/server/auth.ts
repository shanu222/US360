import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function requireUser() {
  const session = await requireSession();
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      settings: true,
      relationships: { take: 1, orderBy: { createdAt: "asc" } },
      onboarding: true,
      writingStyle: true,
    },
  });
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function getPrimaryRelationship(userId: string) {
  return db.relationship.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: {
      memories: { orderBy: { createdAt: "desc" }, take: 40 },
      favorites: true,
      dislikes: true,
      importantDates: { orderBy: { date: "asc" } },
      preferences: true,
    },
  });
}
