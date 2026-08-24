import { z } from "zod";
import { requireUser } from "@/server/auth";
import { handleApiError, jsonOk } from "@/lib/api";
import { deliverOutbound, logOutbound, type SendChannel } from "@/integrations/deliver";
import { composeWhatsAppText, whatsappClickUrl } from "@/lib/whatsapp-open";
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
  imageUrls: z.array(z.string()).optional(),
  venue: z
    .object({
      key: z.string(),
      name: z.string(),
      city: z.string(),
      kind: z.string(),
    })
    .optional()
    .nullable(),
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

    if (selected.has("save_venue") && body.venue) {
      await db.savedVenue.upsert({
        where: { userId_venueKey: { userId: user.id, venueKey: body.venue.key } },
        update: { liked: true, name: body.venue.name, city: body.venue.city, kind: body.venue.kind },
        create: {
          userId: user.id,
          venueKey: body.venue.key,
          name: body.venue.name,
          city: body.venue.city,
          kind: body.venue.kind,
        },
      });
      done.push("save_venue");
    }

    if (selected.has("add_plan") && body.venue) {
      const when = body.scheduleAt ? new Date(body.scheduleAt) : new Date(Date.now() + 6 * 3600_000);
      await db.lifestylePlan.create({
        data: {
          userId: user.id,
          title: `Plan: ${body.venue.name}`,
          kind: body.venue.kind === "place" ? "place" : "dinner",
          city: body.venue.city,
          venueName: body.venue.name,
          venueKey: body.venue.key,
          scheduledAt: when,
          notes: "Saved from a command. Confirm reservation yourself.",
        },
      });
      await savePendingEvent(user.id, {
        title: `${body.venue.name} (${body.venue.city})`,
        type: "EVENT",
        startAt: when.toISOString(),
        notes: "Restaurant / place plan from US360. Confirm hours before you go.",
      });
      done.push("add_plan");
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
          metadata: { audience: "partner", source: "command" },
          openUrl: whatsappClickUrl(
            prefs.get("partner_whatsapp"),
            composeWhatsAppText({ reminder: body.reminderPlan.herMessage }),
          ),
        },
      });
      done.push("reminder_her");
    }

    const packed = composeWhatsAppText({
      reminder: selected.has("reminder_her") || selected.has("reminder_user") ? body.reminderPlan?.herMessage : null,
      message: selected.has("message") ? body.message : null,
      card: selected.has("card") ? body.card?.message : null,
      reelUrl: selected.has("reel") ? body.reelUrl : null,
      imageUrls: body.imageUrls,
    });
    const whatsappUrl = whatsappClickUrl(prefs.get("partner_whatsapp"), packed || body.share?.caption || "");

    const deliveries: Array<{ channel: string; status: string; sent: boolean; openUrl?: string | null; reason?: string | null }> = [];
    if (body.sendNow) {
      const channels = new Set<SendChannel>([...((body.channels ?? []) as SendChannel[]), "whatsapp"]);
      const hasContent =
        selected.has("message") ||
        selected.has("reel") ||
        selected.has("reminder_her") ||
        selected.has("card") ||
        Boolean(packed);
      if (hasContent) {
        for (const channel of channels) {
          const openUrl =
            channel === "whatsapp"
              ? whatsappUrl
              : channel === "instagram"
                ? body.share?.instagram ?? body.reelUrl
                : channel === "facebook"
                  ? body.share?.facebook
                  : body.share?.email;
          const emailTo = channel === "email" ? prefs.get("partner_email") || user.email || null : null;
          const result = await deliverOutbound({
            userId: user.id,
            channel,
            body: packed,
            to: emailTo,
            openUrl,
            purpose: selected.has("reel") ? "reel" : selected.has("reminder_her") ? "reminder" : "message",
            audience: channel === "email" && prefs.get("partner_email") ? "partner" : "user",
          });
          const withUrl = channel === "whatsapp" ? { ...result, openUrl: whatsappUrl } : result;
          await logOutbound({
            userId: user.id,
            channel,
            body: packed,
            to: emailTo,
            openUrl: withUrl.openUrl,
            result: withUrl,
          });
          deliveries.push({ channel, ...withUrl });
        }
        if (selected.has("reminder_her")) done.push("reminder_her");
        if (selected.has("message")) done.push("message");
        if (selected.has("reel")) done.push("reel");
      }
    }

    return jsonOk({ applied: done, deliveries, whatsappUrl });
  } catch (error) {
    return handleApiError(error);
  }
}
