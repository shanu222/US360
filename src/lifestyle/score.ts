import type { DateNightVibe, FoodPrefs, MealSlot, PriceRange, ScoredVenue, VenueRecord } from "@/lifestyle/types";
import { isOpenAt } from "@/lifestyle/hours";
import { nearbyAreas } from "@/lifestyle/cities";

function hasAny(hay: string[], needles: string[]) {
  const h = hay.map((x) => x.toLowerCase());
  return needles.some((n) => h.some((x) => x.includes(n.toLowerCase()) || n.toLowerCase().includes(x)));
}

export function scoreVenues(opts: {
  venues: VenueRecord[];
  partner: FoodPrefs;
  user: FoodPrefs;
  chatFoods: string[];
  chatPlaces: string[];
  savedKeys: string[];
  visitedKeys: string[];
  budget?: PriceRange | null;
  cuisineHint?: string | null;
  dishHint?: string | null;
  areaHint?: string | null;
  vibe?: DateNightVibe | null;
  slot: MealSlot;
  now: Date;
  relationshipState?: string;
}): ScoredVenue[] {
  const ranked = opts.venues.map((v) => {
    let score = 40;
    const reasons: string[] = [];
    const blob = [...(v.cuisine ?? []), ...v.categories, ...(v.popularDishes ?? []), v.venueType ?? "", v.name].join(" ").toLowerCase();

    if (opts.cuisineHint && blob.includes(opts.cuisineHint)) {
      score += 28;
      reasons.push(`Matches the ${opts.cuisineHint} request.`);
    }
    if (hasAny(v.cuisine ?? [], opts.partner.cuisines) || hasAny(v.popularDishes ?? [], opts.partner.dishes)) {
      score += 22;
      reasons.push("She likes this cuisine or these dishes.");
    }
    if (hasAny(v.cuisine ?? [], opts.user.cuisines) || hasAny(v.popularDishes ?? [], opts.user.dishes)) {
      score += 10;
      reasons.push("Fits what you also enjoy.");
    }
    if (hasAny(v.popularDishes ?? [], opts.chatFoods) || hasAny(v.cuisine ?? [], opts.chatFoods)) {
      score += 14;
      reasons.push("Chat history mentioned this kind of food.");
    }
    if (opts.dishHint && blob.includes(opts.dishHint)) {
      score += 16;
      reasons.push(`Has ${opts.dishHint}.`);
    }
    if (opts.areaHint) {
      const nearby = nearbyAreas(opts.areaHint);
      const venueArea = (v.area ?? "").replace(/\s+/g, "").toUpperCase();
      const exact = nearby[0]?.replace(/\s+/g, "").toUpperCase();
      if (exact && (venueArea.includes(exact) || (v.address ?? "").toUpperCase().includes(opts.areaHint.toUpperCase()))) {
        score += 26;
        reasons.push(`In ${opts.areaHint}.`);
      } else if (nearby.some((a) => venueArea.includes(a.replace(/\s+/g, "").toUpperCase()))) {
        score += 12;
        reasons.push(`Close to ${opts.areaHint}.`);
      } else {
        score -= 8;
      }
    }
    if (opts.budget && v.priceRange === opts.budget) {
      score += 12;
      reasons.push("Fits the selected budget.");
    } else if (opts.partner.budget && v.priceRange === opts.partner.budget) {
      score += 8;
      reasons.push("Fits her usual budget.");
    }
    const open = isOpenAt(v.hours, opts.now, opts.slot);
    if (open === true) {
      score += 14;
      reasons.push("Open at the requested time.");
    } else if (open === false) {
      score -= 20;
      reasons.push("May be closed at that time — confirm before you go.");
    }
    if (opts.savedKeys.includes(v.key)) {
      score += 10;
      reasons.push("You saved this place.");
    }
    if (opts.visitedKeys.includes(v.key)) {
      score -= 8;
      reasons.push("You have already been — a familiar option.");
    } else {
      score += 6;
      reasons.push("You have not logged a visit yet.");
    }
    if (opts.vibe === "romantic" && v.categories.some((c) => /romantic|quiet|view|luxury/.test(c))) {
      score += 16;
      reasons.push("Suited to a quieter, romantic evening.");
    }
    if (opts.vibe === "budget" && v.priceRange === "low") score += 12;
    if (opts.vibe === "outdoor" && v.outdoor) {
      score += 12;
      reasons.push("Outdoor seating / open air.");
    }
    if (opts.vibe === "luxury" && v.priceRange === "high") score += 12;
    if (opts.relationshipState === "SUPPORT" && v.categories.some((c) => /quiet|cafe|park/.test(c))) {
      score += 8;
      reasons.push("Calmer than a loud night out — better around a heavy day.");
    }
    if (opts.relationshipState === "CONFLICT") score -= 30;
    if (hasAny(opts.partner.dislikes, [v.name, ...(v.cuisine ?? []), ...(v.popularDishes ?? [])])) {
      score -= 25;
      reasons.push("Conflicts with a recorded dislike.");
    }
    reasons.unshift(`Located in ${v.city}.`);
    return { ...v, score, reasons: reasons.slice(0, 6), rank: 0 };
  });
  ranked.sort((a, b) => b.score - a.score);
  return ranked.map((v, i) => ({ ...v, rank: i + 1 }));
}

export function suggestOrder(opts: { venue?: VenueRecord | null; partner: FoodPrefs; user: FoodPrefs; people: number; budget?: PriceRange | null }) {
  const dishes = opts.venue?.popularDishes ?? [];
  const herDish = opts.partner.dishes[0];
  const main =
    dishes.find((d) => herDish && d.toLowerCase().includes(herDish.toLowerCase())) ||
    dishes[0] ||
    herDish ||
    "A sharing main you both already like";
  const drink = opts.partner.drinks[0] || opts.user.drinks[0] || "Fresh juice or chai";
  const dessert = opts.partner.desserts[0] || dishes.find((d) => /cake|brownie|ice|halwa|rabri/.test(d.toLowerCase())) || "A small dessert to share";
  const side = dishes[1] || "Naan / a light side for the table";
  const qty = opts.people >= 3 ? `Plan mains for ${opts.people}, plus one extra side.` : "One main to share or two smaller plates is enough for two.";
  return {
    main,
    side,
    drink,
    dessert,
    why: `${qty} Built from ${opts.venue?.name ?? "the menu"} plus her saved likes.`,
  };
}
