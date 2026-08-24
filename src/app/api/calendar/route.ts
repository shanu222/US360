import { z } from "zod";
import { requireUser } from "@/server/auth";
import { db } from "@/lib/db";
import { handleApiError, jsonOk } from "@/lib/api";
import type { CalendarEventType } from "@prisma/client";

const schema = z.object({
  title: z.string().min(1),
  type: z.string(),
  startAt: z.string(),
  notes: z.string().optional(),
  reminderDays: z.array(z.number()).optional(),
});

export async function GET() {
  try {
    const user = await requireUser();
    const items = await db.calendarEvent.findMany({
      where: { userId: user.id },
      orderBy: { startAt: "asc" },
    });
    return jsonOk(items);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());
    const event = await db.calendarEvent.create({
      data: {
        userId: user.id,
        relationshipId: user.relationships[0]?.id,
        title: body.title,
        type: body.type as CalendarEventType,
        startAt: new Date(body.startAt),
        notes: body.notes,
        timezone: user.timezone,
        reminderDays: body.reminderDays ?? [7, 3, 1, 0],
      },
    });
    return jsonOk(event);
  } catch (error) {
    return handleApiError(error);
  }
}
