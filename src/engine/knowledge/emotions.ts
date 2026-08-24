import type { Emotion, WeightedPhrase } from "@/engine/types";

export const EMOTION_LEXICON: Record<Emotion, WeightedPhrase[]> = {
  ANGER: [
    { phrases: ["angry", "mad at me", "furious", "pissed", "gussa", "she is angry", "she's angry"], weight: 5 },
    { phrases: ["upset with me", "she is upset", "she's upset", "naraaz"], weight: 4 },
    { phrases: ["yelled", "shouting", "screaming", "snapped"], weight: 3 },
  ],
  HURT: [
    { phrases: ["hurt her", "she is hurt", "she's hurt", "heartbroken", "felt ignored"], weight: 5 },
    { phrases: ["disappointed in me", "let her down", "broke her trust"], weight: 4 },
  ],
  SADNESS: [
    { phrases: ["sad", "crying", "udaas", "dukhi", "down today", "feeling low"], weight: 5 },
    { phrases: ["not okay", "having a hard day", "bad day"], weight: 3 },
  ],
  STRESS: [
    { phrases: ["stressed", "pareshan", "overwhelmed", "pressure", "burnt out"], weight: 5 },
    { phrases: ["this week has been heavy", "too much on her plate"], weight: 3 },
  ],
  ANXIETY: [
    { phrases: ["anxious", "worried", "nervous", "panic", "can't sleep"], weight: 4 },
  ],
  DISAPPOINTMENT: [
    { phrases: ["disappointed", "expected me to", "i forgot", "i didn't show up"], weight: 4 },
  ],
  CONFUSION: [
    { phrases: ["confused", "doesn't know what to think", "mixed signals", "misunderstood"], weight: 4 },
  ],
  HAPPINESS: [
    { phrases: ["happy", "khush", "smiling", "good mood", "she's glad"], weight: 4 },
  ],
  EXCITEMENT: [
    { phrases: ["excited", "can't wait", "hyped"], weight: 4 },
  ],
  LOVE: [
    { phrases: ["she loves", "i love her", "feeling close", "romantic"], weight: 3 },
  ],
  MISSING: [
    { phrases: ["miss her", "she's missing me", "i miss you", "yaad"], weight: 5 },
  ],
  CELEBRATION: [
    { phrases: ["did well", "passed", "got the job", "good news", "congratulations", "she succeeded"], weight: 5 },
  ],
  CONFLICT: [
    { phrases: ["argument", "fight", "we argued", "after the fight", "conflict"], weight: 5 },
    { phrases: ["not talking", "silent treatment", "she blocked"], weight: 4 },
  ],
  APOLOGY: [
    { phrases: ["should i apologize", "say sorry", "maafi", "i need to apologize", "write a short apology"], weight: 5 },
  ],
  SUPPORT: [
    { phrases: ["support her", "be there", "encourage", "cheer her up", "make her feel better"], weight: 4 },
  ],
  ROMANTIC: [
    { phrases: ["romantic", "good morning card", "good night", "miss you card", "love message"], weight: 3 },
  ],
  NORMAL: [{ phrases: ["check in", "just saying hi", "ordinary day"], weight: 2 }],
  UNKNOWN: [],
};
