export function scorePhrases(text: string, groups: { phrases: string[]; weight: number }[]) {
  const hay = ` ${text.toLowerCase()} `;
  let score = 0;
  const hits: string[] = [];
  for (const group of groups) {
    for (const phrase of group.phrases) {
      if (hay.includes(phrase.toLowerCase())) {
        score += group.weight;
        hits.push(phrase);
        break;
      }
    }
  }
  return { score, hits };
}

export function topScored<T extends string>(
  text: string,
  lexicon: Record<T, { phrases: string[]; weight: number }[]>,
  min = 3,
): { key: T; score: number }[] {
  const out: { key: T; score: number }[] = [];
  for (const key of Object.keys(lexicon) as T[]) {
    const { score } = scorePhrases(text, lexicon[key] ?? []);
    if (score >= min) out.push({ key, score });
  }
  return out.sort((a, b) => b.score - a.score);
}

export function includesAny(text: string, phrases: string[]) {
  const hay = text.toLowerCase();
  return phrases.some((p) => hay.includes(p));
}
