export type Gender = "male" | "female";

export function parseGender(value?: string | null): Gender | null {
  const v = (value ?? "").trim().toLowerCase();
  if (v === "male" || v === "female") return v;
  return null;
}

export function oppositeGender(gender: Gender): Gender {
  return gender === "male" ? "female" : "male";
}

export interface PartnerVoice {
  gender: Gender | null;
  they: string;
  They: string;
  them: string;
  Them: string;
  their: string;
  Their: string;
  partnerNoun: string;
}

export function voiceFor(gender?: string | null): PartnerVoice {
  const g = parseGender(gender);
  if (g === "male") {
    return {
      gender: g,
      they: "he",
      They: "He",
      them: "him",
      Them: "Him",
      their: "his",
      Their: "His",
      partnerNoun: "him",
    };
  }
  if (g === "female") {
    return {
      gender: g,
      they: "she",
      They: "She",
      them: "her",
      Them: "Her",
      their: "her",
      Their: "Her",
      partnerNoun: "her",
    };
  }
  return {
    gender: null,
    they: "your partner",
    They: "Your partner",
    them: "your partner",
    Them: "Your partner",
    their: "your partner's",
    Their: "Your partner's",
    partnerNoun: "your partner",
  };
}

const OBJECT_BEFORE = new Set([
  "ask",
  "asking",
  "give",
  "giving",
  "wish",
  "wishing",
  "send",
  "sending",
  "tell",
  "telling",
  "call",
  "calling",
  "make",
  "making",
  "cheer",
  "help",
  "helping",
  "love",
  "miss",
  "hug",
  "text",
  "message",
  "remind",
  "find",
  "finding",
  "bring",
  "show",
  "leave",
  "leaving",
  "hurt",
  "fix",
  "fixing",
  "support",
  "thank",
  "let",
  "need",
  "needs",
  "crowd",
  "crowding",
  "flood",
  "flooding",
  "name",
  "names",
  "named",
  "see",
  "meet",
  "visit",
  "reach",
  "pressure",
  "push",
  "want",
  "wants",
  "around",
  "without",
  "for",
  "to",
  "with",
  "from",
  "at",
  "on",
  "about",
  "after",
  "before",
  "of",
  "and",
  "or",
  "than",
  "if",
]);

const OBJECT_AFTER = new Set([
  "some",
  "a",
  "an",
  "the",
  "to",
  "now",
  "later",
  "well",
  "good",
  "space",
  "time",
  "alone",
  "up",
  "out",
  "in",
  "on",
  "with",
  "for",
  "about",
  "if",
  "when",
  "before",
  "after",
  "first",
  "this",
  "that",
  "it",
  "me",
  "you",
  "today",
  "tomorrow",
]);

function chooseHimHis(before: string | undefined, after: string | undefined, cap: boolean) {
  const b = (before ?? "").toLowerCase().replace(/[^a-z-]/g, "");
  const a = (after ?? "").toLowerCase().replace(/[^a-z-]/g, "");
  if (!a || OBJECT_BEFORE.has(b) || OBJECT_AFTER.has(a)) return cap ? "Him" : "him";
  return cap ? "His" : "his";
}

/** Rewrite female-default copy to match a male partner. Female / unset copy is left unchanged. */
export function genderedCopy(text: string, partnerGender?: string | null): string {
  if (!text || parseGender(partnerGender) !== "male") return text;

  let s = text
    .replace(/\bShe's\b/g, "He's")
    .replace(/\bshe's\b/g, "he's")
    .replace(/\bShe\b/g, "He")
    .replace(/\bshe\b/g, "he")
    .replace(/\bHers\b/g, "His")
    .replace(/\bhers\b/g, "his");

  s = s.replace(/\bHer\b/g, (_match, offset: number, full: string) => {
    const after = full.slice(offset + 3).match(/^\s+(\S+)/)?.[1];
    const before = full.slice(0, offset).match(/(\S+)\s+$/)?.[1];
    return chooseHimHis(before, after, true);
  });
  s = s.replace(/\bher\b/g, (_match, offset: number, full: string) => {
    const after = full.slice(offset + 3).match(/^\s*(\S*)/)?.[1];
    const before = full.slice(0, offset).match(/(\S+)\s+$/)?.[1];
    return chooseHimHis(before, after, false);
  });
  return s;
}

export function voiceDeep<T>(value: T, partnerGender?: string | null): T {
  if (parseGender(partnerGender) !== "male") return value;
  if (typeof value === "string") return genderedCopy(value, partnerGender) as T;
  if (Array.isArray(value)) return value.map((item) => voiceDeep(item, partnerGender)) as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      out[key] = voiceDeep(item, partnerGender);
    }
    return out as T;
  }
  return value;
}

export function commandExamples(partnerGender?: string | null): string[] {
  const v = voiceFor(partnerGender ?? "female");
  return [
    `${v.They} is angry.`,
    `${v.They} is sad today.`,
    `${v.They} is stressed.`,
    "Should I apologize?",
    "We just had a fight.",
    `${v.They} has an exam tomorrow.`,
    `I want to make ${v.them} smile.`,
  ];
}
