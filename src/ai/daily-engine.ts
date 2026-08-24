import type { DailyAction } from "@/types";
import type { AIContext } from "@/ai/context-types";

export interface DailyDecision {
  action: DailyAction;
  slot: string;
  title: string;
  body: string;
  payload?: Record<string, unknown>;
}

const CONFLICT_MARKERS = ["argument", "fight", "angry", "ignored", "broke up", "hurt"];

function daysBetween(a: Date, b: Date) {
  return Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24);
}

export function decideDailyLove(ctx: AIContext, slot: "morning" | "afternoon" | "evening" | "night"): DailyDecision {
  const recentConflict = ctx.recentSituations.find((s) =>
    CONFLICT_MARKERS.some((w) => s.description.toLowerCase().includes(w)) && s.status !== "RESOLVED",
  );

  const upcomingSoon = ctx.upcomingDates[0];
  const recentCardSameSlot = ctx.recentCards.find((c) => {
    if (slot === "morning") return c.category === "GOOD_MORNING";
    if (slot === "night") return c.category === "GOOD_NIGHT";
    return false;
  });

  if (recentConflict && slot !== "night") {
    return {
      action: "WAIT",
      slot,
      title: "Give the moment some space",
      body: "Based on what you recorded, a grand romantic gesture may feel out of step right now. A calm, sincere check-in is enough — or nothing, if she asked for space.",
    };
  }

  if (upcomingSoon && slot === "evening") {
    return {
      action: "SUGGEST_MESSAGE",
      slot,
      title: "Today's suggestion",
      body: `There's an upcoming moment: ${upcomingSoon.title}. Consider a short encouraging message tonight — only if it feels natural.`,
      payload: { event: upcomingSoon.title },
    };
  }

  if (slot === "morning") {
    if (recentCardSameSlot && daysBetween(new Date(), new Date(ctx.now)) < 0.6) {
      return {
        action: "NO_ACTION",
        slot,
        title: "Nothing needed right now",
        body: "You already showed care today. Repeating a morning card would likely feel automatic rather than thoughtful.",
      };
    }
    return {
      action: "SUGGEST_CARD",
      slot,
      title: "Morning card is ready to review",
      body: "A quiet good-morning card is prepared. Preview it, edit the words, and share only if it feels right.",
      payload: { category: "GOOD_MORNING" },
    };
  }

  if (slot === "night") {
    return {
      action: "SUGGEST_CARD",
      slot,
      title: "Good night card",
      body: "A calm good-night note is ready. Share it if the day still has room for warmth — skip it if tonight should stay quiet.",
      payload: { category: "GOOD_NIGHT" },
    };
  }

  if (slot === "afternoon") {
    return {
      action: "SUGGEST_GESTURE",
      slot,
      title: "A small thoughtful gesture",
      body: ctx.favorites[0]
        ? `A small gesture around ${ctx.favorites[0].value} could land well — only if the day has space for it.`
        : "A brief, specific appreciation is often enough. You do not need to do more.",
    };
  }

  const funnyReel = ctx.recentReels.find((r) => r.category === "FUNNY" || r.category === "CUTE");
  if (funnyReel) {
    return {
      action: "SUGGEST_REEL",
      slot,
      title: "A lighthearted Reel may fit",
      body: "Based on your current situation, a light, saved Reel may be more appropriate than a heavy message.",
    };
  }

  return {
    action: "ASK_USER",
    slot,
    title: "Would you like to send today's thoughtful message?",
    body: "Nothing is required. If you have a spare moment, a short note can still be a kind way to close the day.",
  };
}
