import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export async function track(name: string, userId?: string | null, metadata?: Record<string, unknown>) {
  const safe = metadata
    ? Object.fromEntries(
        Object.entries(metadata).filter(([k]) => !/message|content|body|memory|partner/i.test(k)),
      )
    : undefined;

  await db.analyticsEvent.create({
    data: { name, userId: userId ?? undefined, metadata: safe as unknown as Prisma.InputJsonValue | undefined },
  });
}
