import { MESSAGE_TEMPLATES } from "@/engine/knowledge/messages";
import type { EngineProfile, ParsedCommand } from "@/engine/types";

function pick<T>(items: T[], shorter: boolean) {
  if (!items.length) return null;
  if (shorter) return items.find((i) => (i as { length?: string }).length === "short") ?? items[0];
  return items[Math.min(items.length - 1, 1)] ?? items[0];
}

export function fillTemplate(
  body: string,
  vars: Record<string, string | undefined | null>,
) {
  return body.replace(/\{([A-Z_]+)\}/g, (_, key: string) => {
    const value = vars[key]?.trim();
    if (!value) {
      if (key === "NAME") return "you";
      if (key === "FAVORITE_THING") return "something you like";
      if (key === "POSITIVE_WISH") return "a little ease";
      if (key === "APPRECIATION_POINT") return "you already matter in the ordinary hours";
      if (key === "PERSONAL_DETAIL") return "the way you show up";
      if (key === "APOLOGY_REASON") return "what happened";
      if (key === "ACHIEVEMENT") return "this";
      if (key === "EVENT") return "today";
      if (key === "MEMORY") return "what we already share";
      return "";
    }
    return value;
  });
}

export function composeMessage(parsed: ParsedCommand, profile: EngineProfile, messageKey: string) {
  const pool = MESSAGE_TEMPLATES.filter((t) => t.key === messageKey);
  const fallback = MESSAGE_TEMPLATES.filter((t) => t.tone === (parsed.style === "apology" ? "apology" : parsed.style === "romantic" ? "romantic" : "supportive"));
  const chosen = pick(pool.length ? pool : fallback, parsed.shorter || profile.messageLength === "short");
  const body = chosen?.body ?? "I'm here. Tell me if you want space or a short note.";
  const favorite = profile.foods[0] || profile.likes[0] || profile.flowers;
  return fillTemplate(body, {
    NAME: profile.partnerName.split(" ")[0],
    EVENT: parsed.eventHint?.title ?? "this",
    MEMORY: profile.memories[0],
    FAVORITE_THING: favorite,
    APOLOGY_REASON: parsed.apologyReason,
    ACHIEVEMENT: parsed.achievement ?? parsed.eventHint?.title,
    PERSONAL_DETAIL: profile.makesHappy || favorite || profile.personality,
    POSITIVE_WISH: profile.makesHappy || "a kinder day",
    APPRECIATION_POINT: profile.likes[0] || "you already do",
  }).replace(/\s{2,}/g, " ").trim();
}
