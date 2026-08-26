import type { EngineContext, ParsedCommand } from "@/engine/types";
import { parseLifestyleHints } from "@/lifestyle/parse";
import { discoverVenues } from "@/lifestyle/providers";
import { fetchWeather } from "@/lifestyle/weather";
import { scoreVenues, suggestOrder } from "@/lifestyle/score";
import { mealSlotFromNow } from "@/lifestyle/hours";
import { normalizeCity } from "@/lifestyle/cities";
import type { FoodPrefs, LifestyleView, PriceRange } from "@/lifestyle/types";
import { db } from "@/lib/db";

function list(value?: string | null) {
  return (value ?? "")
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function foodPrefsFromMap(prefs: Map<string, string>, subject: "user" | "partner"): FoodPrefs {
  const p = (key: string) => list(prefs.get(subject === "user" ? `user_${key}` : `partner_${key}`) || prefs.get(key));
  const budgetRaw = (prefs.get(subject === "user" ? "user_budget" : "partner_budget") || prefs.get("dining_budget") || "").toLowerCase();
  const budget: PriceRange | undefined = /high|luxury/.test(budgetRaw) ? "high" : /low|cheap|budget/.test(budgetRaw) ? "low" : /medium/.test(budgetRaw) ? "medium" : undefined;
  return {
    cuisines: p("cuisines").length ? p("cuisines") : subject === "partner" ? [] : [],
    dishes: p("dishes"),
    restaurants: p("restaurants"),
    drinks: p("drinks"),
    desserts: p("desserts"),
    dislikes: p("food_dislikes"),
    allergies: p("allergies"),
    spice: prefs.get(subject === "user" ? "user_spice" : "partner_spice"),
    diet: prefs.get(subject === "user" ? "user_diet" : "partner_diet"),
    budget,
    environment: prefs.get(subject === "user" ? "user_dining_env" : "partner_dining_env"),
  };
}

export async function buildLifestyle(opts: {
  userId: string;
  command: string;
  parsed: ParsedCommand;
  ctx: EngineContext;
}): Promise<LifestyleView | null> {
  const hints = opts.parsed.lifestyle ?? parseLifestyleHints(opts.command, opts.ctx.now);
  if (!hints.intents.length) return null;

  const city = hints.cityHint || opts.ctx.city || null;
  const slot = mealSlotFromNow(opts.ctx.now, hints.mealSlot);
  const weather = city ? await fetchWeather(city) : null;
  const partner = opts.ctx.food.partner;
  const user = opts.ctx.food.user;

  const saved = opts.ctx.savedVenues.map((s) => s.venueKey);
  const visited = opts.ctx.venueVisits.map((s) => s.venueKey);

  const needFood = hints.intents.some((i) => ["FIND_FOOD", "FIND_RESTAURANT", "FIND_ORDER", "DATE_NIGHT", "PLAN_DAY", "PLAN_WEEKEND"].includes(i));
  const needPlace = hints.intents.some((i) => ["FIND_PLACE", "DATE_NIGHT", "PLAN_DAY", "PLAN_WEEKEND"].includes(i));

  const restaurants = city && needFood
    ? scoreVenues({
        venues: await discoverVenues({ city, kind: "restaurant", slot, now: opts.ctx.now, area: hints.areaHint }),
        partner,
        user,
        chatFoods: [...opts.ctx.chat.foods, ...opts.ctx.chat.likes],
        chatPlaces: opts.ctx.profile.places,
        savedKeys: saved,
        visitedKeys: visited,
        budget: hints.budgetHint || partner.budget || user.budget,
        cuisineHint: hints.cuisineHint,
        dishHint: hints.dishHint,
        areaHint: hints.areaHint,
        vibe: hints.dateNightVibe,
        slot,
        now: opts.ctx.now,
        relationshipState: opts.ctx.recentSituations.some((s) => /exam|stress/i.test(s.description)) ? "SUPPORT" : undefined,
      }).slice(0, 5)
    : [];

  const places = city && needPlace
    ? scoreVenues({
        venues: await discoverVenues({ city, kind: "place", slot, now: opts.ctx.now, area: hints.areaHint }),
        partner,
        user,
        chatFoods: opts.ctx.profile.places,
        chatPlaces: opts.ctx.profile.places,
        savedKeys: saved,
        visitedKeys: visited,
        budget: hints.budgetHint,
        vibe: hints.dateNightVibe,
        areaHint: hints.areaHint,
        slot,
        now: opts.ctx.now,
        relationshipState: opts.parsed.primarySituation === "EXAM" ? "SUPPORT" : undefined,
      }).slice(0, 5)
    : [];

  const top = restaurants[0] ?? null;
  const order = hints.wantsOrder || hints.intents.includes("FIND_ORDER") ? suggestOrder({ venue: top, partner, user, people: hints.peopleCount, budget: hints.budgetHint }) : restaurants.length ? suggestOrder({ venue: top, partner, user, people: 2 }) : null;

  const examSoon = opts.ctx.upcoming.some((e) => e.type === "EXAM") || opts.parsed.primarySituation === "EXAM";
  const dateNight = hints.intents.includes("DATE_NIGHT") || hints.dateNightVibe
    ? {
        vibe: hints.dateNightVibe || "romantic",
        dinner: top,
        activity: places[0] ?? null,
        timing: examSoon ? "Keep it early and calm — she has something demanding nearby." : slot === "dinner" ? "Aim for 7:30–9:00pm." : "Pick a window that does not rush her.",
        message: examSoon
          ? "Let's go out tonight, keep it easy, and I'll get you home in time to rest."
          : "Let's go out tonight. I thought we could spend some time together.",
      }
    : null;

  const dayPlan =
    hints.intents.includes("PLAN_DAY") || hints.intents.includes("PLAN_WEEKEND")
      ? [
          { when: "Afternoon", title: places[0]?.name || "A suitable place in your city", detail: places[0]?.reasons[1] || "A walk or quiet visit — not a packed itinerary." },
          { when: "Evening", title: top?.name || "Dinner", detail: top ? top.reasons.slice(0, 2).join(" ") : "A restaurant that fits both of you." },
          { when: "Night", title: examSoon ? "Home early" : places[1]?.name || "A short, easy close", detail: examSoon ? "She has something important tomorrow. Skip a late night." : "Optional card or a short message after." },
        ]
      : null;

  const summary = !city
    ? "Add your city on Profile (city only — no home address) so recommendations can be local."
    : restaurants.length || places.length
      ? `Suggestions for ${hints.areaHint ? `${hints.areaHint}, ` : ""}${city}${weather ? ` · ${weather.summary}${weather.tempC != null ? `, ${Math.round(weather.tempC)}°C` : ""}` : ""}. Catalog plus any live search you have configured.`
      : `No live listings yet for ${city}. Catalog options will appear once the city matches, or add GOOGLE_PLACES_API_KEY / FOURSQUARE_API_KEY.`;

  return {
    city: city ? normalizeCity(city) : null,
    weather,
    mealSlot: slot,
    summary,
    restaurants,
    places,
    order: hints.intents.includes("FIND_ORDER") || hints.wantsOrder || restaurants.length ? order : null,
    dateNight,
    dayPlan,
    pendingFromChat: opts.ctx.pendingLifestyle,
  };
}

export async function loadLifestyleMemory(userId: string) {
  const [savedVenues, venueVisits, plans] = await Promise.all([
    db.savedVenue.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 40 }).catch(() => []),
    db.venueVisit.findMany({ where: { userId }, orderBy: { visitedAt: "desc" }, take: 20 }).catch(() => []),
    db.lifestylePlan.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 10 }).catch(() => []),
  ]);
  return { savedVenues, venueVisits, plans };
}
