import type { HoursSpec, MealSlot } from "@/lifestyle/types";

export function mealSlotFromNow(now: Date, hint?: MealSlot | null): MealSlot {
  if (hint) return hint;
  const hour = now.getHours();
  if (hour < 11) return "breakfast";
  if (hour < 16) return "lunch";
  if (hour < 22) return "dinner";
  return "late";
}

export function requestedHour(now: Date, slot: MealSlot) {
  if (slot === "breakfast") return 9;
  if (slot === "lunch") return 13;
  if (slot === "dinner") return 20;
  if (slot === "late") return 23;
  return now.getHours();
}

function minutes(hhmm?: string) {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(":").map(Number);
  if (!Number.isFinite(h)) return null;
  return h * 60 + (m || 0);
}

export function isOpenAt(hours: HoursSpec | undefined, when: Date, slot: MealSlot): boolean | null {
  if (!hours || hours.unknown) return null;
  const day = when.getDay();
  if (hours.days?.length && !hours.days.includes(day)) return false;
  const open = minutes(hours.open);
  const close = minutes(hours.close);
  if (open == null || close == null) return null;
  const hour = slot === "now" ? when.getHours() : requestedHour(when, slot);
  const cur = hour * 60;
  if (close > open) return cur >= open && cur < close;
  return cur >= open || cur < close;
}

export function hoursLabel(hours?: HoursSpec) {
  if (!hours || hours.unknown) return "Hours not verified";
  if (hours.open && hours.close) return `${hours.open}–${hours.close}`;
  return "Hours not verified";
}
