export type LifestyleMention = {
  kind: "restaurant" | "dish" | "place" | "plan" | "dislike";
  title: string;
  quote: string;
  city?: string;
  whenHint?: string;
};

const TRY = /\b(?:want to try|wanna try|should try|let's try|lets try|craving|in the mood for)\b(.{0,40})/gi;
const RESTAURANT = /\b(?:restaurant|cafe|café|dhaba|food street)\b/i;
const PLAN = /\b(?:next weekend|this weekend|tonight|tomorrow|let's go to|lets go to|we should go)\b(.{0,50})/gi;
const DISLIKE = /\b(?:don't like|dont like|hate|not a fan of)\b(.{0,30})/gi;

export function extractLifestyleMentions(texts: string[]): LifestyleMention[] {
  const out: LifestyleMention[] = [];
  for (const raw of texts) {
    const text = raw.replace(/\s+/g, " ").trim();
    if (text.length < 8) continue;
    let m: RegExpExecArray | null;
    const tryRe = new RegExp(TRY.source, TRY.flags);
    while ((m = tryRe.exec(text))) {
      const snippet = (m[1] || "").replace(/[.!?].*$/, "").trim();
      if (snippet.length < 3) continue;
      out.push({
        kind: RESTAURANT.test(text) ? "restaurant" : "dish",
        title: snippet.slice(0, 80),
        quote: text.slice(0, 160),
      });
    }
    const planRe = new RegExp(PLAN.source, PLAN.flags);
    while ((m = planRe.exec(text))) {
      const snippet = (m[0] || "").trim();
      if (!RESTAURANT.test(text) && !/\b(park|lake|mall|murree|islamabad|lahore|karachi)\b/i.test(text)) continue;
      out.push({
        kind: "plan",
        title: snippet.slice(0, 80),
        quote: text.slice(0, 160),
        whenHint: /weekend/i.test(text) ? "weekend" : /tonight/i.test(text) ? "tonight" : /tomorrow/i.test(text) ? "tomorrow" : undefined,
      });
    }
    const dislikeRe = new RegExp(DISLIKE.source, DISLIKE.flags);
    while ((m = dislikeRe.exec(text))) {
      const snippet = (m[1] || "").replace(/[.!?].*$/, "").trim();
      if (snippet.length >= 3) out.push({ kind: "dislike", title: snippet.slice(0, 60), quote: text.slice(0, 140) });
    }
  }
  const seen = new Set<string>();
  return out.filter((item) => {
    const key = `${item.kind}:${item.title.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 12);
}
