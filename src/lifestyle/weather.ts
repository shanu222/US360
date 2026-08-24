import { cityMeta } from "@/lifestyle/cities";

const CODES: Record<number, string> = {
  0: "Clear",
  1: "Mostly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Foggy",
  51: "Light drizzle",
  61: "Rain",
  71: "Snow",
  80: "Showers",
  95: "Thunderstorm",
};

export async function fetchWeather(city?: string | null) {
  const meta = cityMeta(city);
  if (!meta) return null;
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${meta.lat}&longitude=${meta.lng}&current=temperature_2m,weather_code`,
      { next: { revalidate: 1800 } },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { current?: { temperature_2m?: number; weather_code?: number } };
    const code = json.current?.weather_code ?? 1;
    return {
      summary: CODES[code] || "Local weather",
      tempC: json.current?.temperature_2m ?? null,
      source: "Open-Meteo",
    };
  } catch {
    return null;
  }
}
