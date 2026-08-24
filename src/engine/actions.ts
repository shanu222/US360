import type { CommandDecision, EngineProfile, ParsedCommand, PreparedAction, ReminderPlan } from "@/engine/types";

function atHour(base: Date, hour: number) {
  const d = new Date(base);
  d.setHours(hour, 0, 0, 0);
  return d;
}

export function buildReminderPlan(parsed: ParsedCommand, profile: EngineProfile): ReminderPlan | null {
  if (!parsed.eventHint) return null;
  const start = new Date(parsed.eventHint.startAt);
  const userAt = atHour(new Date(start.getTime() - 24 * 60 * 60 * 1000), 20);
  const herAt = atHour(start, 7);
  const title = parsed.eventHint.title;
  const exam = parsed.eventHint.type === "EXAM" || /exam|presentation/i.test(title);
  return {
    eventTitle: title,
    eventType: parsed.eventHint.type,
    startAt: start.toISOString(),
    forName: profile.partnerName.split(" ")[0] || "her",
    userReminderAt: userAt.toISOString(),
    herReminderAt: herAt.toISOString(),
    userMessage: exam
      ? `${profile.partnerName.split(" ")[0] || "Her"} ${title.toLowerCase()} is coming up. Remember to wish her good luck.`
      : `Remember ${title} for ${profile.partnerName.split(" ")[0] || "her"}.`,
    herMessage: exam
      ? `Good luck with your exam today. You've got this ❤️`
      : `Thinking of you for ${title.toLowerCase()} today ❤️`,
  };
}

export function buildActions(opts: {
  parsed: ParsedCommand;
  decision: CommandDecision;
  hasMessage: boolean;
  hasCard: boolean;
  hasReel: boolean;
  hasLifestyle?: boolean;
}): PreparedAction[] {
  const { parsed, decision } = opts;
  const actions: PreparedAction[] = [];
  const space = decision.recommendedAction === "GIVE_SPACE" || decision.recommendedAction === "NO_ACTION" || decision.recommendedAction === "WAIT";

  if (space) {
    actions.push({
      id: "space",
      kind: "space",
      title: "Give her some space",
      detail: decision.timing,
      required: true,
      selected: true,
    });
  }

  if (decision.pendingEvent) {
    actions.push({
      id: "calendar",
      kind: "calendar",
      title: `Add ${decision.pendingEvent.title} to calendar`,
      detail: new Date(decision.pendingEvent.startAt).toLocaleString(),
      required: true,
      selected: !space,
    });
    actions.push({
      id: "reminder_user",
      kind: "reminder_user",
      title: "Remind you",
      detail: "Evening before / on the day, so you remember to reach out.",
      required: true,
      selected: !space,
    });
    actions.push({
      id: "reminder_her",
      kind: "reminder_her",
      title: "Prepare a reminder for her",
      detail: "Morning of, through a channel you approve — never sent until you confirm.",
      required: false,
      selected: !space && (parsed.primarySituation === "EXAM" || parsed.eventHint?.type === "EXAM"),
    });
  }

  if (opts.hasMessage && !space) {
    actions.push({
      id: "message",
      kind: "message",
      title: decision.recommendedAction === "APOLOGIZE" ? "Prepare apology message" : "Prepare supportive message",
      detail: "You still approve before anything leaves the app.",
      required: true,
      selected: true,
    });
  }

  if (opts.hasCard && !space) {
    actions.push({
      id: "card",
      kind: "card",
      title: "Prepare a card",
      detail: "Optional visual — only if it still fits the moment.",
      required: false,
      selected: Boolean(parsed.wantsCard || parsed.intents.includes("PREPARE_EVERYTHING") || parsed.primarySituation === "EXAM"),
    });
  }

  if (opts.hasReel && !space) {
    actions.push({
      id: "reel",
      kind: "reel",
      title: parsed.wantsReel ? "Find a situational Reel" : "Optional Reel",
      detail: decision.reelReason ?? "Only if a Reel is still appropriate.",
      required: false,
      selected: parsed.wantsReel && decision.priority !== "CRITICAL",
    });
  }

  if (opts.hasLifestyle) {
    actions.push({
      id: "save_venue",
      kind: "save_venue",
      title: "Save the top restaurant / place",
      detail: "Keeps it in food memory so later suggestions know what you liked.",
      required: false,
      selected: true,
    });
    actions.push({
      id: "add_plan",
      kind: "add_plan",
      title: "Add this outing to the plan",
      detail: "Stores a city plan you can open later. Optionally also add a calendar reminder.",
      required: false,
      selected: Boolean(opts.parsed.lifestyle?.intents.includes("PLAN_DAY") || opts.parsed.lifestyle?.intents.includes("PLAN_WEEKEND") || opts.parsed.lifestyle?.intents.includes("DATE_NIGHT")),
    });
  }

  return actions;
}
