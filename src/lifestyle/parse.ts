import { cityFromText } from "@/lifestyle/cities";
import type { DateNightVibe, LifestyleHints, LifestyleIntent, MealSlot, PriceRange } from "@/lifestyle/types";

const CUISINES = ["chinese", "japanese", "italian", "thai", "pakistani", "bbq", "burger", "burgers", "pizza", "seafood", "cafe", "continental", "afghani", "fast food", "dessert", "biryani"];

export function parseLifestyleHints(raw: string, now = new Date()): LifestyleHints {
  const lower = raw.toLowerCase();
  const intents: LifestyleIntent[] = [];
  if (/\bwhat should we order|what to order|order from this\b/.test(lower)) intents.push("FIND_ORDER");
  if (/\bdate night|plan a date|romantic (dinner|evening|night)|plan (a |our )?date\b/.test(lower)) intents.push("DATE_NIGHT");
  if (/\bwhat should we visit|places to visit|where should we go|suggest places|best places|what can we do (in|tonight|today|this weekend)|visit in\b/.test(lower)) {
    intents.push("FIND_PLACE");
  }
  if (/\bplan (our |the )?weekend|this weekend|what can we do this weekend\b/.test(lower)) intents.push("PLAN_WEEKEND");
  if (/\bwhat should we do today|plan (today|tomorrow)|what can we do tomorrow|go out tonight\b/.test(lower)) intents.push("PLAN_DAY");
  if (
    /\bwhat should we eat|where should we eat|good for dinner|suggest a restaurant|find a (good )?restaurant|what should we (have|order)|find a good burger|dinner in|what is good near|find something (she|he) likes|s?he wants (chinese|japanese|italian|thai|burger)|cheap restaurant|romantic restaurant|where should we go for dinner|find somewhere (nice|(she|he) would love)\b/.test(
      lower,
    )
  ) {
    intents.push("FIND_FOOD");
    intents.push("FIND_RESTAURANT");
  }

  let mealSlot: MealSlot | null = null;
  if (/\bbreakfast|nashta|brunch\b/.test(lower)) mealSlot = "breakfast";
  else if (/\blunch\b/.test(lower)) mealSlot = "lunch";
  else if (/\bdinner|tonight|evening meal\b/.test(lower)) mealSlot = "dinner";
  else if (/\blate night|after 11\b/.test(lower)) mealSlot = "late";
  else if (/\bnow|near us\b/.test(lower)) mealSlot = "now";

  let budgetHint: PriceRange | null = null;
  if (/\bcheap|budget|affordable|low budget\b/.test(lower)) budgetHint = "low";
  else if (/\bluxury|fine dining|expensive|special occasion\b/.test(lower)) budgetHint = "high";

  let dateNightVibe: DateNightVibe | null = null;
  if (/\bromantic\b/.test(lower)) dateNightVibe = "romantic";
  else if (/\bcasual\b/.test(lower)) dateNightVibe = "casual";
  else if (/\boutdoor\b/.test(lower)) dateNightVibe = "outdoor";
  else if (/\bquiet\b/.test(lower)) dateNightVibe = "quiet";
  else if (/\bluxury|fine dining\b/.test(lower)) dateNightVibe = "luxury";
  else if (/\badventure\b/.test(lower)) dateNightVibe = "adventure";
  else if (intents.includes("DATE_NIGHT")) dateNightVibe = "romantic";

  const cuisine = CUISINES.find((c) => new RegExp(`\\b${c}\\b`).test(lower)) ?? null;
  const people = lower.match(/\bfor\s+(\d+)\b/)?.[1];

  return {
    intents,
    cityHint: cityFromText(raw),
    cuisineHint: cuisine === "burgers" ? "burger" : cuisine,
    dishHint: /\bburger\b/.test(lower) ? "burger" : /\bbiryani\b/.test(lower) ? "biryani" : /\bpizza\b/.test(lower) ? "pizza" : null,
    budgetHint,
    mealSlot,
    dateNightVibe,
    peopleCount: people ? Number(people) : 2,
    wantsOrder: intents.includes("FIND_ORDER") || /\border\b/.test(lower),
  };
}

export function isLifestyleCommand(raw: string) {
  return parseLifestyleHints(raw).intents.length > 0;
}
