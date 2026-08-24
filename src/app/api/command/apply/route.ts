import { z } from "zod";
import { requireUser } from "@/server/auth";
import { handleApiError, jsonOk } from "@/lib/api";
import { deliverOutbound, logOutbound, type SendChannel } from "@/integrations/deliver";
import { db } from "@/lib/db";
import { savePendingEvent } from "@/engine/run";
import { pickTheme, renderCardHtml } from "@/ai/cards";
import { fingerprint } from "@/lib/crypto";
import type { CardCategory } from "@prisma/client";

const schema = z.object({
  actionIds: z.array(z.string()),
  channels: z.array(z.enum(["instagram", "facebook", "whatsapp", "email"])).optional(),
  sendNow: z.boolean().optional(),
  scheduleAt: z.string().optional(),
  message: z.string().optional(),
  pendingEvent: z
    .object({ title: z.string(), type: z.string(), startAt: z.string(), notes: z.string().optional() })
    .optional()
    .nullable(),
  reminderPlan: z
    .object({
      userMessage: z.string(),
      herMessage: z.string(),
      userReminderAt: z.string(),
      herReminderAt: z.string(),
    })
    .optional()
    .nullable(),
  card: z
    .object({ theme: z.string(), message: z.string(), category: z.string() })
    .optional()
    .nullable(),
  reelUrl: z.string().optional().nullable(),
  share: z
    .object({
      caption: z.string(),
      whatsapp: z.string(),
      instagram: z.string(),
      facebook: z.string(),
      email: z.string().nullable().optional(),
    })
    .optional()
    .nullable(),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());
    const selected = new Set(body.actionIds);
    const relationship = await db.relationship.findFirst({ where: { userId: user.id }, include: { preferences: true } });
    const prefs = new Map((relationship?.preferences ?? []).map((p) => [p.key, p.value]));

    const done: string[] = [];
    if (selected.has("calendar") && body.pendingEvent) {
      await savePendingEvent(user.id, body.pendingEvent);
      done.push("calendar");
    }

    if (selected.has("card") && body.card) {
      const theme = pickTheme(body.card.category, []);
      await db.card.create({
        data: {
          userId: user.id,
          relationshipId: relationship?.id,
          category: body.card.category as CardCategory,
          theme: body.card.theme || theme.id,
          message: body.card.message,
          html: renderCardHtml({
            message: body.card.message,
            themeId: body.card.theme || theme.id,
            partnerName: relationship?.partnerName,
            occasion: body.card.category.replaceAll("_", " "),
          }),
          status: "READY",
          fingerprint: fingerprint([user.id, "apply-card", body.card.message, Date.now().toString()]),
        },
      });
      done.push("card");
    }

    if (selected.has("reminder_her") && body.reminderPlan && !body.sendNow) {
      await db.outboundSend.create({
        data: {
          userId: user.id,
          channel: "email",
          status: "scheduled",
          body: body.reminderPlan.herMessage,
          subject: "A note for you",
          scheduledAt: new Date(body.reminderPlan.herReminderAt),
          toAddress: prefs.get("partner_email") || null,
        },
      });
      done.push("reminder_her");
    }

    const deliveries: Array<{ channel: string; status: string; sent: boolean; openUrl?: string | null; reason?: string | null }> = [];
    if (body.sendNow && body.channels?.length && (selected.has("message") || selected.has("reel") || selected.has("reminder_her"))) {
      const hasReel = selected.has("reel");
      const text = hasReel
        ? [body.message, body.reelUrl].filter(Boolean).join("\n")
        : body.message || body.reminderPlan?.herMessage || "";
      for (const channel of body.channels as SendChannel[]) {
        const openUrl =
          channel === "whatsapp"
            ? body.share?.whatsapp
            : channel === "instagram"
              ? body.share?.instagram ?? body.reelUrl
              : channel === "facebook"
                ? body.share?.facebook
                : body.share?.email;
        const emailTo = channel === "email" ? prefs.get("partner_email") || null : null;
        const result = await deliverOutbound({
          userId: user.id,
          channel,
          body: text,
          to: emailTo,
          openUrl,
          purpose: hasReel ? "reel" : selected.has("reminder_her") ? "reminder" : "message",
        });
        await logOutbound({
          userId: user.id,
          channel,
          body: text,
          to: emailTo,
          openUrl,
          result,
        });
        deliveries.push({ channel, ...result });
      }
      if (selected.has("reminder_her")) done.push("reminder_her");
    }

    return jsonOk({ applied: done, deliveries });
  } catch (error) {
    return handleApiError(error);
  }
}
