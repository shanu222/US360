import { db } from "@/lib/db";
import { pickTheme } from "@/ai/cards";
import { loadEngineContext } from "@/engine/context";
import { parseCommand } from "@/engine/parse";
import { decideCommand } from "@/engine/decide";
import { composeMessage } from "@/engine/templates";
import { buildSharePack, pickBestReel } from "@/engine/reels";
import { buildActions, buildReminderPlan } from "@/engine/actions";
import type { CommandResultView, ParsedCommand } from "@/engine/types";
import type { CalendarEventType, Prisma } from "@prisma/client";

function asJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export async function runCommand(opts: {
  userId: string;
  command: string;
  persist?: boolean;
}) {
  const ctx = await loadEngineContext(opts.userId);
  const parsed: ParsedCommand = parseCommand(opts.command, ctx.lastParse, ctx.now);
  const decision = decideCommand(parsed, ctx);

  const message =
    parsed.wantsMessage || parsed.intents.includes("ADVICE") || parsed.intents.includes("SHOULD_APOLOGIZE") || decision.recommendedAction !== "NO_ACTION"
      ? composeMessage(parsed, ctx.profile, decision.messageKey)
      : decision.nothingNeeded
        ? null
        : composeMessage(parsed, ctx.profile, decision.messageKey);

  if (decision.nothingNeeded && decision.recommendedAction === "NO_ACTION") {
    /* keep optional space message */
  }

  const relationship = await db.relationship.findFirst({ where: { userId: opts.userId }, orderBy: { createdAt: "asc" } });

  let card: CommandResultView["card"] = null;
  if (decision.cardCategory) {
    const theme = pickTheme(decision.cardCategory, ctx.recentCards.map((c) => c.theme));
    const cardMessage = message ?? composeMessage(parsed, ctx.profile, decision.messageKey);
    card = { id: "preview", theme: theme.id, message: cardMessage, category: decision.cardCategory };
  }

  const picked = decision.reelCategory
    ? pickBestReel({
        category: decision.reelCategory,
        emotion: parsed.primaryEmotion,
        situation: parsed.primarySituation,
        reels: ctx.recentReels,
        likes: [...ctx.profile.likes, ...ctx.chat.likes],
        foods: [...ctx.profile.foods, ...ctx.chat.foods],
        topics: ctx.chat.topics,
        dislikes: [...ctx.profile.dislikes, ...ctx.chat.dislikes],
        calms: ctx.profile.calms,
        movies: ctx.profile.movies,
        songs: ctx.profile.songs,
        reelQueries: ctx.chat.reelQueries,
        partnerName: ctx.profile.partnerName,
      })
    : null;
  const reel = picked ? { ...picked, reason: decision.reelReason ?? picked.reason } : null;
  const reminderPlan = buildReminderPlan(parsed, ctx.profile);
  const draftedMessage = decision.recommendedAction === "GIVE_SPACE" ? composeMessage(parsed, ctx.profile, "space") : message;
  const share = buildSharePack({
    reelUrl: reel?.url,
    message: draftedMessage,
    reminder: reminderPlan?.herMessage,
    card: card?.message,
    imageUrls: [reel?.url].filter((value): value is string => Boolean(value)),
    instagram: ctx.profile.instagram,
    whatsapp: ctx.profile.whatsapp,
    facebook: ctx.profile.facebook,
    email: ctx.profile.email,
  });

  if (decision.quietUntil) {
    await db.userSettings.upsert({
      where: { userId: opts.userId },
      update: { quietUntil: new Date(decision.quietUntil) },
      create: { userId: opts.userId, quietUntil: new Date(decision.quietUntil) },
    });
  }

  if (message && parsed.wantsMessage) {
    /* drafts persist when the user applies actions */
  }

  const actions = buildActions({
    parsed,
    decision,
    hasMessage: Boolean(draftedMessage && decision.recommendedAction !== "GIVE_SPACE"),
    hasCard: Boolean(card),
    hasReel: Boolean(reel),
  });

  const view: CommandResultView = {
    situationDetected: decision.situationDetected,
    recommendedAction: decision.recommendedAction.replaceAll("_", " "),
    approach: decision.approach,
    avoid: decision.avoid,
    message: draftedMessage,
    messageCategory: decision.messageKey,
    reel,
    share,
    card,
    timing: decision.timing,
    plan: decision.plan,
    pendingEvent: decision.pendingEvent,
    reminderPlan,
    actions,
    historyNotes: decision.historyNotes,
    nothingNeeded: decision.nothingNeeded && !parsed.wantsMessage && !parsed.wantsCard,
    emotion: parsed.primaryEmotion,
    situation: parsed.primarySituation,
    relationshipState: decision.relationshipState,
    priority: decision.priority,
    quietUntil: decision.quietUntil,
  };

  let runId: string | null = null;
  if (opts.persist !== false) {
    try {
      const run = await db.commandRun.create({
        data: {
          userId: opts.userId,
          relationshipId: relationship?.id,
          command: opts.command.slice(0, 4000),
          parsed: asJson(parsed),
          result: asJson({
            recommendedAction: view.recommendedAction,
            emotion: view.emotion,
            situation: view.situation,
            avoid: view.avoid,
            timing: view.timing,
            reel: view.reel,
          }),
          emotion: parsed.primaryEmotion,
          situation: parsed.primarySituation,
          recommendation: decision.recommendedAction,
        },
      });
      runId = run.id;
    } catch {
      runId = null;
    }
  }

  return { id: runId, ...view };
}

export async function savePendingEvent(userId: string, event: { title: string; type: string; startAt: string; notes?: string }) {
  const relationship = await db.relationship.findFirst({ where: { userId }, orderBy: { createdAt: "asc" } });
  const startAt = new Date(event.startAt);
  const existing = await db.calendarEvent.findFirst({
    where: {
      userId,
      title: event.title,
      startAt: { gte: new Date(startAt.getTime() - 12 * 3600_000), lte: new Date(startAt.getTime() + 12 * 3600_000) },
    },
  });
  if (existing) return existing;
  const created = await db.calendarEvent.create({
    data: {
      userId,
      relationshipId: relationship?.id,
      title: event.title,
      type: (event.type as CalendarEventType) || "EVENT",
      startAt,
      notes: event.notes,
      timezone: "UTC",
      reminderDays: event.type === "EXAM" ? [1, 0, -1] : [7, 3, 1, 0],
    },
  });
  for (const daysBefore of created.reminderDays) {
    await db.eventReminder.create({ data: { eventId: created.id, daysBefore } });
  }
  return created;
}
