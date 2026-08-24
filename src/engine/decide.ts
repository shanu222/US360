import type { CommandDecision, EngineContext, ParsedCommand, PreparePlan } from "@/engine/types";
import { DECISION_RULES } from "@/engine/knowledge/rules";

function ruleMatches(rule: (typeof DECISION_RULES)[number], parsed: ParsedCommand, ctx: EngineContext) {
  const w = rule.when;
  if (w.wantsSpace && !parsed.wantsSpace) return false;
  if (w.userFault && !parsed.userFault) return false;
  if (w.emotions?.length && !w.emotions.includes(parsed.primaryEmotion) && !parsed.emotions.some((e) => w.emotions!.includes(e.key))) {
    return false;
  }
  if (w.situations?.length && !w.situations.includes(parsed.primarySituation) && !parsed.situations.some((s) => w.situations!.includes(s.key))) {
    return false;
  }
  if (w.importantEvent) {
    const soon = ctx.upcoming.some((e) => ["BIRTHDAY", "ANNIVERSARY", "EXAM"].includes(e.type));
    if (!soon && !["EXAM", "BIRTHDAY", "ANNIVERSARY"].includes(parsed.primarySituation)) return false;
  }
  return true;
}

function historyNote(ctx: EngineContext, parsed: ParsedCommand) {
  const notes: string[] = [];
  const similar = ctx.history.filter(
    (h) => h.emotion === parsed.primaryEmotion || h.situation === parsed.primarySituation,
  );
  const best = similar.sort((a, b) => b.helpfulCount - a.helpfulCount)[0];
  if (best && best.helpfulCount > best.unhelpfulCount) {
    notes.push(`Similar moments before: ${best.recommendation.replaceAll("_", " ").toLowerCase()} was marked helpful ${best.helpfulCount} time(s).`);
  }
  const angerCount = ctx.recentSituations.filter((s) => /angry|upset|argument|fight/i.test(s.description)).length;
  if (angerCount >= 2 && parsed.primaryEmotion === "ANGER") {
    notes.push("This kind of tension has shown up more than once in what you recorded.");
  }
  if (ctx.profile.wantsSpace && parsed.primaryEmotion === "ANGER") {
    notes.push("Her profile says she prefers space after conflict.");
  }
  if (ctx.profile.messageLength === "short" && parsed.primaryEmotion === "ANGER") {
    notes.push("She prefers short messages during conflict.");
  }
  if (ctx.chat.conflictSignals > 4 && parsed.wantsHistory) {
    notes.push("Imported chat had several tense lines. Repair that stayed short tended to fit the pattern.");
  }
  const lastConflict = ctx.recentSituations.find((s) => /angry|upset|argument/i.test(s.description));
  if (lastConflict) notes.push(`Recent record: “${lastConflict.description.slice(0, 90)}”.`);
  return notes;
}

function buildPlan(parsed: ParsedCommand, ctx: EngineContext): PreparePlan | null {
  if (!parsed.intents.includes("PREPARE_EVERYTHING") && parsed.primarySituation !== "BIRTHDAY") return null;
  const event = parsed.eventHint ?? {
    title: ctx.upcoming.find((e) => e.type === "BIRTHDAY")?.title ?? "Birthday",
    type: "BIRTHDAY",
    startAt: ctx.upcoming.find((e) => e.type === "BIRTHDAY")?.startAt.toISOString() ?? new Date().toISOString(),
  };
  const gift =
    ctx.profile.gifts ||
    ctx.profile.flowers ||
    ctx.profile.foods[0] ||
    ctx.profile.likes[0] ||
    "Something small and specific to a favorite she already named";
  const activity = ctx.profile.places[0] || ctx.profile.activities[0] || "A quiet plan she already enjoys";
  return {
    date: { title: event.title, when: event.startAt, type: event.type },
    gift: `Consider ${gift} — only if it still fits who she is now.`,
    message: "A personal note that names her, not a generic caption.",
    cardCategory: event.type === "ANNIVERSARY" ? "ANNIVERSARY" : "BIRTHDAY",
    reelCategory: "CELEBRATION",
    reminders: ["7 days before", "3 days before", "The day before", "Morning of"],
    activity: `Optional: ${activity}.`,
  };
}

