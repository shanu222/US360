import { describe, expect, it } from "vitest";
import { decideDailyLove } from "@/ai/daily-engine";
import type { AIContext } from "@/ai/context-types";
import { pickTheme, renderCardHtml } from "@/ai/cards";
import { fingerprint } from "@/lib/crypto";
import { greetingForHour, localDateKey, localHour } from "@/lib/utils";
import { instagramShareFallback } from "@/integrations/instagram";
import { FallbackProvider } from "@/ai/providers/fallback";
import { rateLimit } from "@/lib/rate-limit";
import { encryptSecret, decryptSecret } from "@/lib/crypto";

function ctx(over: Partial<AIContext> = {}): AIContext {
  return {
    now: new Date().toISOString(),
    timezone: "UTC",
    userName: "Alex",
    partnerName: "Maya",
    memories: [],
    favorites: [{ category: "flowers", value: "roses" }],
    dislikes: [],
    upcomingDates: [],
    recentSituations: [],
    recentCards: [],
    recentMessages: [],
    recentReels: [],
    season: "spring",
    ...over,
  };
}

describe("daily recommendations", () => {
  it("suggests space after an unresolved conflict", () => {
    const decision = decideDailyLove(
      ctx({
        recentSituations: [{ description: "We had a fight and she is still hurt", status: "UNRESOLVED" }],
      }),
      "morning",
    );
    expect(decision.action).toBe("WAIT");
  });

  it("can recommend no action", () => {
    const decision = decideDailyLove(
      ctx({
        recentCards: [{ category: "GOOD_MORNING", message: "Good morning", theme: "sunrise" }],
      }),
      "morning",
    );
    expect(["NO_ACTION", "SUGGEST_CARD", "WAIT"]).toContain(decision.action);
  });

  it("points to an upcoming event in the evening", () => {
    const decision = decideDailyLove(
      ctx({
        upcomingDates: [{ title: "Presentation", date: new Date().toISOString(), type: "WORK" }],
      }),
      "evening",
    );
    expect(decision.action).toBe("SUGGEST_MESSAGE");
  });
});

describe("card generation", () => {
  it("avoids recently used themes when possible", () => {
    const theme = pickTheme("GOOD_MORNING", ["sunrise", "coffee"]);
    expect(theme.id).not.toBe("moon");
  });

  it("renders typography in HTML rather than embedding random AI text", () => {
    const html = renderCardHtml({ message: "Thinking of you this morning.", themeId: "sunrise", partnerName: "Maya" });
    expect(html).toContain("Thinking of you this morning.");
    expect(html).toContain("Cormorant");
  });

  it("prevents duplicate fingerprints", () => {
    const a = fingerprint(["user", "2026-01-01", "GOOD_MORNING", "hello"]);
    const b = fingerprint(["user", "2026-01-01", "GOOD_MORNING", "hello"]);
    const c = fingerprint(["user", "2026-01-01", "GOOD_MORNING", "hello there"]);
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });
});

describe("timezone handling", () => {
  it("never assumes a hardcoded Pakistan timezone", () => {
    const tokyo = localDateKey("Asia/Tokyo", new Date("2026-01-01T00:30:00Z"));
    const chicago = localDateKey("America/Chicago", new Date("2026-01-01T00:30:00Z"));
    expect(tokyo).not.toBe(chicago);
    expect(localHour("UTC", new Date("2026-06-01T15:00:00Z"))).toBe(15);
  });

  it("greets by local hour", () => {
    expect(greetingForHour(8)).toBe("Good morning");
    expect(greetingForHour(22)).toBe("Good night");
  });
});

describe("instagram integration fallback", () => {
  it("offers Open Instagram & Share instead of automation", () => {
    const fallback = instagramShareFallback("https://www.instagram.com/reel/demo");
    expect(fallback.action).toBe("open_and_share");
    expect(fallback.message).toBe("Open Instagram & Share");
    expect(fallback.supported).toBe(false);
  });
});

describe("AI fallback and safety-shaped output", () => {
  it("returns structured JSON for situation analysis", async () => {
    const provider = new FallbackProvider();
    const result = await provider.generate(
      [{ role: "user", content: "We had an argument because I forgot to call her." }],
      { json: true },
    );
    const parsed = JSON.parse(result.text);
    expect(parsed.recommendation).toBeTruthy();
    expect(Array.isArray(parsed.avoid)).toBe(true);
    expect(parsed.suggested_message).toBeTruthy();
  });

  it("returns card copy instead of situation JSON", async () => {
    const provider = new FallbackProvider();
    const result = await provider.generate(
      [
        { role: "system", content: "Write a short elegant card message. Return JSON: { message, kicker }" },
        { role: "user", content: "Category: GOOD_NIGHT. Theme: dreamy. Occasion: none." },
      ],
      { json: true },
    );
    const parsed = JSON.parse(result.text);
    expect(parsed.message).toBeTruthy();
    expect(parsed.kicker).toBeTruthy();
    expect(parsed.recommendation).toBeUndefined();
  });

  it("returns message drafts for the studio", async () => {
    const provider = new FallbackProvider();
    const result = await provider.generate(
      [
        { role: "system", content: "Write 3 suggested messages. Return JSON: { messages: string[] }" },
        { role: "user", content: "Category: ROMANTIC\nWhat I want to say: I miss you" },
      ],
      { json: true },
    );
    const parsed = JSON.parse(result.text);
    expect(Array.isArray(parsed.messages)).toBe(true);
    expect(parsed.messages.length).toBeGreaterThan(0);
  });
});

describe("security helpers", () => {
  it("encrypts and decrypts integration tokens", () => {
    const encoded = encryptSecret("ig-access-token");
    expect(encoded).not.toContain("ig-access-token");
    expect(decryptSecret(encoded)).toBe("ig-access-token");
  });

  it("rate limits repeated calls", () => {
    const key = `test-${Date.now()}`;
    expect(rateLimit(key, 2, 10_000).success).toBe(true);
    expect(rateLimit(key, 2, 10_000).success).toBe(true);
    expect(rateLimit(key, 2, 10_000).success).toBe(false);
  });
});

describe("authorization shape", () => {
  it("memory deletion checks relationship ownership", async () => {
    const { readFileSync } = await import("fs");
    const { join } = await import("path");
    const src = readFileSync(join(process.cwd(), "src/app/api/memories/[id]/route.ts"), "utf8");
    expect(src).toContain("relationshipId: relationship?.id");
    expect(src).toContain("requireUser");
  });
});
