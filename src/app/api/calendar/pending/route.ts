import { z } from "zod";
import { requireUser } from "@/server/auth";
import { db } from "@/lib/db";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { getLatestChatImport } from "@/chat/queries";
import type { CalendarEventType, Prisma } from "@prisma/client";

type Pending = {
  title: string;
  at: string;
  type: string;
  hint: string;
  quote: string;
  confidence?: string;
};

function pendingFrom(imported: { analysis: unknown } | null): Pending[] {
  const analysis = (imported?.analysis ?? {}) as { pendingCalendar?: Pending[] };
  return analysis.pendingCalendar ?? [];
}

export async function GET() {
  try {
    const user = await requireUser();
    const imported = await getLatestChatImport(user.id);
    const items = pendingFrom(imported).sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
    return jsonOk(items);
  } catch (error) {
    return handleApiError(error);
  }
}

const schema = z.object({
  title: z.string(),
  at: z.string(),
  action: z.enum(["confirm", "dismiss"]),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());
    const imported = await getLatestChatImport(user.id);
    if (!imported) return jsonError("No chat import found.", 404);
    const analysis = (imported.analysis ?? {}) as Record<string, unknown> & { pendingCalendar?: Pending[] };
    const pending = analysis.pendingCalendar ?? [];
    const match = pending.find((p) => p.title === body.title && p.at === body.at);
    const rest = pending.filter((p) => !(p.title === body.title && p.at === body.at));

    if (body.action === "confirm" && match) {
      const startAt = new Date(match.at);
      const created = await db.calendarEvent.create({
        data: {
          userId: user.id,
          relationshipId: imported.relationshipId,
          title: match.title,
          type: (match.type as CalendarEventType) || "EVENT",
          startAt,
          timezone: user.timezone,
          notes: `${match.hint}\n“${match.quote}”`,
          reminderDays: [7, 3, 1, 0],
        },
      });
      for (const daysBefore of [7, 3, 1, 0]) {
        await db.eventReminder.create({ data: { eventId: created.id, daysBefore } });
      }
    }

    await db.chatImport.update({
      where: { id: imported.id },
      data: { analysis: { ...analysis, pendingCalendar: rest } as Prisma.InputJsonValue },
    });
    return jsonOk({ remaining: rest.length });
  } catch (error) {
    return handleApiError(error);
  }
}
