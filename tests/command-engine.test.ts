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
    chat: { likes: ["chai"], dislikes: [], topics: ["class"], style: ["Short messages"], timeline: [], conflictSignals: 5, avgPartnerLength: 40, reelQueries: ["chai reel"], foods: ["biryani"], activities: [] },
    city: "Islamabad",
    food: {
      user: { cuisines: [], dishes: [], restaurants: [], drinks: [], desserts: [], dislikes: [], allergies: [] },
      partner: { cuisines: ["pakistani"], dishes: ["biryani", "burger"], restaurants: [], drinks: ["chai"], desserts: ["brownie"], dislikes: [], allergies: [] },
    },
    savedVenues: [],
    venueVisits: [],
    pendingLifestyle: [],
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
    const parsed = parseCommand("She is angry because I forgot to call her.");
    const decision = decideCommand(parsed, ctx());
    expect(decision.recommendedAction).toBe("APOLOGIZE");
    expect(decision.reelCategory).toBeNull();
    expect(decision.avoid.some((a) => /joke|funny/i.test(a))).toBe(true);
  });

  it("offers a calming reel when asked to search reels while she is angry", () => {
    const parsed = parseCommand("She is angry. Search reels to calm her.");
    expect(parsed.wantsReel).toBe(true);
    const decision = decideCommand(parsed, ctx());
    expect(decision.reelCategory).toBe("CUTE");
    expect(decision.reelCategory).not.toBe("FUNNY");
  });

  it("does not auto-request a reel for a sad mood", () => {
    const parsed = parseCommand("She is sad.");
    expect(parsed.wantsReel).toBe(false);
    const decision = decideCommand(parsed, ctx());
    expect(decision.recommendedAction).toBe("SUPPORT");
    expect(decision.reelCategory).toBeNull();
  });

  it("recommends space when she is angry and her profile prefers space", () => {
    const parsed = parseCommand("She is angry.");
    const decision = decideCommand(parsed, ctx());
    expect(decision.recommendedAction).toBe("GIVE_SPACE");
    expect(decision.reelCategory).toBeNull();
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

  it("detects a meeting on a weekday", () => {
    const parsed = parseCommand("She has an important meeting next Thursday.");
    expect(parsed.eventHint?.title).toMatch(/Meeting|Presentation/i);
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

describe("reel picker and share links", () => {
  it("prefers a cute saved reel that matches chat likes over a funny one when she is angry", async () => {
    const { pickBestReel } = await import("@/engine/reels");
    const picked = pickBestReel({
      category: "CUTE",
      emotion: "ANGER",
      situation: "UNKNOWN",
      reels: [
        { id: "funny", url: "https://instagram.com/reel/funny", category: "FUNNY", notes: "joke" },
        { id: "cute", url: "https://instagram.com/reel/cute", category: "CUTE", notes: "chai comfort", favorite: true },
      ],
      likes: ["chai"],
      foods: ["biryani"],
      topics: ["class"],
      dislikes: ["smoking"],
      partnerName: "Asma",
    });
    expect(picked?.id).toBe("cute");
    expect(picked?.fromLibrary).toBe(true);
  });

  it("builds WhatsApp, Instagram, and Facebook send links from her profile", async () => {
    const { buildSharePack } = await import("@/engine/reels");
    const pack = buildSharePack({
      reelUrl: "https://instagram.com/reel/abc",
      caption: "Thought of you.",
      reminder: "Good luck with your exam today.",
      card: "Proud of you.",
      instagram: "@asma",
      whatsapp: "+92 300 1234567",
      facebook: "asma.tariq",
    });
    expect(pack.whatsapp).toContain("https://wa.me/923001234567");
    expect(pack.whatsapp).toContain(encodeURIComponent("Good luck with your exam today."));
    expect(pack.whatsapp).toContain(encodeURIComponent("https://instagram.com/reel/abc"));
    expect(pack.whatsapp).toContain(encodeURIComponent("Proud of you."));
    expect(pack.instagramDm).toBe("https://ig.me/m/asma");
    expect(pack.facebook).toContain("asma.tariq");
    expect(pack.missingInstagram).toBe(false);
    expect(pack.missingWhatsapp).toBe(false);
  });

  it("opens WhatsApp with reminder, Reel, and card text packed in", async () => {
    const { composeWhatsAppText, whatsappClickUrl } = await import("@/lib/whatsapp-open");
    const text = composeWhatsAppText({
      reminder: "Good luck with your exam today.",
      reelUrl: "https://instagram.com/reel/abc",
      card: "Proud of you.",
      imageUrls: ["https://example.com/photo.jpg"],
    });
    expect(text).toContain("Good luck with your exam today.");
    expect(text).toContain("https://instagram.com/reel/abc");
    expect(text).toContain("Proud of you.");
    expect(text).toContain("https://example.com/photo.jpg");
    expect(whatsappClickUrl("923001234567", text)).toContain("https://wa.me/923001234567?text=");
  });
});
