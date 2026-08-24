import { instagramSearchUrl } from "@/chat/dates";
import type { Emotion, EngineContext, SituationKind } from "@/engine/types";

export type SavedReel = {
  id: string;
  url: string;
  category: string;
  notes?: string | null;
  favorite?: boolean;
  createdAt?: Date;
};

export type PickedReel = {
  id: string;
  url: string;
  category: string;
  reason: string;
  query: string;
  searchUrl: string;
  caption: string;
  fromLibrary: boolean;
};

export type SharePack = {
  caption: string;
  whatsapp: string;
  instagram: string;
  instagramProfile: string | null;
  instagramDm: string | null;
  facebook: string;
  email: string | null;
  missingWhatsapp: boolean;
  missingInstagram: boolean;
  missingEmail: boolean;
};

function unique(values: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const t = v.replace(/\s+/g, " ").trim().toLowerCase();
    if (t.length < 2 || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

export function instagramHandle(value?: string | null) {
  if (!value) return "";
  return value
    .trim()
    .replace(/^@/, "")
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/\/.*$/, "")
    .replace(/[^a-zA-Z0-9._]/g, "");
}

export function facebookHandle(value?: string | null) {
  if (!value) return "";
  return value
    .trim()
    .replace(/^@/, "")
    .replace(/^https?:\/\/(www\.)?(facebook|fb|messenger)\.com\//i, "")
    .replace(/^m\.me\//i, "")
    .replace(/\/.*$/, "")
    .replace(/[^a-zA-Z0-9._]/g, "");
}

export function moodReelQueries(opts: {
  emotion: Emotion;
  situation: SituationKind;
  likes: string[];
  foods: string[];
  topics: string[];
  calms?: string;
  movies?: string;
  songs?: string;
}) {
  const seeds = unique([
    opts.calms ?? "",
    ...opts.likes.slice(0, 3),
    ...opts.foods.slice(0, 2),
    ...opts.topics.slice(0, 2),
    opts.movies ?? "",
    opts.songs ?? "",
  ]).slice(0, 4);
  const like = seeds[0];

  const byMood: Partial<Record<Emotion, string[]>> = {
    ANGER: ["calm couple reel", "soft apology reel", "gentle comfort reel"],
    HURT: ["comforting couple reel", "gentle sorry reel"],
    SADNESS: ["cute comforting reel", "wholesome couple reel", "make her smile reel"],
    STRESS: ["relaxing reel", "calm aesthetic reel"],
    ANXIETY: ["gentle comfort reel", "soft cute reel"],
    HAPPINESS: ["feel good couple reel", "funny cute reel"],
    EXCITEMENT: ["happy couple reel", "celebration reel"],
    LOVE: ["romantic cute reel", "thinking of you reel"],
    MISSING: ["miss you cute reel", "romantic couple reel"],
    CELEBRATION: ["congratulations reel", "proud of you reel"],
    SUPPORT: ["you got this reel", "cute support reel"],
    CONFLICT: ["calm down together reel"],
    DISAPPOINTMENT: ["gentle comfort reel"],
  };

  const mood =
    opts.situation === "EXAM"
      ? ["exam good luck reel", "you got this reel"]
      : byMood[opts.emotion] ?? ["cute couple reel"];

  const personal = like ? [`${like} reel`, `${like} cute reel`] : [];
  return unique([...personal, ...mood, "cute wholesome reel"]).slice(0, 6);
}

export function pickBestReel(opts: {
  category: string | null;
  emotion: Emotion;
  situation: SituationKind;
  reels: SavedReel[];
  likes: string[];
  foods: string[];
  topics: string[];
  dislikes: string[];
  calms?: string;
  movies?: string;
  songs?: string;
  reelQueries?: string[];
  partnerName: string;
}): PickedReel | null {
  const queries = unique([
    ...(opts.reelQueries ?? []).slice(0, 4),
    ...moodReelQueries(opts),
  ]);
  const query = queries[0] ?? "cute couple reel";
  const search = instagramSearchUrl(query);
  const haySeeds = unique([...opts.likes, ...opts.foods, ...opts.topics, opts.calms ?? "", query]);
  const avoid = unique(opts.dislikes);
  const heat = ["ANGER", "HURT", "CONFLICT"].includes(opts.emotion);

  let best: { reel: SavedReel; score: number } | null = null;
  for (const reel of opts.reels) {
    const blob = `${reel.category} ${reel.notes ?? ""} ${reel.url}`.toLowerCase();
    if (avoid.some((d) => d.length > 2 && blob.includes(d))) continue;
    let score = 0;
    if (opts.category && reel.category === opts.category) score += 40;
    else if (heat && reel.category === "FUNNY") score -= 40;
    else if (heat && (reel.category === "CUTE" || reel.category === "SORRY")) score += 28;
    else if (reel.category === "CUTE") score += 12;
    if (reel.favorite) score += 16;
    if (haySeeds.some((s) => s.length > 2 && blob.includes(s))) score += 24;
    if (opts.calms && blob.includes(opts.calms.toLowerCase())) score += 20;
    score += Math.max(0, 8 - opts.reels.indexOf(reel));
    if (!best || score > best.score) best = { reel, score };
  }

  const caption =
    heat
      ? `Thinking of you.`
      : opts.emotion === "SADNESS" || opts.emotion === "STRESS"
        ? `This made me think of you.`
        : `For you.`;

  if (best && best.score >= 12) {
    const personal = haySeeds.find((s) => `${best!.reel.notes ?? ""} ${best!.reel.category}`.toLowerCase().includes(s));
    return {
      id: best.reel.id,
      url: best.reel.url,
      category: best.reel.category,
      reason: personal
        ? `Instagram search + her chat — this saved URL still fits ${personal}.`
        : `A situational Instagram search from her likes and this mood. No library required.`,
      query,
      searchUrl: search.search,
      caption,
      fromLibrary: true,
    };
  }

  return {
    id: "search",
    url: search.search,
    category: opts.category ?? "CUTE",
    reason: `Instagram search for “${query}” — from her likes, the chat export, and this situation. You do not need a saved library.`,
    query,
    searchUrl: search.search,
    caption,
    fromLibrary: false,
  };
}

export function buildSharePack(opts: {
  reelUrl: string;
  caption: string;
  instagram?: string | null;
  whatsapp?: string | null;
  facebook?: string | null;
  email?: string | null;
}): SharePack {
  const body = [opts.caption, opts.reelUrl].filter(Boolean).join("\n");
  const encoded = encodeURIComponent(body);
  const wa = (opts.whatsapp ?? "").replace(/[^\d]/g, "");
  const ig = instagramHandle(opts.instagram);
  const fb = facebookHandle(opts.facebook);
  const mail = (opts.email ?? "").trim();
  return {
    caption: body,
    whatsapp: wa.length >= 10 ? `https://wa.me/${wa}?text=${encoded}` : `https://wa.me/?text=${encoded}`,
    instagram: opts.reelUrl,
    instagramProfile: ig ? `https://www.instagram.com/${ig}/` : null,
    instagramDm: ig ? `https://ig.me/m/${ig}` : null,
    facebook: fb
      ? `https://www.facebook.com/${fb}`
      : `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(opts.reelUrl)}`,
    email: mail ? `mailto:${mail}?subject=${encodeURIComponent("For you")}&body=${encoded}` : null,
    missingWhatsapp: wa.length < 10,
    missingInstagram: !ig,
    missingEmail: !mail,
  };
}
