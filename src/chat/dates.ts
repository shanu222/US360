import type { ParsedMessage } from "@/chat/parse";
import type { CalendarEventType } from "@prisma/client";

export interface ChatCalendarEvent {
  title: string;
  startAt: Date;
  type: CalendarEventType;
  hint: string;
  quote: string;
  confidence: "high" | "medium";
}

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const MONTHS: Record<string, number> = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3,
  may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7, sep: 8, sept: 8,
  september: 8, oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11,
};

const ACTIVITY =
  /\b(orientation|exam|class|presentation|assignment|birthday|anniversary|interview|meeting|appointment|doctor|hospital|grocery|call|uni|university|nashta|dinner|lunch|flight|airport|nikah|shaadi|work|office)\b/i;

function clip(value: string, max = 160) {
  const v = value.replace(/\s+/g, " ").trim();
  return v.length > max ? `${v.slice(0, max - 1).trim()}…` : v;
}

function atTime(base: Date, hour = 10, minute = 0) {
  const d = new Date(base);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function parseClock(text: string): { hour: number; minute: number } | null {
  const mer = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  const colon = mer ? null : text.match(/\b(\d{1,2}):(\d{2})\b/);
  const m = mer ?? colon;
  if (!m) return null;
  let hour = Number(m[1]);
  const minute = Number(m[2] ?? 0);
  const suffix = mer?.[3]?.toLowerCase();
  if (hour > 23) return null;
  if (suffix === "pm" && hour < 12) hour += 12;
  if (suffix === "am" && hour === 12) hour = 0;
  if (!suffix && hour <= 7) hour += 12;
  return { hour, minute };
}

function parseSlashDate(text: string, ref: Date): Date | null {
  const m = text.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/);
  if (!m) return null;
  const a = Number(m[1]);
  const b = Number(m[2]);
  const yRaw = Number(m[3]);
  const year = yRaw < 100 ? 2000 + yRaw : yRaw;
  const dayFirst = a > 12 || b <= 12;
  const day = dayFirst ? a : b;
  const month = dayFirst ? b : a;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const clock = parseClock(text) ?? { hour: 10, minute: 0 };
  const d = new Date(year, month - 1, day, clock.hour, clock.minute, 0);
  if (Number.isNaN(d.getTime())) return null;
  if (Math.abs(d.getTime() - ref.getTime()) > 1000 * 60 * 60 * 24 * 400) return null;
  return d;
}

function parseMonthName(text: string, ref: Date): Date | null {
  const m = text.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/i)
    ?? text.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i);
  if (!m) return null;
  const nums = m[0].match(/\d{1,2}/);
  const mon = [...m[0].toLowerCase().matchAll(/[a-z]+/g)].map((x) => x[0]).find((w) => MONTHS[w] !== undefined);
  if (!nums || mon === undefined) return null;
  const day = Number(nums[0]);
  const month = MONTHS[mon];
  const clock = parseClock(text) ?? { hour: 10, minute: 0 };
  const year = ref.getFullYear();
  let d = new Date(year, month, day, clock.hour, clock.minute, 0);
  if (d < new Date(ref.getTime() - 1000 * 60 * 60 * 24 * 2)) {
    d = new Date(year + 1, month, day, clock.hour, clock.minute, 0);
  }
  return Number.isNaN(d.getTime()) ? null : d;
}

