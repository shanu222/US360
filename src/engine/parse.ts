import type { CommandIntent, Emotion, ParsedCommand, Priority, SituationKind } from "@/engine/types";
import { EMOTION_LEXICON } from "@/engine/knowledge/emotions";
import { SITUATION_LEXICON, UNCLEAR_FAULT_PHRASES, USER_FAULT_PHRASES } from "@/engine/knowledge/situations";
import { includesAny, topScored } from "@/engine/score";

function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  d.setHours(10, 0, 0, 0);
  return d;
}

function parseEvent(text: string, now: Date): ParsedCommand["eventHint"] {
  const lower = text.toLowerCase();
  let start = now;
  let type = "EVENT";
  let title = "Plan from command";

  if (/\bbirthday\b/.test(lower)) {
    type = "BIRTHDAY";
    title = "Birthday";
  } else if (/\banniversary\b/.test(lower)) {
    type = "ANNIVERSARY";
    title = "Anniversary";
  } else if (/\bexam|presentation|assignment\b/.test(lower)) {
    type = "EXAM";
    title = "Exam";
  }

  if (/\btoday|aaj\b/.test(lower)) start = addDays(now, 0);
  else if (/\btomorrow|kal\b/.test(lower)) start = addDays(now, 1);
  else if (/\bnext week\b/.test(lower)) start = addDays(now, 7);
  else if (type === "EVENT") return null;

  return { title, type, startAt: start.toISOString() };
}

