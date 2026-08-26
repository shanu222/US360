import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";

type Restaurant = {
  key: string;
  name: string;
  city: string;
  area?: string;
  priceRange?: string;
  mapsUrl: string;
  website?: string;
  freshness: string;
  lastVerifiedAt?: string | null;
  hoursLabel?: string;
  openNow?: boolean | null;
  reasons: string[];
};

type Place = { key: string; name: string; mapsUrl: string; reasons: string[]; freshness: string };

export type LifestyleSlice = {
  city: string | null;
  weather: { summary: string; tempC: number | null; source: string } | null;
  summary: string;
  restaurants: Restaurant[];
  places: Place[];
  order: { main: string; side: string; drink: string; dessert: string; why: string } | null;
  dateNight: { vibe: string; dinner: { name: string } | null; activity: { name: string } | null; timing: string; message: string } | null;
  dayPlan: Array<{ when: string; title: string; detail: string }> | null;
};

export function LifestyleResult({
  lifestyle,
  show,
}: {
  lifestyle: LifestyleSlice;
  show: "food" | "places";
}) {
  const restaurants = show === "food" ? lifestyle.restaurants.slice(0, 3) : [];
  const places = show === "places" ? lifestyle.places.slice(0, 3) : [];

  return (
    <Card>
      <p className="text-xs uppercase tracking-[0.2em] text-rose">{show === "food" ? "Food" : "Explore"}</p>
      <CardTitle className="mt-2">
        {lifestyle.city ? (show === "food" ? `Tonight in ${lifestyle.city}` : `Out in ${lifestyle.city}`) : "Add your city"}
      </CardTitle>
      <p className="mt-2 text-sm text-muted">{lifestyle.summary}</p>
      {lifestyle.weather ? (
        <p className="mt-1 text-xs text-muted">
          {lifestyle.weather.summary}
          {lifestyle.weather.tempC != null ? ` · ${Math.round(lifestyle.weather.tempC)}°C` : ""}
        </p>
      ) : null}

      {restaurants.map((r, i) => (
        <div key={r.key} className="mt-4 rounded-2xl bg-paper p-3">
          <p className="font-medium">
            {i === 0 ? "1. " : i === 1 ? "2. " : "3. "}
            {r.name}
          </p>
          <p className="text-xs text-muted">
            {r.area || r.city}
            {r.priceRange ? ` · ${r.priceRange}` : ""}
            {r.openNow === true ? " · open now" : r.openNow === false ? " · may be closed" : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" asChild>
              <a href={r.mapsUrl} target="_blank" rel="noreferrer">
                Directions
              </a>
            </Button>
            {r.website ? (
              <Button size="sm" variant="ghost" asChild>
                <a href={r.website} target="_blank" rel="noreferrer">
                  Website
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      ))}

      {show === "food" && lifestyle.order ? (
        <div className="mt-4 rounded-2xl bg-paper p-3 text-sm">
          <p className="font-medium">If you order in</p>
          <p className="mt-2">Main: {lifestyle.order.main}</p>
          <p>Side: {lifestyle.order.side}</p>
          <p>Drink: {lifestyle.order.drink}</p>
          <p>Dessert: {lifestyle.order.dessert}</p>
        </div>
      ) : null}

      {places.map((p) => (
        <div key={p.key} className="mt-4 rounded-2xl bg-paper p-3">
          <p className="font-medium">{p.name}</p>
          <Button size="sm" className="mt-2" variant="outline" asChild>
            <a href={p.mapsUrl} target="_blank" rel="noreferrer">
              Details / directions
            </a>
          </Button>
        </div>
      ))}

      {show === "places" && lifestyle.dateNight ? (
        <div className="mt-4 rounded-2xl bg-paper p-3 text-sm">
          <p className="font-medium">Date idea · {lifestyle.dateNight.vibe}</p>
          <p className="mt-2">{lifestyle.dateNight.activity?.name ?? "A quiet walk nearby"}</p>
          {lifestyle.dateNight.dinner?.name ? <p className="mt-1 text-muted">Dinner nearby: {lifestyle.dateNight.dinner.name}</p> : null}
          <p className="mt-2 italic">“{lifestyle.dateNight.message}”</p>
        </div>
      ) : null}

      {show === "places" && lifestyle.dayPlan ? (
        <div className="mt-4 space-y-2 text-sm">
          {lifestyle.dayPlan.map((b) => (
            <p key={b.when}>
              <span className="font-medium">{b.when}:</span> {b.title}
            </p>
          ))}
        </div>
      ) : null}

      {!lifestyle.city ? (
        <Button className="mt-4" size="sm" asChild>
          <Link href="/profile">Set city on Profile</Link>
        </Button>
      ) : null}
    </Card>
  );
}
