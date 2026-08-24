import { z } from "zod";
import { requireUser } from "@/server/auth";
import { db } from "@/lib/db";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { getLatestChatImport } from "@/chat/queries";
import { normalizeCity } from "@/lifestyle/cities";
import type { Prisma } from "@prisma/client";

type Pending = { kind: string; title: string; quote: string; whenHint?: string };

function pendingFrom(imported: { analysis: unknown } | null): Pending[] {
  const analysis = (imported?.analysis ?? {}) as { pendingLifestyle?: Pending[] };
  return analysis.pendingLifestyle ?? [];
}

export async function GET() {
  try {
    const user = await requireUser();
    const imported = await getLatestChatImport(user.id);
    return jsonOk(pendingFrom(imported));
  } catch (error) {
    return handleApiError(error);
  }
}

const schema = z.object({
  title: z.string(),
  quote: z.string(),
  action: z.enum(["confirm", "dismiss", "calendar"]),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());
    const imported = await getLatestChatImport(user.id);
    if (!imported) return jsonError("No chat import found.", 404);
    const analysis = (imported.analysis ?? {}) as Record<string, unknown> & { pendingLifestyle?: Pending[] };
    const pending = analysis.pendingLifestyle ?? [];
    const match = pending.find((p) => p.title === body.title && p.quote === body.quote);
    const rest = pending.filter((p) => !(p.title === body.title && p.quote === body.quote));

    if (match && body.action === "confirm") {
      const relationshipId = imported.relationshipId;
      if (relationshipId) {
        await db.relationshipMemory.create({
          data: {
            relationshipId,
            title: match.title,
            content: match.quote,
            category: match.kind === "dislike" ? "DISLIKES" : "PREFERENCES",
            source: "whatsapp-import",
          },
        });
        if (match.kind === "dish" || match.kind === "restaurant") {
          await db.favorite.create({
            data: { relationshipId, category: match.kind === "restaurant" ? "places" : "foods", value: match.title },
          });
        }
      }
    }

    if (match && body.action === "calendar") {
      const start = new Date();
      if (match.whenHint === "tomorrow") start.setDate(start.getDate() + 1);
      else if (match.whenHint === "weekend") start.setDate(start.getDate() + ((6 - start.getDay() + 7) % 7 || 7));
      else start.setHours(start.getHours() + 24);
      start.setHours(19, 0, 0, 0);
      const created = await db.calendarEvent.create({
        data: {
          userId: user.id,
          relationshipId: imported.relationshipId,
          title: match.title,
          type: "EVENT",
          startAt: start,
          timezone: user.timezone,
          notes: `From chat: “${match.quote}”`,
          reminderDays: [1, 0],
        },
      });
      for (const daysBefore of [1, 0]) {
        await db.eventReminder.create({ data: { eventId: created.id, daysBefore } });
      }
    }

    await db.chatImport.update({
      where: { id: imported.id },
      data: { analysis: { ...analysis, pendingLifestyle: rest } as Prisma.InputJsonValue },
    });
    return jsonOk({ remaining: rest.length, city: normalizeCity(user.city) });
  } catch (error) {
    return handleApiError(error);
  }
}
