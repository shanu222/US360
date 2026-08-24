import { requireUser } from "@/server/auth";
import { db } from "@/lib/db";
import { handleApiError, jsonOk } from "@/lib/api";
import { fingerprint } from "@/lib/crypto";
import { track } from "@/lib/analytics";

function nextEvening(from: Date, preferredHour = 19) {
  const d = new Date(from);
  d.setHours(preferredHour, 0, 0, 0);
  if (d.getTime() <= from.getTime()) d.setDate(d.getDate() + 1);
  return d;
}

export async function POST() {
  try {
    const user = await requireUser();
    const gapHours = 36;
    const preferred = Number((user.settings?.preferredReelTimes?.[0] ?? "19:00").split(":")[0]) || 19;
    const maxPerDay = user.settings?.maxReelsPerDay ?? 1;

    const [reels, scheduled] = await Promise.all([
      db.reel.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
      db.reelSchedule.findMany({
        where: { userId: user.id, status: { in: ["SCHEDULED", "REQUIRES_ACTION"] } },
      }),
    ]);
    const taken = new Set(scheduled.map((s) => s.reelId));
    const pending = reels.filter((r) => !taken.has(r.id)).slice(0, 10);
    let cursor = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const created = [];

    for (const reel of pending) {
      cursor = nextEvening(new Date(cursor.getTime() + gapHours * 60 * 60 * 1000), preferred);
      const dayStart = new Date(cursor);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const sameDay = await db.reelSchedule.count({
        where: { userId: user.id, scheduledAt: { gte: dayStart, lt: dayEnd }, status: { not: "SKIPPED" } },
      });
      if (sameDay >= maxPerDay) {
        cursor.setDate(cursor.getDate() + 1);
      }
      const item = await db.reelSchedule.create({
        data: {
          userId: user.id,
          reelId: reel.id,
          scheduledAt: cursor,
          timezone: user.timezone,
          notes: "Auto cadence from chat — Open Instagram & Share when due.",
          idempotencyKey: fingerprint([user.id, reel.id, cursor.toISOString()]),
        },
      });
      created.push(item);
    }

    await track("reels_saved", user.id, { feature: "cadence", count: created.length });
    return jsonOk({ scheduled: created.length, gapHours });
  } catch (error) {
    return handleApiError(error);
  }
}
