import { z } from "zod";
import { requireUser } from "@/server/auth";
import { db } from "@/lib/db";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { fingerprint } from "@/lib/crypto";
import { track } from "@/lib/analytics";

const schema = z.object({
  reelId: z.string(),
  scheduledAt: z.string(),
  notes: z.string().optional(),
});

export async function GET() {
  try {
    const user = await requireUser();
    const items = await db.reelSchedule.findMany({
      where: { userId: user.id },
      orderBy: { scheduledAt: "desc" },
      take: 40,
    });
    return jsonOk(items);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const settings = user.settings;
    const body = schema.parse(await req.json());
    const scheduledAt = new Date(body.scheduledAt);
    const dayStart = new Date(scheduledAt);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const count = await db.reelSchedule.count({
      where: { userId: user.id, scheduledAt: { gte: dayStart, lt: dayEnd }, status: { not: "SKIPPED" } },
    });
    if (count >= (settings?.maxReelsPerDay ?? 1)) {
      return jsonError("You’ve reached the maximum Reels for that day.");
    }

    const item = await db.reelSchedule.create({
      data: {
        userId: user.id,
        reelId: body.reelId,
        scheduledAt,
        timezone: user.timezone,
        notes: body.notes,
        idempotencyKey: fingerprint([user.id, body.reelId, scheduledAt.toISOString()]),
      },
    });
    await track("cards_scheduled", user.id, { feature: "reel" });
    return jsonOk(item);
  } catch (error) {
    return handleApiError(error);
  }
}
