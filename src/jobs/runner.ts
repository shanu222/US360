import { db } from "@/lib/db";
import { buildAIContext } from "@/ai/context";
import { decideDailyLove } from "@/ai/daily-engine";
import { generateCardCopy, generateWeeklyFocus } from "@/ai/services";
import { pickTheme, renderCardHtml } from "@/ai/cards";
import { composeChatCard } from "@/ai/local-replies";
import { fingerprint } from "@/lib/crypto";
import { sendPush } from "@/lib/push";
import { sendEmail } from "@/lib/email";
import { localDateKey, localHour } from "@/lib/utils";
import type { CardCategory, Prisma } from "@prisma/client";

function inQuietHours(settings: { quietHoursStart: string; quietHoursEnd: string }, hour: number) {
  const start = Number(settings.quietHoursStart.split(":")[0]);
  const end = Number(settings.quietHoursEnd.split(":")[0]);
  if (start < end) return hour >= start && hour < end;
  return hour >= start || hour < end;
}

function timeMatches(configured: string, hour: number) {
  return Number(configured.split(":")[0]) === hour;
}

async function markJob(jobName: string, key: string, fn: () => Promise<unknown>) {
  const existing = await db.jobRun.findUnique({ where: { idempotencyKey: key } });
  if (existing?.status === "success") return { skipped: true };

  await db.jobRun.upsert({
    where: { idempotencyKey: key },
    update: { status: "running", startedAt: new Date(), error: null },
    create: { jobName, idempotencyKey: key, status: "running" },
  });

  try {
    const result = await fn();
    await db.jobRun.update({
      where: { idempotencyKey: key },
      data: { status: "success", finishedAt: new Date(), metadata: result as Prisma.InputJsonValue },
    });
    return result;
  } catch (error) {
    await db.jobRun.update({
      where: { idempotencyKey: key },
      data: {
        status: "failed",
        finishedAt: new Date(),
        error: error instanceof Error ? error.message : "unknown",
      },
    });
    throw error;
  }
}

async function notify(userId: string, type: Parameters<typeof db.notification.create>[0]["data"]["type"], title: string, body: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { settings: true },
  });
  if (!user?.settings?.notificationsEnabled) return;

  await db.notification.create({
    data: { userId, type, title, body, sentAt: new Date() },
  });

  if (user.settings.pushNotifications) {
    await sendPush(userId, { title, body, url: "/home" });
  }
  if (user.settings.emailNotifications && user.email) {
    await sendEmail({ to: user.email, subject: title, text: body });
  }
}

export async function prepareDailyContent(now = new Date()) {
  const users = await db.user.findMany({ include: { settings: true, relationships: true } });

  for (const user of users) {
    const settings = user.settings;
    if (!settings || settings.automationMode === "MANUAL") continue;
    const tz = user.timezone || "UTC";
    const dateKey = localDateKey(tz, now);
    const hour = localHour(tz, now);
    if (inQuietHours(settings, hour)) continue;

    const slots: Array<{ name: "morning" | "afternoon" | "evening" | "night"; enabled: boolean; time: string; category?: CardCategory }> = [
      { name: "morning", enabled: settings.notifyMorning, time: settings.morningTime, category: "GOOD_MORNING" },
      { name: "afternoon", enabled: settings.notifyAfternoon, time: settings.afternoonTime },
      { name: "evening", enabled: settings.notifyEvening, time: settings.eveningTime },
      { name: "night", enabled: settings.notifyNight, time: settings.nightTime, category: "GOOD_NIGHT" },
    ];

    for (const slot of slots) {
      if (!slot.enabled || !timeMatches(slot.time, hour)) continue;
      const key = `${user.id}:${dateKey}:${slot.name}`;
      await markJob(`daily:${slot.name}`, key, async () => {
        const ctx = await buildAIContext(user.id);
        const decision = decideDailyLove(ctx, slot.name);

        await db.dailyRecommendation.upsert({
          where: { userId_date_slot: { userId: user.id, date: new Date(dateKey), slot: slot.name } },
          update: {
            action: decision.action,
            title: decision.title,
            body: decision.body,
            payload: (decision.payload ?? undefined) as unknown as Prisma.InputJsonValue | undefined,
            fingerprint: fingerprint([user.id, dateKey, slot.name, decision.action]),
          },
          create: {
            userId: user.id,
            relationshipId: user.relationships[0]?.id,
            date: new Date(dateKey),
            slot: slot.name,
            action: decision.action,
            title: decision.title,
            body: decision.body,
            payload: (decision.payload ?? undefined) as unknown as Prisma.InputJsonValue | undefined,
            fingerprint: fingerprint([user.id, dateKey, slot.name, decision.action]),
          },
        });

        if (slot.category && (decision.action === "SUGGEST_CARD" || settings.automationMode === "SMART")) {
          const recent = await db.card.findMany({
            where: { userId: user.id, category: slot.category },
            orderBy: { createdAt: "desc" },
            take: 8,
          });
          const theme = pickTheme(slot.category, recent.map((c) => c.theme));
          let imported = null;
          try {
            imported = await db.chatImport.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
          } catch {
            imported = null;
          }
          const analysis = (imported?.analysis ?? {}) as {
            likes?: string[];
            foods?: string[];
            topics?: { topic: string; count: number }[];
            notable?: { text: string }[];
            communicationStyle?: string[];
          };
          const stats = (imported?.stats ?? {}) as { missYouCount?: number };
          let copy = composeChatCard({
            category: slot.category,
            partnerName: user.relationships[0]?.partnerName,
            likes: analysis.likes,
            foods: analysis.foods,
            topics: analysis.topics,
            missYouCount: stats.missYouCount,
            notable: analysis.notable,
            communicationStyle: analysis.communicationStyle,
          });
          if (!copy?.message) {
            copy = await generateCardCopy(user.id, { category: slot.category, theme: theme.id });
          }
          const html = renderCardHtml({
            message: copy.message,
            themeId: theme.id,
            partnerName: user.relationships[0]?.partnerName,
            occasion: copy.kicker,
          });
          const fp = fingerprint([user.id, dateKey, slot.category, copy.message]);
          const exists = await db.card.findFirst({ where: { userId: user.id, fingerprint: fp } });
          if (!exists) {
            await db.card.create({
              data: {
                userId: user.id,
                relationshipId: user.relationships[0]?.id,
                category: slot.category,
                theme: theme.id,
                message: copy.message,
                html,
                status: "READY",
                fingerprint: fp,
              },
            });
          }
        }

        await notify(
          user.id,
          slot.name === "morning" ? "MORNING_CARD" : slot.name === "night" ? "NIGHT_CARD" : "EVENING_REMINDER",
          decision.title,
          decision.body,
        );
        return { ok: true };
      });
    }
  }
}

