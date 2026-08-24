export interface AIContext {
  now: string;
  timezone: string;
  userName?: string | null;
  partnerName?: string | null;
  relationshipStart?: string | null;
  communicationStyle?: string | null;
  language?: string | null;
  memories: { title: string; content: string; category: string }[];
  favorites: { category: string; value: string }[];
  dislikes: { category: string; value: string }[];
  upcomingDates: { title: string; date: string; type: string }[];
  recentSituations: { description: string; status: string }[];
  recentCards: { category: string; message: string; theme: string }[];
  recentMessages: { category: string; content: string }[];
  recentReels: { category: string; notes?: string | null }[];
  writingStyle?: string | null;
  season: string;
}

export function contextToPrompt(ctx: AIContext) {
  return `Current context (minimized, user-authorized):
Now: ${ctx.now} (${ctx.timezone}), season: ${ctx.season}
User: ${ctx.userName ?? "the user"}
Partner: ${ctx.partnerName ?? "their partner"}
Style: ${ctx.communicationStyle ?? "not specified"}
Language: ${ctx.language ?? "en"}
Favorites: ${ctx.favorites.map((f) => `${f.category}: ${f.value}`).join("; ") || "none"}
Dislikes: ${ctx.dislikes.map((d) => d.value).join("; ") || "none"}
Memories: ${ctx.memories.map((m) => `${m.title}: ${m.content}`).join(" | ") || "none"}
Upcoming: ${ctx.upcomingDates.map((d) => `${d.title} (${d.type}) ${d.date}`).join("; ") || "none"}
Recent situations: ${ctx.recentSituations.map((s) => `[${s.status}] ${s.description}`).join(" | ") || "none"}
Recent cards: ${ctx.recentCards.map((c) => `${c.category}/${c.theme}: ${c.message}`).join(" | ") || "none"}
Recent messages: ${ctx.recentMessages.map((m) => m.content).join(" | ") || "none"}
Writing style samples: ${ctx.writingStyle ?? "none"}`;
}
