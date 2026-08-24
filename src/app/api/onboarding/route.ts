import { z } from "zod";
import { requireUser } from "@/server/auth";
import { db } from "@/lib/db";
import { handleApiError, jsonOk } from "@/lib/api";
import { FAVORITE_CATEGORIES } from "@/types";
import type { AutomationMode, CalendarEventType } from "@prisma/client";

const schema = z.object({
  partnerName: z.string().min(1),
  partnerNickname: z.string().optional(),
  startDate: z.string().optional(),
  communicationStyle: z.string().optional(),
  language: z.string().optional(),
  timezone: z.string().min(1),
  favorites: z.record(z.string()),
  dislikes: z.string().optional(),
  birthday: z.string().optional(),
  anniversary: z.string().optional(),
  customDates: z.string().optional(),
  styles: z.array(z.string()),
  automationMode: z.enum(["SMART", "ASSISTED", "MANUAL"]),
  morningTime: z.string(),
  afternoonTime: z.string(),
  eveningTime: z.string(),
  nightTime: z.string(),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());

    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { timezone: body.timezone, language: body.language ?? "en" },
      });

      const relationship = await tx.relationship.create({
        data: {
          userId: user.id,
          partnerName: body.partnerName,
          partnerNickname: body.partnerNickname,
          startDate: body.startDate ? new Date(body.startDate) : null,
          communicationStyle: body.styles.join(", ") || body.communicationStyle,
          preferredLanguage: body.language ?? "en",
          timezone: body.timezone,
        },
      });

      for (const category of FAVORITE_CATEGORIES) {
        const raw = body.favorites[category];
        if (!raw) continue;
        for (const value of raw.split(",").map((v) => v.trim()).filter(Boolean)) {
          await tx.favorite.create({ data: { relationshipId: relationship.id, category, value } });
          await tx.relationshipMemory.create({
            data: {
              relationshipId: relationship.id,
              title: `${category}: ${value}`,
              content: `She likes ${value}.`,
              category: category === "appreciates" ? "FAVORITES" : "FAVORITES",
            },
          });
        }
      }

      if (body.dislikes) {
        for (const value of body.dislikes.split(/[,\n]/).map((v) => v.trim()).filter(Boolean)) {
          await tx.dislike.create({ data: { relationshipId: relationship.id, category: "general", value } });
          await tx.relationshipMemory.create({
            data: {
              relationshipId: relationship.id,
              title: `Dislike: ${value}`,
              content: value,
              category: "DISLIKES",
            },
          });
        }
      }

      async function addDate(title: string, date: string, type: CalendarEventType) {
        await tx.importantDate.create({
          data: { relationshipId: relationship.id, title, date: new Date(date), type, recurring: true },
        });
        await tx.calendarEvent.create({
          data: {
            userId: user.id,
            relationshipId: relationship.id,
            title,
            type,
            startAt: new Date(date),
            timezone: body.timezone,
          },
        });
      }

      if (body.birthday) await addDate("Birthday", body.birthday, "BIRTHDAY");
      if (body.anniversary) await addDate("Anniversary", body.anniversary, "ANNIVERSARY");
      if (body.customDates) {
        for (const line of body.customDates.split("\n").map((l) => l.trim()).filter(Boolean)) {
          const [title, date] = line.split(/[—-]/).map((s) => s.trim());
          if (title && date) await addDate(title, date, "CUSTOM");
        }
      }

      await tx.userSettings.upsert({
        where: { userId: user.id },
        update: {
          automationMode: body.automationMode as AutomationMode,
          morningTime: body.morningTime,
          afternoonTime: body.afternoonTime,
          eveningTime: body.eveningTime,
          nightTime: body.nightTime,
        },
        create: {
          userId: user.id,
          automationMode: body.automationMode as AutomationMode,
          morningTime: body.morningTime,
          afternoonTime: body.afternoonTime,
          eveningTime: body.eveningTime,
          nightTime: body.nightTime,
        },
      });

      await tx.onboardingState.upsert({
        where: { userId: user.id },
        update: { completed: true, step: 8, completedAt: new Date() },
        create: { userId: user.id, completed: true, step: 8, completedAt: new Date() },
      });
    });

    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
