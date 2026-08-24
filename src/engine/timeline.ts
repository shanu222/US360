import { db } from "@/lib/db";
import { getLatestChatImport } from "@/chat/queries";

export interface TimelineItem {
  at: string | null;
  event: string;
  situation: string;
  outcome?: string;
  source: string;
}

export async function buildRelationshipTimeline(userId: string): Promise<TimelineItem[]> {
  const items: TimelineItem[] = [];
  const imported = await getLatestChatImport(userId);
  const analysis = (imported?.analysis ?? {}) as {
    timeline?: { at: string | null; event: string; situation: string; outcome?: string }[];
    calendarEvents?: { title: string; at: string; type: string }[];
    notable?: { at: string | null; text: string }[];
  };
  for (const row of analysis.timeline ?? []) {
    items.push({ ...row, source: "whatsapp" });
  }
  for (const ev of analysis.calendarEvents ?? []) {
    items.push({
      at: ev.at,
      event: ev.title,
      situation: ev.type,
      source: "whatsapp-date",
    });
  }

  const [situations, events, cards, commands, memories] = await Promise.all([
    db.situation.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 20 }),
    db.calendarEvent.findMany({ where: { userId }, orderBy: { startAt: "desc" }, take: 20 }),
    db.card.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 12 }),
    db.commandRun.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 20, include: { feedback: true } }).catch(() => []),
    db.relationship.findFirst({
      where: { userId },
      include: { memories: { orderBy: { createdAt: "desc" }, take: 15 } },
    }),
  ]);

  for (const s of situations) {
    items.push({
      at: s.createdAt.toISOString(),
      event: s.description.slice(0, 120),
      situation: s.category || s.status,
      outcome: s.status,
      source: "situation",
    });
  }
  for (const e of events) {
    items.push({
      at: e.startAt.toISOString(),
      event: e.title,
      situation: e.type,
      outcome: e.notes?.slice(0, 80),
      source: "calendar",
    });
  }
  for (const c of cards) {
    items.push({
      at: c.createdAt.toISOString(),
      event: `${c.category.replaceAll("_", " ")} card`,
      situation: c.status,
      source: "card",
    });
  }
  for (const run of commands) {
    items.push({
      at: run.createdAt.toISOString(),
      event: run.command.slice(0, 120),
      situation: run.emotion || "command",
      outcome: run.feedback?.outcome || run.recommendation || undefined,
      source: "command",
    });
  }
  for (const m of memories?.memories ?? []) {
    items.push({
      at: m.createdAt.toISOString(),
      event: m.title,
      situation: m.category,
      outcome: m.content.slice(0, 80),
      source: "memory",
    });
  }

  return items
    .filter((i) => i.at)
    .sort((a, b) => String(b.at).localeCompare(String(a.at)))
    .slice(0, 80);
}
