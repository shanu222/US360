import { cityMeta, mapsUrl, normalizeCity } from "@/lifestyle/cities";
import { catalogForCity } from "@/lifestyle/catalog";
import { hoursLabel, isOpenAt } from "@/lifestyle/hours";
import type { MealSlot, VenueKind, VenueRecord } from "@/lifestyle/types";
import { db } from "@/lib/db";

function venueKey(city: string, name: string, kind: string) {
  return `${city.toLowerCase()}:${kind}:${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function fromCatalog(city: string, kind: VenueKind, slot: MealSlot, now: Date): VenueRecord[] {
  return catalogForCity(city, kind).map((v) => ({
    ...v,
    key: venueKey(v.city, v.name, v.kind),
    provider: "catalog",
    source: "catalog" as const,
    freshness: "catalog" as const,
    lastVerifiedAt: null,
    mapsUrl: mapsUrl({ name: v.name, city: v.city, address: v.address }),
    openNow: isOpenAt(v.hours, now, slot),
    hoursLabel: hoursLabel(v.hours),
  }));
}

async function googlePlaces(city: string, kind: VenueKind, area?: string | null): Promise<VenueRecord[]> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return [];
  const where = area ? `${area} ${city} Pakistan` : `${city} Pakistan`;
  const query = kind === "restaurant" ? `restaurants in ${where}` : `things to do in ${where}`;
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${key}`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return [];
    const json = (await res.json()) as {
      results?: Array<{
        place_id: string;
        name: string;
        formatted_address?: string;
        rating?: number;
        user_ratings_total?: number;
        opening_hours?: { open_now?: boolean };
        types?: string[];
        geometry?: { location?: { lat: number; lng: number } };
      }>;
    };
    const nowIso = new Date().toISOString();
    return (json.results ?? []).slice(0, 12).map((p) => ({
      name: p.name,
      city,
      area: area ?? undefined,
      address: p.formatted_address,
      kind,
      cuisine: kind === "restaurant" ? ["mixed"] : [],
      categories: p.types ?? [kind],
      key: venueKey(city, p.name, kind),
      provider: "google",
      providerId: p.place_id,
      source: "live" as const,
      freshness: "verified" as const,
      lastVerifiedAt: nowIso,
      mapsUrl: mapsUrl({ name: p.name, city, lat: p.geometry?.location?.lat, lng: p.geometry?.location?.lng, address: p.formatted_address }),
      rating: p.rating ?? null,
      reviewCount: p.user_ratings_total ?? null,
      openNow: p.opening_hours?.open_now ?? null,
      hoursLabel: p.opening_hours?.open_now === true ? "Reported open now" : p.opening_hours?.open_now === false ? "Reported closed now" : "Hours from Google",
      lat: p.geometry?.location?.lat,
      lng: p.geometry?.location?.lng,
      venueType: kind,
    }));
  } catch {
    return [];
  }
}

async function foursquare(city: string, kind: VenueKind, area?: string | null): Promise<VenueRecord[]> {
  const key = process.env.FOURSQUARE_API_KEY;
  if (!key) return [];
  const categories = kind === "restaurant" ? "13065" : "16000";
  try {
    const res = await fetch(
      `https://api.foursquare.com/v3/places/search?near=${encodeURIComponent(`${area ? `${area}, ` : ""}${city}, Pakistan`)}&categories=${categories}&limit=10`,
      { headers: { Authorization: key, Accept: "application/json" }, next: { revalidate: 3600 } },
    );
    if (!res.ok) return [];
    const json = (await res.json()) as {
      results?: Array<{
        fsq_id: string;
        name: string;
        location?: { address?: string; locality?: string };
        geocodes?: { main?: { latitude: number; longitude: number } };
        categories?: Array<{ name: string }>;
      }>;
    };
    const nowIso = new Date().toISOString();
    return (json.results ?? []).map((p) => ({
      name: p.name,
      city,
      address: p.location?.address,
      area: p.location?.locality,
      kind,
      cuisine: [],
      categories: p.categories?.map((c) => c.name.toLowerCase()) ?? [kind],
      key: venueKey(city, p.name, kind),
      provider: "foursquare",
      providerId: p.fsq_id,
      source: "live" as const,
      freshness: "verified" as const,
      lastVerifiedAt: nowIso,
      mapsUrl: mapsUrl({
        name: p.name,
        city,
        lat: p.geocodes?.main?.latitude,
        lng: p.geocodes?.main?.longitude,
        address: p.location?.address,
      }),
      lat: p.geocodes?.main?.latitude,
      lng: p.geocodes?.main?.longitude,
      hoursLabel: "Hours from Foursquare when available",
      venueType: kind,
    }));
  } catch {
    return [];
  }
}