export async function sendEventReminders(now = new Date()) {
  const events = await db.calendarEvent.findMany({ include: { user: { include: { settings: true } }, reminders: true } });
  for (const event of events) {
    if (!event.user.settings?.notifyEvents) continue;
    const tz = event.timezone || event.user.timezone || "UTC";
    const eventDay = localDateKey(tz, event.startAt);
    const today = localDateKey(tz, now);
    const diff = Math.round(
      (new Date(eventDay).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24),
    );
    if (!event.reminderDays.includes(diff)) continue;

    const key = `event:${event.id}:${diff}:${today}`;
    await markJob("event-reminder", key, async () => {
      const when = diff === 0 ? "today" : diff === 1 ? "tomorrow" : `in ${diff} days`;
      await notify(
        event.userId,
        "EVENT_REMINDER",
        `${event.title} is ${when}`,
        event.notes
          ? `From your calendar: ${event.notes.slice(0, 180)} Consider a thoughtful note if it feels right.`
          : "A gentle reminder from US360. Consider a thoughtful note if it feels right.",
      );
      await db.eventReminder.upsert({
        where: { eventId_daysBefore: { eventId: event.id, daysBefore: diff } },
        update: { sentAt: new Date() },
        create: { eventId: event.id, daysBefore: diff, sentAt: new Date() },
      });
      return { ok: true };
    });
  }
}

export async function processReelSchedules(now = new Date()) {
  const due = await db.reelSchedule.findMany({
    where: { status: "SCHEDULED", scheduledAt: { lte: now } },
    include: { reel: true, user: true },
  });

  for (const item of due) {
    await markJob("reel-schedule", item.idempotencyKey, async () => {
      await db.reelSchedule.update({
        where: { id: item.id },
        data: { status: "REQUIRES_ACTION", actionHint: "Open Instagram & Share" },
      });
      await notify(
        item.userId,
        "REEL_READY",
        "A Reel is ready to share",
        item.reel.url
          ? `Open Instagram & Share: ${item.reel.url}`
          : "Direct sending is not available. Open Instagram & Share when you're ready.",
      );
      return { ok: true };
    });
  }
}

export async function weeklyBetterPartner(now = new Date()) {
  const users = await db.user.findMany();
  for (const user of users) {
    const tz = user.timezone || "UTC";
    const dateKey = localDateKey(tz, now);
    const day = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" }).format(now);
    if (day !== "Mon") continue;
    const key = `weekly:${user.id}:${dateKey}`;
    await markJob("weekly-focus", key, async () => {
      const copy = await generateWeeklyFocus(user.id);
      await db.weeklyFocus.upsert({
        where: { userId_weekStart: { userId: user.id, weekStart: new Date(dateKey) } },
        update: { title: copy.title, body: copy.body },
        create: { userId: user.id, weekStart: new Date(dateKey), title: copy.title, body: copy.body },
      });
      await notify(user.id, "WEEKLY_FOCUS", "This week's focus", copy.title);
      return { ok: true };
    });
  }
}

export async function unresolvedNudges(now = new Date()) {
  const open = await db.situation.findMany({
    where: { status: { in: ["OPEN", "UNRESOLVED"] }, createdAt: { lte: new Date(now.getTime() - 1000 * 60 * 60 * 36) } },
  });
  for (const s of open) {
    const key = `unresolved:${s.id}:${localDateKey("UTC", now)}`;
    await markJob("unresolved-nudge", key, async () => {
      await notify(
        s.userId,
        "UNRESOLVED_SITUATION",
        "You marked this situation unresolved",
        "Would you like to review it, or leave it for now? Either choice is valid.",
      );
      return { ok: true };
    });
  }
}

export async function runAllJobs(now = new Date()) {
  await prepareDailyContent(now);
  await sendEventReminders(now);
  await processReelSchedules(now);
  await weeklyBetterPartner(now);
  await unresolvedNudges(now);
}
