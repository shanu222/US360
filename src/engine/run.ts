import { db } from "@/lib/db";
import { pickTheme, renderCardHtml } from "@/ai/cards";
import { fingerprint } from "@/lib/crypto";
import { loadEngineContext } from "@/engine/context";
import { parseCommand } from "@/engine/parse";
import { decideCommand } from "@/engine/decide";
import { composeMessage } from "@/engine/templates";
import type { CommandResultView, ParsedCommand } from "@/engine/types";
import type { CardCategory, CalendarEventType, MessageCategory, Prisma } from "@prisma/client";

function asJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function pickReel(
  reels: { id: string; url: string; category: string; notes?: string | null }[],
  category: string | null,
  recentCardsThemes: string[],
) {
  if (!category) return null;
  const pool = reels.filter((r) => r.category === category);
  const fallback = reels.filter((r) => r.category !== "ROMANTIC");
  const chosen = (pool[0] ?? fallback[0] ?? reels[0]) ?? null;
  void recentCardsThemes;
  return chosen;
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
  if (decision.cardCategory && (parsed.wantsCard || parsed.intents.includes("PREPARE_EVERYTHING") || parsed.intents.includes("CHEER_UP"))) {
    const theme = pickTheme(decision.cardCategory, ctx.recentCards.map((c) => c.theme));
    const cardMessage = message ?? composeMessage(parsed, ctx.profile, decision.messageKey);
    const html = renderCardHtml({
      message: cardMessage,
      themeId: theme.id,
      partnerName: ctx.profile.partnerName,
      occasion: decision.cardCategory.replaceAll("_", " "),
    });
    const created = await db.card.create({
      data: {
        userId: opts.userId,
        relationshipId: relationship?.id,
        category: decision.cardCategory as CardCategory,
        theme: theme.id,
        message: cardMessage,
        html,
        status: "READY",
        fingerprint: fingerprint([opts.userId, "command-card", cardMessage, theme.id, Date.now().toString()]),
      },
    });
    card = { id: created.id, theme: created.theme, message: created.message, category: created.category };
  }

  const reelRow = pickReel(ctx.recentReels, decision.reelCategory, []);
  const reel =
    decision.reelCategory && reelRow
      ? { id: reelRow.id, url: reelRow.url, category: reelRow.category, reason: decision.reelReason ?? "From your Reel library." }
      : null;

  if (decision.quietUntil) {
    await db.userSettings.upsert({
      where: { userId: opts.userId },
      update: { quietUntil: new Date(decision.quietUntil) },
      create: { userId: opts.userId, quietUntil: new Date(decision.quietUntil) },
    });
  }

  if (message && parsed.wantsMessage) {
    await db.message.create({
      data: {
        userId: opts.userId,
        relationshipId: relationship?.id,
        category: (decision.recommendedAction === "APOLOGIZE"
          ? "APOLOGY"
          : decision.cardCategory === "GOOD_MORNING"
            ? "GOOD_MORNING"
            : "CUSTOM") as MessageCategory,
        content: message,
        source: "command-engine",
        tone: parsed.style,
        length: parsed.shorter ? "short" : ctx.profile.messageLength,
      },
    });
  }

  const view: CommandResultView = {
    situationDetected: decision.situationDetected,
    recommendedAction: decision.recommendedAction.replaceAll("_", " "),
    approach: decision.approach,
    avoid: decision.avoid,
    message: decision.recommendedAction === "GIVE_SPACE" ? composeMessage(parsed, ctx.profile, "space") : message,
    messageCategory: decision.messageKey,
    reel,
    card,
    timing: decision.timing,
    plan: decision.plan,
    pendingEvent: decision.pendingEvent,
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