async function osm(city: string, kind: VenueKind): Promise<VenueRecord[]> {
  const meta = cityMeta(city);
  if (!meta) return [];
  const amenity = kind === "restaurant" ? "restaurant" : "tourism";
  const query =
    kind === "restaurant"
      ? `[out:json][timeout:12];node["amenity"="restaurant"](around:8000,${meta.lat},${meta.lng});out body 20;`
      : `[out:json][timeout:12];(node["tourism"~"attraction|museum|viewpoint"](around:10000,${meta.lat},${meta.lng});node["leisure"="park"](around:8000,${meta.lat},${meta.lng}););out body 20;`;
  try {
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", "user-agent": "US360/1.0 (city lifestyle assistant)" },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      elements?: Array<{ id: number; lat?: number; lon?: number; tags?: Record<string, string> }>;
    };
    const nowIso = new Date().toISOString();
    return (json.elements ?? [])
      .filter((el) => el.tags?.name)
      .slice(0, 12)
      .map((el) => ({
        name: el.tags!.name,
        city,
        address: el.tags!["addr:street"],
        kind,
        cuisine: el.tags?.cuisine ? el.tags.cuisine.split(";").map((s) => s.trim().toLowerCase()) : [],
        categories: [amenity, el.tags?.tourism, el.tags?.leisure].filter(Boolean) as string[],
        key: venueKey(city, el.tags!.name, kind),
        provider: "osm",
        providerId: String(el.id),
        source: "live" as const,
        freshness: "verified" as const,
        lastVerifiedAt: nowIso,
        mapsUrl: mapsUrl({ name: el.tags!.name, city, lat: el.lat, lng: el.lon }),
        lat: el.lat,
        lng: el.lon,
        phone: el.tags?.phone,
        website: el.tags?.website,
        hoursLabel: el.tags?.opening_hours || "Hours from OpenStreetMap when tagged",
        venueType: el.tags?.tourism || el.tags?.leisure || kind,
      }));
  } catch {
    return [];
  }
}

async function cacheVenues(records: VenueRecord[]) {
  for (const v of records) {
    try {
      await db.cachedVenue.upsert({
        where: { key: v.key },
        update: {
          name: v.name,
          city: v.city,
          area: v.area,
          address: v.address,
          lat: v.lat,
          lng: v.lng,
          cuisine: v.cuisine ?? [],
          categories: v.categories,
          priceRange: v.priceRange,
          popularDishes: v.popularDishes ?? [],
          provider: v.provider,
          providerId: v.providerId,
          source: v.source,
          freshness: v.freshness,
          lastVerifiedAt: v.lastVerifiedAt ? new Date(v.lastVerifiedAt) : undefined,
          mapsUrl: v.mapsUrl,
          rating: v.rating ?? undefined,
          reviewCount: v.reviewCount ?? undefined,
        },
        create: {
          key: v.key,
          name: v.name,
          city: v.city,
          area: v.area,
          address: v.address,
          lat: v.lat,
          lng: v.lng,
          cuisine: v.cuisine ?? [],
          categories: v.categories,
          priceRange: v.priceRange,
          popularDishes: v.popularDishes ?? [],
          kind: v.kind,
          provider: v.provider,
          providerId: v.providerId,
          source: v.source,
          freshness: v.freshness,
          lastVerifiedAt: v.lastVerifiedAt ? new Date(v.lastVerifiedAt) : undefined,
          mapsUrl: v.mapsUrl,
          rating: v.rating ?? undefined,
          reviewCount: v.reviewCount ?? undefined,
        },
      });
    } catch {
      /* cache is best-effort */
    }
  }
}

export async function discoverVenues(opts: { city: string; kind: VenueKind; slot: MealSlot; now: Date; area?: string | null }) {
  const city = normalizeCity(opts.city) || opts.city;
  const catalog = fromCatalog(city, opts.kind, opts.slot, opts.now);
  const live = (await Promise.all([googlePlaces(city, opts.kind, opts.area), foursquare(city, opts.kind, opts.area), osm(city, opts.kind)])).flat();
  await cacheVenues(live);
  const byKey = new Map<string, VenueRecord>();
  for (const v of catalog) byKey.set(v.key, v);
  for (const v of live) {
    const prev = byKey.get(v.key);
    byKey.set(v.key, prev ? { ...prev, ...v, popularDishes: prev.popularDishes ?? v.popularDishes, cuisine: [...new Set([...(prev.cuisine ?? []), ...(v.cuisine ?? [])])] } : v);
  }
  return [...byKey.values()];
}

export function liveSearchConfigured() {
  return Boolean(process.env.GOOGLE_PLACES_API_KEY || process.env.FOURSQUARE_API_KEY);
}
