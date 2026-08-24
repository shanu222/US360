export const PAKISTAN_CITIES = [
  { name: "Islamabad", lat: 33.6844, lng: 73.0479 },
  { name: "Rawalpindi", lat: 33.5651, lng: 73.0169 },
  { name: "Lahore", lat: 31.5204, lng: 74.3587 },
  { name: "Karachi", lat: 24.8607, lng: 67.0011 },
  { name: "Peshawar", lat: 34.0151, lng: 71.5249 },
  { name: "Quetta", lat: 30.1798, lng: 66.975 },
  { name: "Multan", lat: 30.1575, lng: 71.5249 },
  { name: "Faisalabad", lat: 31.4504, lng: 73.135 },
  { name: "Gujranwala", lat: 32.1617, lng: 74.1883 },
  { name: "Sialkot", lat: 32.4945, lng: 74.5229 },
  { name: "Hyderabad", lat: 25.396, lng: 68.3578 },
  { name: "Bahawalpur", lat: 29.3956, lng: 71.6836 },
  { name: "Abbottabad", lat: 34.1688, lng: 73.2215 },
  { name: "Murree", lat: 33.9076, lng: 73.3943 },
  { name: "Gilgit", lat: 35.9208, lng: 74.3141 },
  { name: "Skardu", lat: 35.2971, lng: 75.6333 },
  { name: "Sukkur", lat: 27.7052, lng: 68.8574 },
  { name: "Larkana", lat: 27.559, lng: 68.2265 },
  { name: "Mardan", lat: 34.1982, lng: 72.04 },
  { name: "Sahiwal", lat: 30.6708, lng: 73.1066 },
] as const;

export type CityName = (typeof PAKISTAN_CITIES)[number]["name"];

export function normalizeCity(value?: string | null) {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  const found = PAKISTAN_CITIES.find((c) => c.name.toLowerCase() === raw.toLowerCase());
  if (found) return found.name;
  const partial = PAKISTAN_CITIES.find((c) => raw.toLowerCase().includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(raw.toLowerCase()));
  return partial?.name ?? raw;
}

export function cityFromText(text: string) {
  const lower = text.toLowerCase();
  return PAKISTAN_CITIES.find((c) => new RegExp(`\\b${c.name.toLowerCase()}\\b`).test(lower))?.name ?? null;
}

export function cityMeta(name?: string | null) {
  const normalized = normalizeCity(name);
  return PAKISTAN_CITIES.find((c) => c.name === normalized) ?? null;
}

export function mapsUrl(opts: { name: string; city: string; lat?: number | null; lng?: number | null; address?: string | null }) {
  if (opts.lat != null && opts.lng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${opts.lat},${opts.lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${opts.name} ${opts.address || opts.city}`)}`;
}
