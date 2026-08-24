export type ChatKind = "text" | "system" | "media" | "call";

export interface ParsedMessage {
  sentAt: Date | null;
  sender: string;
  text: string;
  kind: ChatKind;
  raw: string;
}

const INVISIBLE = /[\u200e\u200f\ufeff\u202a-\u202e]/g;
const FLEX_SPACE = /[\u202f\u00a0\u2007]/g;

const IOS =
  /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),\s+(\d{1,2}:\d{2}(?::\d{2})?)\s*(AM|PM|am|pm)?\]\s+([^:]+):\s?([\s\S]*)$/;
const ANDROID =
  /^(\d{1,2}\/\d{1,2}\/\d{2,4}),\s+(\d{1,2}:\d{2}(?::\d{2})?)\s*(AM|PM|am|pm)?\s+-\s+([^:]+):\s?([\s\S]*)$/;

const SYSTEM_SNIPPETS = [
  "messages and calls are end-to-end encrypted",
  "you blocked this person",
  "you unblocked this person",
  "this message was deleted",
  "waiting for this message",
  "changed the subject",
  "changed this group's icon",
  "security code changed",
];

const MEDIA_SNIPPETS = [
  "image omitted",
  "video omitted",
  "audio omitted",
  "sticker omitted",
  "gif omitted",
  "document omitted",
  "contact card omitted",
  "<attached:",
  "‎image omitted",
];

export function normalizeChatText(input: string) {
  return input.replace(INVISIBLE, "").replace(FLEX_SPACE, " ").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function parseDate(date: string, time: string, ampm?: string) {
  const [a, b, yRaw] = date.split("/").map((p) => Number(p));
  const year = yRaw < 100 ? 2000 + yRaw : yRaw;
  const dayFirst = a > 12 || b <= 12;
  const day = dayFirst ? a : b;
  const month = dayFirst ? b : a;
  const t = time.split(":").map(Number);
  let hour = t[0] ?? 0;
  const minute = t[1] ?? 0;
  const second = t[2] ?? 0;
  const mer = ampm?.toUpperCase();
  if (mer === "PM" && hour < 12) hour += 12;
  if (mer === "AM" && hour === 12) hour = 0;
  const d = new Date(year, month - 1, day, hour, minute, second);
  return Number.isNaN(d.getTime()) ? null : d;
}

function stripMediaPlaceholders(text: string) {
  return text
    .replace(/<attached:[^>]+>/gi, "")
    .replace(/\u200e?(?:image|video|audio|sticker|gif|document|contact card) omitted/gi, "")
    .trim();
}

function classify(text: string): ChatKind {
  const lower = text.toLowerCase();
  if (SYSTEM_SNIPPETS.some((s) => lower.includes(s))) return "system";
  if (/^(missed )?(voice|video) call|no answer/.test(lower) && text.length < 80) return "call";
  const hasMedia =
    MEDIA_SNIPPETS.some((s) => lower.includes(s)) || /PHOTO-|AUDIO-|STICKER-|VIDEO-/.test(text);
  if (hasMedia) {
    if (stripMediaPlaceholders(text).length >= 2) return "text";
    return "media";
  }
  return "text";
}

export function parseWhatsAppChat(raw: string): ParsedMessage[] {
  const text = normalizeChatText(raw);
  const lines = text.split("\n");
  const messages: ParsedMessage[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    const ios = line.match(IOS);
    const android = ios ? null : line.match(ANDROID);
    const m = ios || android;
    if (!m) {
      if (messages.length) {
        messages[messages.length - 1].text += `\n${line}`;
        messages[messages.length - 1].raw += `\n${line}`;
      }
      continue;
    }
    const [, date, time, ampm, sender, body] = m;
    const cleaned = body.replace(/\s*<this message was edited>\s*/i, "").trim();
    messages.push({
      sentAt: parseDate(date, time, ampm),
      sender: sender.trim(),
      text: cleaned,
      kind: classify(cleaned),
      raw: line,
    });
  }

  return messages;
}

function senderMatch(name: string, hint?: string | null) {
  const n = name.trim().toLowerCase();
  const h = hint?.trim().toLowerCase();
  if (!h) return false;
  return n === h || n.includes(h) || h.includes(n);
}

export function guessPartnerName(
  messages: ParsedMessage[],
  opts: { userName?: string | null; fileName?: string; partnerHint?: string | null } = {},
) {
  const fromFile = opts.fileName?.match(/WhatsApp Chat(?: with| -)?\s*(.+?)(?:\.zip|\.txt)?$/i)?.[1]?.trim();
  const counts = new Map<string, number>();
  for (const m of messages) {
    if (m.kind === "system") continue;
    counts.set(m.sender, (counts.get(m.sender) ?? 0) + 1);
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const names = ranked.map(([name]) => name);

  const hinted = opts.partnerHint
    ? names.find((name) => senderMatch(name, opts.partnerHint))
    : undefined;
  if (hinted) return hinted;

  const fromExport = fromFile ? names.find((name) => senderMatch(name, fromFile)) : undefined;
  if (fromExport) return fromExport;
  if (fromFile) return fromFile;

  const notUser = ranked.find(([name]) => !senderMatch(name, opts.userName));
  return notUser?.[0] || ranked[0]?.[0] || "Partner";
}
