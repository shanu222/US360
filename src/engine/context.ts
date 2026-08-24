import { db } from "@/lib/db";
import { getPrimaryRelationship } from "@/server/auth";
import { foodPrefsFromMap, loadLifestyleMemory } from "@/lifestyle/build";
import type { EngineContext, EngineProfile, HistoryMatch, ParsedCommand } from "@/engine/types";
import { parseGender, voiceFor } from "@/lib/voice";

function pref(map: Map<string, string>, key: string) {
  return map.get(key)?.trim() || undefined;
}

export async function loadEngineContext(userId: string): Promise<EngineContext> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { settings: true },
  });
  if (!user) throw new Error("UNAUTHORIZED");
  const relationship = await getPrimaryRelationship(userId);
  const prefs = new Map((relationship?.preferences ?? []).map((p) => [p.key, p.value]));

  const likes = [
    ...((relationship?.favorites ?? []).filter((f) => ["appreciates", "foods", "flowers"].includes(f.category)).map((f) => f.value)),
    ...(pref(prefs, "foods")?.split(/[,;]/).map((s) => s.trim()) ?? []),
  ].filter(Boolean);

  const partnerGender = parseGender(relationship?.partnerGender);
  const userGender = parseGender(user.gender);
  const voice = voiceFor(partnerGender);

  const profile: EngineProfile = {
    partnerName: relationship?.partnerName || voice.partnerNoun,
    userGender,
    partnerGender,
    personality: pref(prefs, "personality"),
    likes: [...new Set(likes)].slice(0, 12),
    dislikes: (relationship?.dislikes ?? []).map((d) => d.value),
    flowers: pref(prefs, "flowers") || relationship?.favorites.find((f) => f.category === "flowers")?.value,
    colors: pref(prefs, "colors") || relationship?.favorites.find((f) => f.category === "colors")?.value,
    foods: [
      ...(relationship?.favorites ?? []).filter((f) => f.category === "foods").map((f) => f.value),
      ...(pref(prefs, "foods")?.split(/[,;]/).map((s) => s.trim()) ?? []),
    ].filter(Boolean),
    songs: pref(prefs, "songs"),
    movies: pref(prefs, "movies"),
    activities: (relationship?.favorites ?? []).filter((f) => f.category === "activities").map((f) => f.value),
    places: (relationship?.favorites ?? []).filter((f) => f.category === "places").map((f) => f.value),
    gifts: pref(prefs, "gifts"),
    makesHappy: pref(prefs, "makes_happy"),
    upsets: pref(prefs, "upsets"),
    calms: pref(prefs, "calms"),
    apologyStyle: pref(prefs, "apology_style"),
    conflictStyle: pref(prefs, "conflict_style"),
    wantsSpace: /yes|true|space/i.test(pref(prefs, "wants_space") ?? ""),
    messageLength: /long/i.test(pref(prefs, "message_length") ?? "")
      ? "long"
      : /medium/i.test(pref(prefs, "message_length") ?? "")
        ? "medium"
        : "short",
    romanticStyle: pref(prefs, "romantic_style"),
    humor: pref(prefs, "humor"),
    memories: (relationship?.memories ?? []).slice(0, 8).map((m) => m.content.slice(0, 140)),
    promises: (relationship?.memories ?? []).filter((m) => m.category === "PROMISES").map((m) => m.content.slice(0, 140)),
    goals: pref(prefs, "current_goals"),
    concerns: pref(prefs, "current_concerns"),
    communicationStyle: relationship?.communicationStyle || pref(prefs, "communication_style"),
    instagram: pref(prefs, "partner_instagram"),
    whatsapp: pref(prefs, "partner_whatsapp"),
    facebook: pref(prefs, "partner_facebook"),
    email: pref(prefs, "partner_email"),
  };

  const partnerFood = foodPrefsFromMap(prefs, "partner");
  partnerFood.cuisines = [...new Set([...partnerFood.cuisines, ...profile.foods])];
  partnerFood.dishes = [...new Set([...partnerFood.dishes, ...profile.foods])];
  const userFood = foodPrefsFromMap(prefs, "user");

  const now = new Date();
  const [upcoming, recentSituations, recentCards, recentReels, recentMessages] = await Promise.all([
    db.calendarEvent.findMany({
      where: { userId, startAt: { gte: new Date(now.getTime() - 12 * 3600_000) } },
      orderBy: { startAt: "asc" },
      take: 8,
    }),
    db.situation.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { description: true, status: true, createdAt: true },
    }),
    db.card.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { category: true, theme: true, createdAt: true },
    }),
    db.reel.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: { id: true, url: true, category: true, notes: true, favorite: true, createdAt: true },
    }),
    db.message.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { category: true, content: true },
    }),
  ]);

  let history: HistoryMatch[] = [];
  let lastParse: ParsedCommand | null = null;
  try {
    const runs = await db.commandRun.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 40,
      include: { feedback: true },
    });
    const bucket = new Map<string, HistoryMatch>();
    for (const run of runs) {
      const key = `${run.emotion ?? ""}:${run.situation ?? ""}:${run.recommendation ?? ""}`;
      const cur = bucket.get(key) ?? {
        emotion: run.emotion ?? "",
        situation: run.situation ?? "",
        recommendation: run.recommendation ?? "",
        helpfulCount: 0,
        unhelpfulCount: 0,
        note: "",
      };
      if (run.feedback?.helpful) cur.helpfulCount += 1;
      if (run.feedback?.helpful === false || run.feedback?.outcome === "NOT_HELPFUL") cur.unhelpfulCount += 1;
      bucket.set(key, cur);
    }
    history = [...bucket.values()];
    const last = runs[0];
    lastParse = last ? ((last.parsed as unknown as ParsedCommand) ?? null) : null;
  } catch {
    history = [];
  }

  let chat: EngineContext["chat"] = {
    likes: [],
    dislikes: [],
    topics: [],
    style: [],
    timeline: [],
    conflictSignals: 0,
    avgPartnerLength: 0,
    reelQueries: [],
    foods: [],
    activities: [],
  };
  try {
    const imported = await db.chatImport.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    const analysis = (imported?.analysis ?? {}) as {
      summary?: string;
      likes?: string[];
      dislikes?: string[];
      foods?: string[];
      activities?: string[];
      topics?: { topic: string }[];
      communicationStyle?: string[];
      timeline?: EngineContext["chat"]["timeline"];
      conflictSignals?: number;
      reelQueries?: string[];
    };
    const stats = (imported?.stats ?? {}) as { conflictSignals?: number; avgPartnerLength?: number };
    chat = {
      summary: analysis.summary,
      likes: analysis.likes ?? [],
      dislikes: analysis.dislikes ?? [],
      topics: (analysis.topics ?? []).map((t) => t.topic),
      style: analysis.communicationStyle ?? [],
      timeline: analysis.timeline ?? [],
      conflictSignals: analysis.conflictSignals ?? stats.conflictSignals ?? 0,
      avgPartnerLength: stats.avgPartnerLength ?? 0,
      reelQueries: analysis.reelQueries ?? [],
      foods: analysis.foods ?? [],
      activities: analysis.activities ?? [],
    };
    if (chat.likes.length) profile.likes = [...new Set([...profile.likes, ...chat.likes])].slice(0, 12);
    if (chat.dislikes.length) profile.dislikes = [...new Set([...profile.dislikes, ...chat.dislikes])].slice(0, 12);
    if (chat.foods.length) {
      profile.foods = [...new Set([...profile.foods, ...chat.foods])].slice(0, 12);
      partnerFood.dishes = [...new Set([...partnerFood.dishes, ...chat.foods])].slice(0, 12);
    }
    if (chat.activities.length) profile.activities = [...new Set([...profile.activities, ...chat.activities])].slice(0, 12);
    if (/short/i.test(chat.style.join(" ")) && !pref(prefs, "message_length")) profile.messageLength = "short";
  } catch {
    /* import table may be missing in older DBs */
  }

  const result: EngineContext = {
    now,
    quietUntil: user.settings?.quietUntil ?? null,
    profile,
    upcoming: upcoming.map((e) => ({ title: e.title, type: e.type, startAt: e.startAt, notes: e.notes })),
    recentSituations,
    recentCards,
    recentReels,
    recentMessages,
    history,
    lastParse,
    chat,
    city: user.city || pref(prefs, "user_city") || null,
    food: { user: userFood, partner: partnerFood },
    savedVenues: [],
    venueVisits: [],
    pendingLifestyle: [],
  };

  try {
    const memory = await loadLifestyleMemory(userId);
    result.savedVenues = memory.savedVenues.map((s) => ({ venueKey: s.venueKey, name: s.name }));
    result.venueVisits = memory.venueVisits.map((s) => ({ venueKey: s.venueKey }));
    const imported = await db.chatImport.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } });
    const analysis = (imported?.analysis ?? {}) as { pendingLifestyle?: Array<{ title: string; quote: string; kind: string }> };
    result.pendingLifestyle = analysis.pendingLifestyle ?? [];
  } catch {
    /* lifestyle tables may be missing until migrate */
  }

  return result;
}
