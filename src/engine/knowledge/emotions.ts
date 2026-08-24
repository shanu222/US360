import type { Emotion, WeightedPhrase } from "@/engine/types";

export const EMOTION_LEXICON: Record<Emotion, WeightedPhrase[]> = {
  ANGER: [
    { phrases: ["angry", "mad at me", "furious", "pissed", "gussa", "she is angry", "she's angry", "he is angry", "he's angry"], weight: 5 },
    { phrases: ["upset with me", "she is upset", "she's upset", "he is upset", "he's upset", "naraaz"], weight: 4 },
    { phrases: ["yelled", "shouting", "screaming", "snapped"], weight: 3 },
  ],
  HURT: [
    { phrases: ["hurt her", "hurt him", "she is hurt", "she's hurt", "he is hurt", "he's hurt", "heartbroken", "felt ignored"], weight: 5 },
    { phrases: ["disappointed in me", "let her down", "let him down", "broke her trust", "broke his trust"], weight: 4 },
  ],
  SADNESS: [
    { phrases: ["sad", "crying", "udaas", "dukhi", "down today", "feeling low"], weight: 5 },
    { phrases: ["not okay", "having a hard day", "bad day"], weight: 3 },
  ],
  STRESS: [
    { phrases: ["stressed", "pareshan", "overwhelmed", "pressure", "burnt out"], weight: 5 },
    { phrases: ["this week has been heavy", "too much on her plate", "too much on his plate"], weight: 3 },
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
    { phrases: ["happy", "khush", "smiling", "good mood", "she's glad", "he's glad"], weight: 4 },
  ],
  EXCITEMENT: [
    { phrases: ["excited", "can't wait", "hyped"], weight: 4 },
  ],
  LOVE: [
    { phrases: ["she loves", "he loves", "i love her", "i love him", "feeling close", "romantic"], weight: 3 },
  ],
  MISSING: [
    { phrases: ["miss her", "miss him", "she's missing me", "he's missing me", "i miss you", "yaad"], weight: 5 },
  ],
  CELEBRATION: [
    { phrases: ["did well", "passed", "got the job", "good news", "congratulations", "she succeeded", "he succeeded"], weight: 5 },
  ],
  CONFLICT: [
    { phrases: ["argument", "fight", "we argued", "after the fight", "conflict"], weight: 5 },
    { phrases: ["not talking", "silent treatment", "she blocked", "he blocked"], weight: 4 },
  ],
  APOLOGY: [
    { phrases: ["should i apologize", "say sorry", "maafi", "i need to apologize", "write a short apology"], weight: 5 },
  ],
  SUPPORT: [
    { phrases: ["support her", "support him", "be there", "encourage", "cheer her up", "cheer him up", "make her feel better", "make him feel better"], weight: 4 },
  ],
  ROMANTIC: [
    { phrases: ["romantic", "good morning card", "good night", "miss you card", "love message"], weight: 3 },
  ],
  NORMAL: [{ phrases: ["check in", "just saying hi", "ordinary day"], weight: 2 }],
  UNKNOWN: [],
};