function quietHours(text: string): number | null {
  const m = text.match(/\b(?:for|in)\s+(\d+)\s*(hour|hours|hr|hrs)\b/i);
  if (m) return Number(m[1]);
  if (/\bdon't remind|dont remind|needs space|give her space\b/i.test(text)) return 3;
  return null;
}

function apologyReason(text: string) {
  const m = text.match(/\bbecause\s+(.+)$/i);
  if (m?.[1]) return m[1].replace(/[.!?].*$/, "").trim().slice(0, 120);
  if (/forgot to call|didn't call|did not call/i.test(text)) return "the missed call";
  if (/forgot her birthday|missed her birthday/i.test(text)) return "missing your birthday";
  if (/i forgot/i.test(text)) return "what I forgot";
  return null;
}

export function parseCommand(raw: string, previous?: ParsedCommand | null, now = new Date()): ParsedCommand {
  const text = raw.replace(/\s+/g, " ").trim();
  const lower = text.toLowerCase();
  const followUp = /^(make it|shorter|simpler|more romantic|use what you know|based on)/i.test(text);
  const base = followUp && previous ? { ...previous, raw: text, followUp: true } : null;

  const emotions = topScored(lower, EMOTION_LEXICON, 3);
  const situations = topScored(lower, SITUATION_LEXICON, 3);

  const wantsCard = /\b(create|make).*(card)|card for|good morning card|motivational card|make something nice\b/i.test(lower);
  const wantsReel = /\b(reel|send her something funny|find a funny|according to this situation)\b/i.test(lower);
  const wantsMessage = /\b(message|text|write|suggest something|what should i (say|do)|apolog|she is angry|she's angry|she is upset|she is sad)\b/i.test(lower);
  const wantsHistory = /\b(previous|usually works|look at (our|the) previous|based on our|what you know)\b/i.test(lower);
  const prepareAll = /\bprepare everything\b/i.test(lower);
  const shouldApologize = /\bshould i apologize|write a short apology|say sorry\b/i.test(lower);
  const giveSpace = /\bneeds space|give her space|don't (send|message|remind)\b/i.test(lower);
  const cheer = /\bcheer her up|make something nice|feeling sad|something i can send\b/i.test(lower);

  const intents: CommandIntent[] = [];
  if (prepareAll) intents.push("PREPARE_EVERYTHING");
  if (wantsCard) intents.push("CREATE_CARD");
  if (wantsReel) intents.push("FIND_REEL");
  if (wantsMessage || shouldApologize) intents.push("SUGGEST_MESSAGE");
  if (giveSpace) intents.push("GIVE_SPACE");
  if (wantsHistory) intents.push("LOOK_HISTORY");
  if (shouldApologize) intents.push("SHOULD_APOLOGIZE");
  if (cheer) intents.push("CHEER_UP");
  if (followUp) intents.push("MODIFY_TONE");
  if (/\bexam|birthday|anniversary|tomorrow|next week\b/.test(lower)) intents.push("SAVE_EVENT");
  if (!intents.length) intents.push(emotions.length || situations.length ? "ADVICE" : "ADVICE");

  const noRomantic = /\bdon'?t send (anything )?romantic|no romantic|not romantic\b/i.test(lower);
  const noFunny = /\bdon'?t (send|joke)|not funny|no joke\b/i.test(lower) || Boolean(emotions.find((e) => e.key === "ANGER" || e.key === "HURT"));
  const wantsFunny = /\bfunny\b/i.test(lower) && !noFunny;
  const wantsRomantic = /\bromantic|good morning|good night|love message\b/i.test(lower) && !noRomantic;

  let urgency: Priority = "MEDIUM";
  if (giveSpace || emotions.some((e) => e.key === "ANGER" || e.key === "HURT" || e.key === "CONFLICT")) urgency = "CRITICAL";
  else if (situations.some((s) => s.key === "EXAM" || s.key === "BIRTHDAY" || s.key === "ANNIVERSARY")) urgency = "HIGH";
  else if (wantsReel && !wantsMessage && !wantsCard) urgency = "LOW";

  const parsed: ParsedCommand = {
    raw: text,
    intents: base ? [...new Set([...base.intents, ...intents])] : intents,
    emotions: emotions.length ? emotions : base?.emotions ?? [],
    situations: situations.length ? situations : base?.situations ?? [],
    primaryEmotion: (emotions[0]?.key ?? base?.primaryEmotion ?? (wantsRomantic ? "ROMANTIC" : "UNKNOWN")) as Emotion,
    primarySituation: (situations[0]?.key ?? base?.primarySituation ?? "UNKNOWN") as SituationKind,
    userFault: includesAny(lower, USER_FAULT_PHRASES) || Boolean(base?.userFault),
    faultUnclear: includesAny(lower, UNCLEAR_FAULT_PHRASES),
    wantsSpace: giveSpace || Boolean(base?.wantsSpace),
    noRomantic: noRomantic || Boolean(base?.noRomantic),
    noFunny: noFunny || Boolean(base?.noFunny),
    wantsFunny: wantsFunny || Boolean(base?.wantsFunny && !noFunny),
    wantsRomantic: wantsRomantic || Boolean(base?.wantsRomantic && !noRomantic),
    wantsCard: wantsCard || Boolean(base?.wantsCard),
    wantsReel: wantsReel || Boolean(base?.wantsReel),
    wantsMessage: wantsMessage || shouldApologize || Boolean(base?.wantsMessage) || intents.includes("ADVICE"),
    wantsHistory: wantsHistory || Boolean(base?.wantsHistory),
    shorter: /\bshort|simple|shorter\b/i.test(lower) || Boolean(base?.shorter),
    simpler: /\bsimple|simpler\b/i.test(lower) || Boolean(base?.simpler),
    moreRomantic: /\bmore romantic\b/i.test(lower) || Boolean(base?.moreRomantic),
    followUp: Boolean(followUp),
    quietHours: quietHours(lower),
    eventHint: parseEvent(lower, now) ?? base?.eventHint ?? null,
    apologyReason: apologyReason(text) ?? base?.apologyReason ?? null,
    achievement: /did well in her exam|passed|got the job/i.test(lower) ? "what you did" : base?.achievement ?? null,
    urgency,
    style: /\bromantic/.test(lower)
      ? "romantic"
      : /\bapolog/.test(lower)
        ? "apology"
        : /\bshort|simple/.test(lower)
          ? "simple"
          : "supportive",
  };

  if (parsed.quietHours) parsed.intents.push("GIVE_SPACE");
  return parsed;
}

export function mergeFollowUp(current: ParsedCommand, previous: ParsedCommand): ParsedCommand {
  return parseCommand(current.raw, previous);
}
