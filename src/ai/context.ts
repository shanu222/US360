import { db } from "@/lib/db";
import { getPrimaryRelationship } from "@/server/auth";
import { type AIContext } from "@/ai/context-types";

export type { AIContext };
export { contextToPrompt } from "@/ai/context-types";

function seasonFor(date: Date, timezone: string) {
  const month = Number(
    new Intl.DateTimeFormat("en-US", { timeZone: timezone, month: "numeric" }).format(date),
  );
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}

export async function buildAIContext(userId: string): Promise<AIContext> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { settings: true, writingStyle: true },
  });
  if (!user) throw new Error("UNAUTHORIZED");

  const settings = user.settings;
  const relationship = await getPrimaryRelationship(userId);
  const now = new Date();
  const timezone = user.timezone || relationship?.timezone || "UTC";

  const upcoming = relationship
    ? await db.calendarEvent.findMany({
        where: {
          userId,
          startAt: { gte: now, lte: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 21) },
        },
        orderBy: { startAt: "asc" },
        take: 6,
      })
    : [];

  const recentSituations = settings?.aiShareSituations
    ? await db.situation.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 4,
        select: { description: true, status: true },
      })
    : [];

  const recentCards = await db.card.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { category: true, message: true, theme: true },
  });

  const recentMessages = await db.message.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { category: true, content: true },
  });

  const recentReels = await db.reel.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { category: true, notes: true },
  });

  const memories = settings?.aiShareMemories
    ? (relationship?.memories ?? []).slice(0, 12).map((m) => ({
        title: m.title,
        content: m.content.slice(0, 180),
        category: m.category,
      }))
    : [];

  const chatImport = settings?.aiShareMemories
    ? await db.chatImport.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: { analysis: true },
      })
    : null;
  const chatAnalysis = (chatImport?.analysis ?? null) as {
    summary?: string;
    likes?: string[];
    dislikes?: string[];
    topics?: { topic: string; count: number }[];
    communicationStyle?: string[];
  } | null;

  return {
    now: now.toISOString(),
    timezone,
    userName: user.name,
    partnerName: relationship?.partnerName ?? relationship?.partnerNickname,
    relationshipStart: relationship?.startDate?.toISOString() ?? null,
    communicationStyle: relationship?.communicationStyle,
    language: user.language,
    memories,
    favorites: (relationship?.favorites ?? []).slice(0, 16),
    dislikes: (relationship?.dislikes ?? []).slice(0, 10),
    upcomingDates: settings?.aiShareCalendar
      ? upcoming.map((e) => ({
          title: e.title,
          date: e.startAt.toISOString(),
          type: e.type,
        }))
      : [],
    recentSituations: recentSituations.map((s) => ({
      description: s.description.slice(0, 220),
      status: s.status,
    })),
    recentCards: recentCards.map((c) => ({
      category: c.category,
      message: c.message.slice(0, 120),
      theme: c.theme,
    })),
    recentMessages: recentMessages.map((m) => ({
      category: m.category,
      content: m.content.slice(0, 120),
    })),
    recentReels,
    writingStyle: settings?.aiShareStyle ? user.writingStyle?.samples?.slice(0, 600) : null,
    season: seasonFor(now, timezone),
    chatInsights: chatAnalysis
      ? {
          summary: chatAnalysis.summary ?? "",
          likes: (chatAnalysis.likes ?? []).slice(0, 10),
          dislikes: (chatAnalysis.dislikes ?? []).slice(0, 8),
          topics: (chatAnalysis.topics ?? []).slice(0, 8),
          style: (chatAnalysis.communicationStyle ?? []).slice(0, 6),
        }
      : null,
  };
}
