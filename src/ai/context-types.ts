export interface AIContext {
  now: string;
  timezone: string;
  userName?: string | null;
  userGender?: "male" | "female" | null;
  partnerName?: string | null;
  partnerGender?: "male" | "female" | null;
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
  chatInsights?: {
    summary: string;
    likes: string[];
    dislikes: string[];
    topics: { topic: string; count: number }[];
    style: string[];
  } | null;
}

export function contextToPrompt(ctx: AIContext) {
  return `Current context (minimized, user-authorized):
Now: ${ctx.now} (${ctx.timezone}), season: ${ctx.season}
User: ${ctx.userName ?? "the user"}${ctx.userGender ? ` (${ctx.userGender})` : ""}
Partner: ${ctx.partnerName ?? "their partner"}${ctx.partnerGender ? ` (${ctx.partnerGender}; use ${ctx.partnerGender === "male" ? "he/him/his" : "she/her/hers"})` : ""}
Style: ${ctx.communicationStyle ?? "not specified"}
Language: ${ctx.language ?? "en"}
Favorites: ${ctx.favorites.map((f) => `${f.category}: ${f.value}`).join("; ") || "none"}
Dislikes: ${ctx.dislikes.map((d) => d.value).join("; ") || "none"}
Memories: ${ctx.memories.map((m) => `${m.title}: ${m.content}`).join(" | ") || "none"}
Upcoming: ${ctx.upcomingDates.map((d) => `${d.title} (${d.type}) ${d.date}`).join("; ") || "none"}
Recent situations: ${ctx.recentSituations.map((s) => `[${s.status}] ${s.description}`).join(" | ") || "none"}
Recent cards: ${ctx.recentCards.map((c) => `${c.category}/${c.theme}: ${c.message}`).join(" | ") || "none"}
Recent messages: ${ctx.recentMessages.map((m) => m.content).join(" | ") || "none"}
Writing style samples: ${ctx.writingStyle ?? "none"}
WhatsApp chat (deterministic, not AI-read): ${ctx.chatInsights ? `${ctx.chatInsights.summary} Likes: ${ctx.chatInsights.likes.join(", ") || "none"}. Dislikes: ${ctx.chatInsights.dislikes.join(", ") || "none"}. Topics: ${ctx.chatInsights.topics.map((t) => t.topic).join(", ") || "none"}. Style: ${ctx.chatInsights.style.join(", ") || "none"}` : "not imported"}`;
}
