import { guessPartnerName, type ParsedMessage } from "@/chat/parse";
import { extractChatCalendar, reelQueriesFromChat } from "@/chat/dates";
import { extractChatTimeline } from "@/chat/timeline";

export interface ExtractedFact {
  title: string;
  content: string;
  category: "FAVORITES" | "LIKES" | "DISLIKES" | "IMPORTANT" | "MEMORIES" | "PROMISES" | "GOALS" | "PREFERENCES" | "GENERAL";
  importance: "LOW" | "MEDIUM" | "HIGH";
}

export interface ChatAnalysis {
  partnerName: string;
  userSender: string | null;
  firstAt: string | null;
  lastAt: string | null;
  messageCount: number;
  textCount: number;
  mediaCount: number;
  callCount: number;
  systemCount: number;
  bySender: { name: string; count: number; share: number }[];
  hourHistogram: number[];
  weekdayHistogram: number[];
  mediaBreakdown: { photos: number; audio: number; stickers: number; video: number; other: number };
  initiatedByPartnerDays: number;
  initiatedByUserDays: number;
  avgUserLength: number;
  avgPartnerLength: number;
  emojiShare: number;
  urduShare: number;
  goodMorningCount: number;
  goodNightCount: number;
  missYouCount: number;
  conflictSignals: number;
  communicationStyle: string[];
  likes: string[];
  dislikes: string[];
  foods: string[];
  places: string[];
  activities: string[];
  familyMentions: string[];
  boundaries: string[];
  dates: { title: string; hint: string; type: string; at?: string }[];
  promises: string[];
  topics: { topic: string; count: number }[];
  facts: ExtractedFact[];
  writingSamples: string[];
  notable: { at: string | null; sender: string; text: string }[];
  calendarEvents: { title: string; at: string; type: string; hint: string; quote: string }[];
  reelQueries: string[];
  timeline: { at: string | null; event: string; situation: string; outcome?: string }[];
  summary: string;
}

const FOODS = [
  "chai", "tea", "coffee", "nashta", "breakfast", "biryani", "pizza", "burger", "pasta",
  "grocery", "rice", "roti", "paratha", "nihari", "karahi", "dessert", "cake", "chocolate",
  "ice cream", "mango", "apple", "juice", "water", "dinner", "lunch", "samosa", "nihari",
];
const PLACES = [
  "class", "university", "uni", "office", "home", "hostel", "campus", "market", "mall",
  "hospital", "clinic", "masjid", "mosque", "park", "airport",
];
const ACTIVITIES = [
  "orientation", "exam", "class", "grocery", "call", "workout", "gym", "study",
  "assignment", "presentation", "shopping", "drive",
];
const TOPICS = [
  "smoking", "trust", "marriage", "future", "work", "class", "family", "time", "care",
  "respect", "habit", "money", "job", "study", "health", "sleep", "block", "call",
];
const FAMILY = ["ammi", "abu", "mama", "papa", "mom", "dad", "bhai", "sister", "family", "didi"];

const EMOJI = /\p{Extended_Pictographic}/gu;
const URDU = /[\u0600-\u06FF]/g;
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function clip(value: string, max = 140) {
  const v = value.replace(/\s+/g, " ").trim();
  return v.length > max ? `${v.slice(0, max - 1).trim()}…` : v;
}

function unique(items: string[], max = 12) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const key = item.toLowerCase();
    if (key.length < 2 || seen.has(key)) continue;
    seen.add(key);
    out.push(item.trim());
    if (out.length >= max) break;
  }
  return out;
}

