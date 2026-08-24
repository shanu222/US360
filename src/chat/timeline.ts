import type { ParsedMessage } from "@/chat/parse";

export interface ChatTimelineEvent {
  at: string | null;
  event: string;
  situation: string;
  outcome?: string;
}

const RULES: { test: RegExp; event: string; situation: string; outcome?: string }[] = [
  { test: /\b(angry|gussa|argument|fight|upset with)\b/i, event: "Tension or argument in the chat", situation: "CONFLICT" },
  { test: /\b(sorry|i apologize|maafi)\b/i, event: "Apology in the chat", situation: "REPAIR", outcome: "Apology offered" },
  { test: /\b(exam|presentation|orientation)\b/i, event: "Important exam or academic moment mentioned", situation: "EXAM" },
  { test: /\b(birthday|anniversary)\b/i, event: "A personal date was mentioned", situation: "CELEBRATION" },
  { test: /\b(thank you|i appreciate|proud of you)\b/i, event: "Appreciation", situation: "POSITIVE", outcome: "Warm exchange" },
  { test: /\b(i miss you|i love you)\b/i, event: "Affectionate exchange", situation: "POSITIVE" },
  { test: /\b(i (will|promise)|we will)\b/i, event: "A promise or plan", situation: "PROMISE" },
];

export function extractChatTimeline(messages: ParsedMessage[]): ChatTimelineEvent[] {
  const out: ChatTimelineEvent[] = [];
  const seen = new Set<string>();
  for (const m of messages) {
    if (m.kind !== "text" || m.text.length < 8) continue;
    for (const rule of RULES) {
      if (!rule.test.test(m.text)) continue;
      const day = m.sentAt?.toISOString().slice(0, 10) ?? "undated";
      const key = `${day}:${rule.situation}:${rule.event}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        at: m.sentAt?.toISOString() ?? null,
        event: rule.event,
        situation: rule.situation,
        outcome: rule.outcome,
      });
      break;
    }
    if (out.length >= 40) break;
  }
  return out.sort((a, b) => String(a.at).localeCompare(String(b.at)));
}
