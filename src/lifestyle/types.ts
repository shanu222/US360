export type Freshness = "verified" | "cached" | "catalog" | "user";
export type PriceRange = "low" | "medium" | "high";
export type MealSlot = "breakfast" | "lunch" | "dinner" | "late" | "now";
export type DateNightVibe = "casual" | "romantic" | "budget" | "special" | "outdoor" | "quiet" | "luxury" | "adventure" | "food";
export type VenueKind = "restaurant" | "place";

export type HoursSpec = {
  days?: number[];
  open?: string;
  close?: string;
  unknown?: boolean;
};

export type CatalogVenue = {
  name: string;
  city: string;
  area?: string;
  address?: string;
  kind: VenueKind;
  cuisine?: string[];
  categories: string[];
  priceRange?: PriceRange;
  hours?: HoursSpec;
  popularDishes?: string[];
  menuItems?: string[];
  venueType?: string;
  familyFriendly?: boolean;
  outdoor?: boolean;
  delivery?: boolean;
  reservation?: string;
  phone?: string;
  website?: string;
  lat?: number;
  lng?: number;
};

export type VenueRecord = CatalogVenue & {
  key: string;
  provider: string;
  providerId?: string;
  source: "catalog" | "live" | "user";
  freshness: Freshness;
  lastVerifiedAt?: string | null;
  mapsUrl: string;
  rating?: number | null;
  reviewCount?: number | null;
  openNow?: boolean | null;
  hoursLabel?: string;
};

export type ScoredVenue = VenueRecord & {
  score: number;
  reasons: string[];
  rank: number;
};

export type FoodPrefs = {
  cuisines: string[];
  dishes: string[];
  restaurants: string[];
  drinks: string[];
  desserts: string[];
  dislikes: string[];
  allergies: string[];
  spice?: string;
  diet?: string;
  budget?: PriceRange;
  environment?: string;
};

export type LifestyleIntent =
  | "FIND_FOOD"
  | "FIND_RESTAURANT"
  | "FIND_ORDER"
  | "DATE_NIGHT"
  | "FIND_PLACE"
  | "PLAN_DAY"
  | "PLAN_WEEKEND";

export type LifestyleHints = {
  intents: LifestyleIntent[];
  cityHint: string | null;
  areaHint: string | null;
  cuisineHint: string | null;
  dishHint: string | null;
  budgetHint: PriceRange | null;
  mealSlot: MealSlot | null;
  dateNightVibe: DateNightVibe | null;
  peopleCount: number;
  wantsOrder: boolean;
};

export type OrderSuggestion = {
  main: string;
  side: string;
  drink: string;
  dessert: string;
  why: string;
};

export type DayPlanBlock = {
  when: string;
  title: string;
  detail: string;
};

export type LifestyleView = {
  city: string | null;
  weather: { summary: string; tempC: number | null; source: string } | null;
  mealSlot: MealSlot | null;
  summary: string;
  restaurants: ScoredVenue[];
  places: ScoredVenue[];
  order: OrderSuggestion | null;
  dateNight: {
    vibe: DateNightVibe;
    dinner: ScoredVenue | null;
    activity: ScoredVenue | null;
    timing: string;
    message: string;
  } | null;
  dayPlan: DayPlanBlock[] | null;
  pendingFromChat: Array<{ title: string; quote: string; kind: string }>;
};