function pull(regex: RegExp, texts: string[]) {
  const found: string[] = [];
  for (const t of texts) {
    const r = new RegExp(regex.source, regex.flags.includes("g") ? regex.flags : `${regex.flags}g`);
    let m: RegExpExecArray | null;
    while ((m = r.exec(t))) {
      const value = (m[1] || m[0]).replace(/["""']/g, "").trim();
      if (value.length >= 2 && value.length <= 80) found.push(value);
    }
  }
  return found;
}

function isUsefulPhrase(value: string) {
  const v = value.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
  if (v.length < 3 || v.length > 60) return false;
  if (/^(her|him|you|this|that|it|me|us|them|my|your)$/i.test(v)) return false;
  if (/^(this|that|the|a|an|my|your)\s+\w{1,8}$/i.test(v)) return false;
  return true;
}

function wordHits(words: string[], haystack: string) {
  return words.filter((w) => new RegExp(`\\b${w}\\b`, "i").test(haystack));
}

function isPartnerSender(sender: string, partnerName: string) {
  const s = sender.toLowerCase();
  const p = partnerName.toLowerCase();
  const first = p.split(" ")[0] || "";
  return s === p || (first.length > 2 && (s === first || s.startsWith(`${first} `)));
}

function peakIndex(hist: number[]) {
  return hist.indexOf(Math.max(0, ...hist));
}

export function analyzeWhatsAppChat(
  messages: ParsedMessage[],
  opts: { userName?: string | null; fileName?: string; partnerHint?: string | null } = {},
): ChatAnalysis {
  const partnerName = guessPartnerName(messages, opts);
  const senders = new Map<string, number>();
  const hourHistogram = Array.from({ length: 24 }, () => 0);
  const weekdayHistogram = Array.from({ length: 7 }, () => 0);
  const topicHits = new Map<string, number>();
  const partnerTexts: string[] = [];
  const userTexts: string[] = [];
  const facts: ExtractedFact[] = [];
  const notable: ChatAnalysis["notable"] = [];
  const firstByDay = new Map<string, string>();
  const mediaBreakdown = { photos: 0, audio: 0, stickers: 0, video: 0, other: 0 };
  const bumpMedia = (text: string) => {
    const t = text.toUpperCase();
    if (t.includes("PHOTO-") || /image omitted/i.test(text)) mediaBreakdown.photos += 1;
    else if (t.includes("AUDIO-") || /audio omitted/i.test(text)) mediaBreakdown.audio += 1;
    else if (t.includes("STICKER-") || /sticker omitted/i.test(text)) mediaBreakdown.stickers += 1;
    else if (t.includes("VIDEO-") || /video omitted/i.test(text)) mediaBreakdown.video += 1;
    else mediaBreakdown.other += 1;
  };
  let mediaCount = 0;
  let callCount = 0;
  let systemCount = 0;
  let textCount = 0;
  let emojiChars = 0;
  let urduChars = 0;
  let letterChars = 0;
  let goodMorningCount = 0;
  let goodNightCount = 0;
  let missYouCount = 0;
  let conflictSignals = 0;
  let firstAt: Date | null = null;
  let lastAt: Date | null = null;

  for (const m of messages) {
    senders.set(m.sender, (senders.get(m.sender) ?? 0) + 1);
    if (m.sentAt) {
      if (!firstAt || m.sentAt < firstAt) firstAt = m.sentAt;
      if (!lastAt || m.sentAt > lastAt) lastAt = m.sentAt;
      hourHistogram[m.sentAt.getHours()] += 1;
      weekdayHistogram[m.sentAt.getDay()] += 1;
      const dayKey = `${m.sentAt.getFullYear()}-${m.sentAt.getMonth()}-${m.sentAt.getDate()}`;
      if (!firstByDay.has(dayKey)) firstByDay.set(dayKey, m.sender);
    }
    if (m.kind === "media") {
      mediaCount += 1;
      bumpMedia(m.text);
    } else if (m.kind === "call") callCount += 1;
    else if (m.kind === "system") systemCount += 1;
    else {
      textCount += 1;
      if (/<attached:|omitted|PHOTO-|AUDIO-|STICKER-|VIDEO-/.test(m.text)) {
        mediaCount += 1;
        bumpMedia(m.text);
      }
    }

    const lower = m.text.toLowerCase();
    emojiChars += m.text.match(EMOJI)?.length ?? 0;
    urduChars += m.text.match(URDU)?.length ?? 0;
    letterChars += m.text.replace(/\s/g, "").length;
    if (/good morning|subah bakhair|subha bakhair/.test(lower)) goodMorningCount += 1;
    if (/good night|shab bakhair|shabba khair/.test(lower)) goodNightCount += 1;
    if (/miss you|i miss u|\byaad\b/.test(lower)) missYouCount += 1;
    if (/block|disappoint|disrespect|leave me|don't talk|dont talk|don't call|angry|hate this|fight/.test(lower)) {
      conflictSignals += 1;
    }
    for (const topic of TOPICS) {
      if (lower.includes(topic)) topicHits.set(topic, (topicHits.get(topic) ?? 0) + 1);
    }

    const partner = isPartnerSender(m.sender, partnerName);
    if (m.kind === "text") {
      if (partner) partnerTexts.push(m.text);
      else userTexts.push(m.text);
    }

    if (m.kind === "text" && m.text.length > 40 && /care|trust|marry|love|class|orientation|exam|promise|respect/.test(lower)) {
      notable.push({ at: m.sentAt?.toISOString() ?? null, sender: m.sender, text: clip(m.text, 180) });
    }
  }

  const allJoined = `${partnerTexts.join(" \n ")} \n ${userTexts.join(" \n ")}`;
  const partnerJoined = partnerTexts.join(" \n ");

  const likes = unique([
    ...pull(/\bi (?:really )?like ([^.!?\n]{3,60})/gi, partnerTexts).filter(isUsefulPhrase),
    ...pull(/\bi love (?!you\b)([^.!?\n]{3,60})/gi, partnerTexts).filter(isUsefulPhrase),
    ...pull(/(?:favourite|favorite)[s]?\s+(?:is|are|:)?\s*([^.!?\n]{3,50})/gi, partnerTexts).filter(isUsefulPhrase),
    ...wordHits(FOODS, partnerJoined),
  ]);
  const dislikes = unique([
    ...pull(/\bi (?:don't|do not|dont) like ([^.!?\n]{3,60})/gi, partnerTexts),
    ...pull(/\bi hate ([^.!?\n]{3,60})/gi, partnerTexts),
    ...pull(/\b(?:don't|dont|do not) (?:want|need) ([^.!?\n]{3,60})/gi, partnerTexts),
    ...pull(/\bneed ([^.!?\n]{3,50}) around me/gi, partnerTexts),
    ...(/(healthy habits|no bad thing|nothing wrong)/i.test(partnerJoined) ? ["unhealthy habits around her"] : []),
    ...(/(disrespect|disappointing)/i.test(partnerJoined) ? ["feeling disrespected or dismissed"] : []),
  ]);
  const boundaries = unique([
    ...pull(/\b(?:don't|dont|do not) ([^.!?\n]{3,70})/gi, partnerTexts),
    ...pull(/\bi need you to ([^.!?\n]{3,70})/gi, partnerTexts),
  ], 8);

  const foods = unique(wordHits(FOODS, allJoined));
  const places = unique(wordHits(PLACES, allJoined));
  const activities = unique(wordHits(ACTIVITIES, allJoined));
  const familyMentions = unique(wordHits(FAMILY, allJoined), 8);

  const calendar = extractChatCalendar(messages);
  const dates: ChatAnalysis["dates"] = calendar.map((e) => ({
    title: e.title,
    hint: e.hint,
    type: e.type,
    at: e.startAt.toISOString(),
  }));
  if (/marry|nikah|shaadi/.test(allJoined) && !dates.some((d) => /nikah|shaadi|marry/i.test(d.title))) {
    dates.push({ title: "Marriage intention", hint: "Marriage was discussed in the chat — not a scheduled date.", type: "CUSTOM" });
  }

  const promises = unique(pull(/\b(?:i (?:will|promise)|we will) ([^.!?\n]{3,80})/gi, userTexts), 8);

  for (const like of likes.slice(0, 8)) {
    facts.push({
      title: `Likes: ${like}`,
      content: `From the WhatsApp chat, ${partnerName} appears to like ${like}.`,
      category: "LIKES",
      importance: "MEDIUM",
    });
  }
  for (const d of dislikes.slice(0, 8)) {
    facts.push({
      title: `Dislike: ${d}`,
      content: `From the WhatsApp chat, ${partnerName} expressed dislike or a boundary around: ${d}.`,
      category: "DISLIKES",
      importance: "HIGH",
    });
  }
  for (const b of boundaries.slice(0, 5)) {
    facts.push({
      title: "Boundary from chat",
      content: `${partnerName} wrote that you should not / she needs: ${b}`,
      category: "PREFERENCES",
      importance: "HIGH",
    });
  }
  for (const p of promises.slice(0, 6)) {
    facts.push({
      title: "Promise from you",
      content: `You wrote that you will ${p}`,
      category: "PROMISES",
      importance: "HIGH",
    });
  }
  if (firstAt && lastAt) {
    facts.push({
      title: "Chat history span",
      content: `This exported chat runs from ${firstAt.toLocaleDateString()} to ${lastAt.toLocaleDateString()}.`,
      category: "MEMORIES",
      importance: "LOW",
    });
  }

  const total = messages.length || 1;
  const bySender = [...senders.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count, share: Math.round((count / total) * 100) }));

  const userSender =
    bySender.find((s) => isPartnerSender(s.name, partnerName) === false)?.name ??
    bySender.find((s) => s.name !== partnerName)?.name ??
    null;

  const userMsg = messages.filter((m) => m.sender === userSender && m.kind === "text");
  const partnerMsg = messages.filter((m) => isPartnerSender(m.sender, partnerName) && m.kind === "text");
  const avgUserLength = userMsg.length ? Math.round(userMsg.reduce((a, m) => a + m.text.length, 0) / userMsg.length) : 0;
  const avgPartnerLength = partnerMsg.length
    ? Math.round(partnerMsg.reduce((a, m) => a + m.text.length, 0) / partnerMsg.length)
    : 0;

  const initiatedByPartnerDays = [...firstByDay.values()].filter((s) => isPartnerSender(s, partnerName)).length;
  const initiatedByUserDays = firstByDay.size - initiatedByPartnerDays;

  const communicationStyle: string[] = [];
  if (avgUserLength < 40) communicationStyle.push("Short messages");
  else if (avgUserLength > 90) communicationStyle.push("Emotional");
  else communicationStyle.push("Simple");
  if (goodMorningCount > 3) communicationStyle.push("Romantic");
  if (emojiChars / Math.max(letterChars, 1) > 0.02) communicationStyle.push("Playful");
  if (urduChars / Math.max(letterChars, 1) > 0.04) communicationStyle.push("Bilingual");
  if (mediaCount > textCount * 0.15) communicationStyle.push("Visual (photos, voice, stickers)");

  const writingSamples = unique(
    userMsg
      .filter((m) => m.text.length > 20 && m.text.length < 220)
      .sort((a, b) => b.text.length - a.text.length)
      .map((m) => m.text),
    8,
  );

  const peakHour = peakIndex(hourHistogram);
  const peakDay = peakIndex(weekdayHistogram);
  facts.push({
    title: "When you two talk",
    content: `Most messages land around ${peakHour}:00, especially on ${WEEKDAYS[peakDay] ?? "weekdays"}. ${partnerName} started the day ${initiatedByPartnerDays} times; you started ${initiatedByUserDays} days.`,
    category: "PREFERENCES",
    importance: "MEDIUM",
  });

  const summary = [
    `Read ${messages.length.toLocaleString()} WhatsApp lines with ${partnerName}.`,
    firstAt && lastAt ? `Span: ${firstAt.toLocaleDateString()} – ${lastAt.toLocaleDateString()}.` : "",
    `Most active: ${WEEKDAYS[peakDay] ?? ""} ${peakHour}:00.`,
    goodMorningCount ? `${goodMorningCount} good-morning notes.` : "",
    goodNightCount ? `${goodNightCount} good-night notes.` : "",
    mediaCount ? `${mediaCount} photos, voice notes, stickers, or videos referenced.` : "",
    conflictSignals ? `${conflictSignals} tense or boundary-setting lines were flagged for your awareness — not as a verdict.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    partnerName,
    userSender,
    firstAt: firstAt?.toISOString() ?? null,
    lastAt: lastAt?.toISOString() ?? null,
    messageCount: messages.length,
    textCount,
    mediaCount,
    callCount,
    systemCount,
    bySender,
    hourHistogram,
    weekdayHistogram,
    mediaBreakdown,
    initiatedByPartnerDays,
    initiatedByUserDays,
    avgUserLength,
    avgPartnerLength,
    emojiShare: letterChars ? Number((emojiChars / letterChars).toFixed(4)) : 0,
    urduShare: letterChars ? Number((urduChars / letterChars).toFixed(4)) : 0,
    goodMorningCount,
    goodNightCount,
    missYouCount,
    conflictSignals,
    communicationStyle: unique(communicationStyle, 6),
    likes,
    dislikes,
    foods,
    places,
    activities,
    familyMentions,
    boundaries,
    dates,
    promises,
    topics: [...topicHits.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([topic, count]) => ({ topic, count })),
    facts,
    writingSamples,
    notable: notable.slice(0, 25),
    calendarEvents: calendar.map((e) => ({
      title: e.title,
      at: e.startAt.toISOString(),
      type: e.type,
      hint: e.hint,
      quote: e.quote,
    })),
    reelQueries: reelQueriesFromChat({ likes, foods, activities, topics: [...topicHits.entries()].map(([topic, count]) => ({ topic, count })), places }),
    timeline: extractChatTimeline(messages),
    summary,
  };
}