export function decideCommand(parsed: ParsedCommand, ctx: EngineContext): CommandDecision {
  if (ctx.quietUntil && ctx.quietUntil > ctx.now && !parsed.intents.includes("MODIFY_TONE")) {
    return {
      situationDetected: "A quiet window is already in place from a previous command.",
      approach: "Nothing needs to be sent right now.",
      recommendedAction: "NO_ACTION",
      relationshipState: "QUIET",
      priority: "CRITICAL",
      avoid: ["New reminders", "A stacked Reel or card"],
      timing: `Wait until ${ctx.quietUntil.toLocaleString()}.`,
      messageKey: "space",
      cardCategory: null,
      reelCategory: null,
      reelReason: null,
      nothingNeeded: true,
      historyNotes: historyNote(ctx, parsed),
      pendingEvent: null,
      plan: null,
      quietUntil: ctx.quietUntil.toISOString(),
    };
  }

  const match =
    DECISION_RULES.find((r) => r.id === "space-first" && parsed.wantsSpace) ||
    DECISION_RULES.find((r) => r.id === "anger-fault" && (parsed.userFault || parsed.primarySituation === "MISSED_CALL" || parsed.primarySituation === "FORGOT_BIRTHDAY") && ["ANGER", "HURT", "CONFLICT", "DISAPPOINTMENT"].includes(parsed.primaryEmotion)) ||
    DECISION_RULES.find((rule) => ruleMatches(rule, parsed, ctx)) ||
    DECISION_RULES.find((r) => r.id === "anger-unclear" && ["ANGER", "CONFLICT"].includes(parsed.primaryEmotion));

  const then = match?.then ?? {
    action: "CHECK_IN" as const,
    state: "NORMAL" as const,
    priority: parsed.urgency,
    avoid: ["Doing too much at once"],
    approach: "A small, specific note is enough. You do not need a production.",
    timing: "Whenever it feels natural. Nothing is required.",
    messageKey: parsed.wantsRomantic ? "morning" : "checkin",
    card: parsed.wantsCard ? "THINKING_OF_YOU" : null,
    reel: parsed.wantsReel ? "CUTE" : null,
  };

  const birthdaySoon = ctx.upcoming.some((e) => e.type === "BIRTHDAY") || parsed.primarySituation === "BIRTHDAY";
  const historyNotes = historyNote(ctx, parsed);
  if (birthdaySoon && then.priority === "CRITICAL") {
    historyNotes.unshift("Her birthday is also in view — keep it in mind, but do not let it override the current hurt.");
  }

  let reel = parsed.wantsReel ? then.reel ?? (parsed.wantsFunny ? "FUNNY" : "CUTE") : then.reel;
  if (parsed.noFunny && reel === "FUNNY") reel = null;
  if (then.priority === "CRITICAL") reel = null;
  if (parsed.wantsFunny && then.priority !== "CRITICAL" && !parsed.noFunny) reel = "FUNNY";
  if (then.priority === "CRITICAL" && !parsed.wantsCard) {
    /* apology card is optional */
  }

  let card = parsed.wantsCard || then.action === "ENCOURAGE" || then.action === "CELEBRATE" ? then.card : parsed.wantsCard ? then.card : then.card;
  if (parsed.wantsCard && !card) card = parsed.primarySituation === "EXAM" ? "MOTIVATION" : then.action === "APOLOGIZE" ? "SORRY" : "THINKING_OF_YOU";
  if (then.priority === "CRITICAL" && !parsed.wantsCard && then.action === "APOLOGIZE") card = "SORRY";
  if (parsed.noRomantic && (card === "ROMANTIC" || card === "MISS_YOU")) card = "APPRECIATION";

  const quietUntil =
    parsed.quietHours != null ? new Date(ctx.now.getTime() + parsed.quietHours * 60 * 60 * 1000).toISOString() : parsed.wantsSpace ? new Date(ctx.now.getTime() + 3 * 60 * 60 * 1000).toISOString() : null;

  const pendingEvent = parsed.eventHint
    ? {
        title: parsed.eventHint.title,
        type: parsed.eventHint.type,
        startAt: parsed.eventHint.startAt,
        notes: `From command: “${parsed.raw.slice(0, 140)}”`,
      }
    : null;

  const similarHelpful = ctx.history.find(
    (h) => (h.emotion === parsed.primaryEmotion || h.situation === parsed.primarySituation) && h.helpfulCount > 0,
  );
  let action = then.action;
  if (similarHelpful?.recommendation === "GIVE_SPACE" && parsed.primaryEmotion === "ANGER") {
    action = "GIVE_SPACE";
    historyNotes.push("Previous helpful mark: short apology + space.");
  }

  const situationDetected =
    parsed.primarySituation === "MISSED_CALL"
      ? "She may be upset because an expected call did not happen."
      : parsed.primaryEmotion === "ANGER"
        ? "Possible anger or hurt. Treat this as conflict, not a moment for performance."
        : parsed.primarySituation === "EXAM"
          ? "An exam or high-stakes day is close. Support without crowding."
          : parsed.primarySituation === "NEEDS_SPACE"
            ? "She may need space more than content."
            : parsed.raw
              ? `Heard: ${parsed.raw.slice(0, 160)}`
              : "A quiet, ordinary request.";

  return {
    situationDetected,
    approach: then.approach,
    recommendedAction: action,
    relationshipState: then.state,
    priority: then.priority,
    avoid: then.avoid,
    timing: then.timing,
    messageKey: parsed.shorter || ctx.profile.messageLength === "short" ? then.messageKey : then.messageKey,
    cardCategory: card ?? null,
    reelCategory: reel ?? null,
    reelReason: reel
      ? reel === "FUNNY"
        ? "She likes humorous content and this type of Reel has not been blocked by the current situation."
        : `A ${reel.toLowerCase()} Reel fits the current state better than silence-breaking jokes.`
      : then.priority === "CRITICAL"
        ? "No Reel recommended right now."
        : null,
    nothingNeeded: action === "NO_ACTION" || action === "WAIT" || action === "GIVE_SPACE",
    historyNotes,
    pendingEvent: parsed.intents.includes("SAVE_EVENT") || parsed.intents.includes("PREPARE_EVERYTHING") ? pendingEvent : pendingEvent,
    plan: buildPlan(parsed, ctx),
    quietUntil,
  };
}