function nextWeekday(from: Date, target: number) {
  const d = new Date(from);
  const diff = (target - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return d;
}

function eventType(text: string): CalendarEventType {
  const t = text.toLowerCase();
  if (/birthday|bday/.test(t)) return "BIRTHDAY";
  if (/anniversary|nikah|shaadi/.test(t)) return "ANNIVERSARY";
  if (/exam|assignment|presentation|orientation|class|uni|university/.test(t)) return "EXAM";
  if (/office|work|interview|meeting/.test(t)) return "WORK";
  if (/family|ammi|abu|mama/.test(t)) return "FAMILY";
  if (/doctor|hospital|appointment/.test(t)) return "PERSONAL";
  return "EVENT";
}

function titleFor(text: string, fallbackDate: Date) {
  const act = text.match(ACTIVITY)?.[1];
  if (act) return `${act[0].toUpperCase()}${act.slice(1)}`;
  return `Plan · ${fallbackDate.toLocaleDateString()}`;
}

function isHighConfidence(text: string, usedSlash: boolean, usedMonth: boolean, relative: boolean) {
  const t = text.toLowerCase();
  if (usedSlash || usedMonth) return true;
  if (relative && /\b(exam|birthday|anniversary|interview|appointment|orientation|presentation)\b/.test(t)) return true;
  return false;
}

export function extractChatCalendar(messages: ParsedMessage[], now = new Date()): ChatCalendarEvent[] {
  const out: ChatCalendarEvent[] = [];
  const seen = new Set<string>();
  const dated = messages.filter((m) => m.sentAt);
  const chatEnd = dated.reduce((max, m) => (m.sentAt! > max ? m.sentAt! : max), dated[0]?.sentAt ?? now);
  const recentStart = new Date(chatEnd.getTime() - 14 * 24 * 60 * 60 * 1000);
  const exportIsFresh = chatEnd.getTime() > now.getTime() - 7 * 24 * 60 * 60 * 1000;

  for (const m of messages) {
    if (m.kind !== "text" || !m.sentAt) continue;
    const text = m.text.replace(/\s+/g, " ").trim();
    if (text.length < 4 || text.length > 280) continue;
    const lower = text.toLowerCase();
    const ref = m.sentAt;
    const clock = parseClock(lower);
    const usedSlash = Boolean(parseSlashDate(lower, ref));
    const usedMonth = Boolean(parseMonthName(lower, ref));
    let start: Date | null = parseSlashDate(lower, ref) || parseMonthName(lower, ref);
    let relative = false;

    if (!start && /\b(today|aaj|tonight)\b/.test(lower) && ACTIVITY.test(lower)) {
      relative = true;
      start = atTime(ref, clock?.hour ?? 19, clock?.minute ?? 0);
    }
    if (!start && /\b(tomorrow|kal)\b/.test(lower) && (ACTIVITY.test(lower) || clock)) {
      relative = true;
      const d = new Date(ref);
      d.setDate(d.getDate() + 1);
      start = atTime(d, clock?.hour ?? 10, clock?.minute ?? 0);
    }
    if (!start) {
      const wd = WEEKDAYS.findIndex((d) => new RegExp(`\\b${d}\\b`).test(lower));
      if (wd >= 0 && (ACTIVITY.test(lower) || clock)) {
        relative = true;
        start = atTime(nextWeekday(ref, wd), clock?.hour ?? 10, clock?.minute ?? 0);
      }
    }

    if (!start) continue;
    if (relative && m.sentAt < recentStart) continue;
    if (start.getTime() < now.getTime() - 1000 * 60 * 60 * 12) {
      if (relative && exportIsFresh && m.sentAt.getTime() > chatEnd.getTime() - 3 * 24 * 60 * 60 * 1000) {
        if (/\b(today|aaj|tonight)\b/.test(lower)) start = atTime(now, clock?.hour ?? 19, clock?.minute ?? 0);
        else if (/\b(tomorrow|kal)\b/.test(lower)) {
          const d = new Date(now);
          d.setDate(d.getDate() + 1);
          start = atTime(d, clock?.hour ?? 10, clock?.minute ?? 0);
        } else continue;
      } else continue;
    }
    if (start.getTime() > now.getTime() + 1000 * 60 * 60 * 24 * 400) continue;

    const key = `${start.toISOString().slice(0, 13)}:${titleFor(text, start).toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({
      title: titleFor(text, start).slice(0, 80),
      startAt: start,
      type: eventType(text),
      hint: `Detected from a WhatsApp line on ${ref.toLocaleString()}.`,
      quote: clip(text),
      confidence: isHighConfidence(lower, usedSlash, usedMonth, relative) ? "high" : "medium",
    });
    if (out.length >= 40) break;
  }

  return out.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
}

export function reelQueriesFromChat(input: {
  likes?: string[];
  foods?: string[];
  activities?: string[];
  topics?: { topic: string; count: number }[];
  places?: string[];
}) {
  const seeds = [
    ...(input.likes ?? []).slice(0, 4),
    ...(input.foods ?? []).slice(0, 3),
    ...(input.activities ?? []).slice(0, 3),
    ...(input.places ?? []).slice(0, 2),
    ...(input.topics ?? []).slice(0, 4).map((t) => t.topic),
    "romantic couple",
    "good morning love",
    "cute relationship",
  ];
  const seen = new Set<string>();
  const queries: string[] = [];
  for (const seed of seeds) {
    const q = seed.replace(/\s+/g, " ").trim().toLowerCase();
    if (q.length < 3 || seen.has(q)) continue;
    seen.add(q);
    queries.push(`${q} reel`);
    if (queries.length >= 10) break;
  }
  return queries;
}

export function instagramSearchUrl(query: string) {
  const tag = query.replace(/ reel$/i, "").replace(/[^a-z0-9]+/gi, "").slice(0, 24);
  return {
    search: `https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(query)}`,
    tag: tag ? `https://www.instagram.com/explore/tags/${encodeURIComponent(tag)}/` : "https://www.instagram.com/explore/",
  };
}
