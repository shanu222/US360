import { describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";
import { contextToPrompt, type AIContext } from "@/ai/context-types";

describe("authentication hashing", () => {
  it("hashes passwords with bcrypt", async () => {
    const hash = await bcrypt.hash("secret-pass-123", 10);
    expect(hash).not.toBe("secret-pass-123");
    expect(await bcrypt.compare("secret-pass-123", hash)).toBe(true);
    expect(await bcrypt.compare("wrong", hash)).toBe(false);
  });
});

describe("AI context minimization", () => {
  it("does not dump unlimited personal data into the prompt", () => {
    const prompt = contextToPrompt({
      now: "2026-01-01T00:00:00.000Z",
      timezone: "UTC",
      userName: "Alex",
      partnerName: "Maya",
      memories: [{ title: "Roses", content: "She loves roses", category: "FAVORITES" }],
      favorites: [{ category: "flowers", value: "roses" }],
      dislikes: [],
      upcomingDates: [],
      recentSituations: [{ description: "short", status: "OPEN" }],
      recentCards: [],
      recentMessages: [],
      recentReels: [],
      season: "winter",
    } as AIContext);
    expect(prompt.length).toBeLessThan(4000);
    expect(prompt).toContain("Maya");
  });
});
