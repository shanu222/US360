import { describe, expect, it } from "vitest";
import { parseCommand } from "@/engine/parse";
import { parseLifestyleHints } from "@/lifestyle/parse";
import { catalogForCity } from "@/lifestyle/catalog";
import { scoreVenues } from "@/lifestyle/score";
import { extractLifestyleMentions } from "@/lifestyle/extract";
import { cityFromText } from "@/lifestyle/cities";

const emptyPrefs = {
  cuisines: [] as string[],
  dishes: [] as string[],
  restaurants: [] as string[],
  drinks: [] as string[],
  desserts: [] as string[],
  dislikes: [] as string[],
  allergies: [] as string[],
};

describe("lifestyle commands", () => {
  it("detects food, place, and date-night intents without treating anger as food", () => {
    const food = parseCommand("What should we eat tonight?");
    expect(food.intents).toContain("FIND_FOOD");
    expect(food.lifestyle?.mealSlot).toBe("dinner");
    expect(food.primaryEmotion).not.toBe("ANGER");

    const anger = parseCommand("She is angry because I forgot to call her.");
    expect(anger.primaryEmotion).toBe("ANGER");
    expect(anger.intents).not.toContain("FIND_FOOD");

    const visit = parseLifestyleHints("What should we visit in Lahore?");
    expect(visit.intents).toContain("FIND_PLACE");
    expect(visit.cityHint).toBe("Lahore");
  });

  it("keeps exam support when they also want to go out", () => {
    const parsed = parseCommand("She has an exam tomorrow and we want to go out tonight. What should we do?");
    expect(parsed.primarySituation).toBe("EXAM");
    expect(parsed.intents).toContain("SAVE_EVENT");
    expect(parsed.intents.some((i) => i === "PLAN_DAY" || i === "FIND_FOOD" || i === "FIND_PLACE")).toBe(true);
  });

  it("reads a city from free text", () => {
    expect(cityFromText("Find a burger in Islamabad")).toBe("Islamabad");
  });

  it("maps F-10 and being with her now to Islamabad food", () => {
    const parsed = parseLifestyleHints("I am with her right now in F-10. What should we eat?");
    expect(parsed.intents).toContain("FIND_FOOD");
    expect(parsed.cityHint).toBe("Islamabad");
    expect(parsed.areaHint).toBe("F-10");
    expect(parsed.mealSlot).toBe("now");

    const restaurant = parseCommand("What restaurant would she like?");
    expect(restaurant.intents).toContain("FIND_FOOD");

    const morning = parseLifestyleHints("What should we eat this morning?");
    expect(morning.intents).toContain("FIND_FOOD");
    expect(morning.mealSlot).toBe("breakfast");
  });

  it("scores F-10 venues higher when the area is named", () => {
    const venues = catalogForCity("Islamabad", "restaurant").map((v) => ({
      ...v,
      key: v.name,
      provider: "catalog",
      source: "catalog" as const,
      freshness: "catalog" as const,
      mapsUrl: "https://maps.google.com",
    }));
    const ranked = scoreVenues({
      venues,
      partner: emptyPrefs,
      user: emptyPrefs,
      chatFoods: [],
      chatPlaces: [],
      savedKeys: [],
      visitedKeys: [],
      areaHint: "F-10",
      slot: "now",
      now: new Date("2026-08-26T13:00:00"),
    });
    expect(ranked[0].area).toMatch(/F-10|F-11|F-9/);
    expect(ranked.some((v) => v.area === "F-10")).toBe(true);
  });

  it("scores a burger spot higher when she likes burgers", () => {
    const venues = catalogForCity("Islamabad", "restaurant").map((v) => ({
      ...v,
      key: v.name,
      provider: "catalog",
      source: "catalog" as const,
      freshness: "catalog" as const,
      mapsUrl: "https://maps.google.com",
    }));
    const ranked = scoreVenues({
      venues,
      partner: { ...emptyPrefs, dishes: ["burger"], cuisines: ["burgers"] },
      user: emptyPrefs,
      chatFoods: [],
      chatPlaces: [],
      savedKeys: [],
      visitedKeys: [],
      dishHint: "burger",
      slot: "dinner",
      now: new Date("2026-08-25T19:00:00"),
    });
    expect(ranked[0].name.toLowerCase()).toMatch(/brownie|burger|hardee|mcdonald|ginyaki|savour|chaaye|tuscany|monal|howdy/);
    expect(ranked[0].reasons.some((r) => /burger|like|city/i.test(r))).toBe(true);
  });

  it("extracts a restaurant she wants to try from chat", () => {
    const mentions = extractLifestyleMentions(["I really want to try that new Japanese restaurant next weekend."]);
    expect(mentions.some((m) => m.kind === "restaurant" || m.kind === "dish" || m.kind === "plan")).toBe(true);
  });
});
