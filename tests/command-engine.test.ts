import { describe, expect, it } from "vitest";
import { parseCommand } from "@/engine/parse";
import { decideCommand } from "@/engine/decide";
import { composeMessage, fillTemplate } from "@/engine/templates";
import type { EngineContext } from "@/engine/types";

function ctx(over: Partial<EngineContext> = {}): EngineContext {
  return {
    now: new Date(),
    quietUntil: null,
    profile: {
      partnerName: "Asma",
      likes: ["chai"],
      dislikes: ["smoking"],
      foods: ["biryani"],
      activities: [],
      places: ["campus"],
      memories: [],
      promises: [],
      messageLength: "short",
      wantsSpace: true,
    },
    upcoming: [],
    recentSituations: [
      { description: "Argument about missed call", status: "OPEN", createdAt: new Date() },
    ],
    recentCards: [],
    recentReels: [{ id: "r1", url: "https://instagram.com/reel/x", category: "FUNNY", createdAt: new Date() }],
    recentMessages: [],
    history: [
      { emotion: "ANGER", situation: "MISSED_CALL", recommendation: "APOLOGIZE", helpfulCount: 3, unhelpfulCount: 0, note: "" },
    ],
    lastParse: null,
    chat: { likes: ["chai"], dislikes: [], topics: ["class"], style: ["Short messages"], timeline: [], conflictSignals: 5, avgPartnerLength: 40 },
    ...over,
  };
}

describe("command parser", () => {
  it("detects anger, missed call, user fault, and requested outputs", () => {
    const parsed = parseCommand("She is angry because I forgot to call her. Suggest a message and find an appropriate Reel.");
    expect(parsed.primaryEmotion).toBe("ANGER");
    expect(parsed.primarySituation).toBe("MISSED_CALL");
    expect(parsed.userFault).toBe(true);
    expect(parsed.wantsMessage).toBe(true);
    expect(parsed.wantsReel).toBe(true);
    expect(parsed.noFunny).toBe(true);
  });

  it("detects exam tomorrow and a card request", () => {
    const parsed = parseCommand("She has an exam tomorrow. Make something nice for her.");
    expect(parsed.primarySituation).toBe("EXAM");
    expect(parsed.eventHint?.type).toBe("EXAM");
    expect(parsed.wantsCard).toBe(true);
  });

  it("honors space and a quiet window", () => {
    const parsed = parseCommand("She needs space. Don't remind me to message her for 3 hours.");
    expect(parsed.wantsSpace).toBe(true);
    expect(parsed.quietHours).toBe(3);
  });
});

describe("decision engine", () => {
  it("recommends apology and blocks funny reels during anger with fault", () => {
    const parsed = parseCommand("She is angry because I forgot to call her. Suggest a message and find an appropriate Reel.");
    const decision = decideCommand(parsed, ctx());
    expect(decision.recommendedAction).toBe("APOLOGIZE");
    expect(decision.reelCategory).toBeNull();
    expect(decision.avoid.some((a) => /joke|funny/i.test(a))).toBe(true);
  });

  it("gives space when asked", () => {
    const parsed = parseCommand("She needs space.");
    const decision = decideCommand(parsed, ctx());
    expect(decision.recommendedAction).toBe("GIVE_SPACE");
    expect(decision.nothingNeeded).toBe(true);
  });

  it("prepares encouragement for an exam", () => {
    const parsed = parseCommand("She has an exam tomorrow. Create a card.");
    const decision = decideCommand(parsed, ctx());
    expect(decision.recommendedAction).toBe("ENCOURAGE");
    expect(decision.cardCategory).toBe("MOTIVATION");
    expect(decision.pendingEvent?.type).toBe("EXAM");
  });
});

describe("templates", () => {
  it("fills variables without an LLM", () => {
    const out = fillTemplate("I'm sorry about {APOLOGY_REASON}.", { APOLOGY_REASON: "the missed call" });
    expect(out).toContain("the missed call");
    const msg = composeMessage(parseCommand("She is angry because I forgot to call her."), ctx().profile, "apology");
    expect(msg.toLowerCase()).toMatch(/sorry/);
  });
});
