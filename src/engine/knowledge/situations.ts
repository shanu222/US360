import type { SituationKind, WeightedPhrase } from "@/engine/types";

export const SITUATION_LEXICON: Record<SituationKind, WeightedPhrase[]> = {
  MISSED_CALL: [
    { phrases: ["forgot to call", "missed her call", "didn't call", "did not call", "expected call"], weight: 6 },
    { phrases: ["call her", "phone call"], weight: 2 },
  ],
  LATE_RESPONSE: [
    { phrases: ["replied late", "didn't text back", "left her on seen", "slow to reply"], weight: 5 },
  ],
  FORGOT_SOMETHING: [
    { phrases: ["i forgot", "i forget", "slipped my mind", "didn't remember"], weight: 5 },
  ],
  FORGOT_BIRTHDAY: [
    { phrases: ["forgot her birthday", "missed her birthday"], weight: 8 },
  ],
  BROKEN_PROMISE: [
    { phrases: ["broke a promise", "i promised", "didn't keep my word", "i said i would"], weight: 5 },
  ],
  ARGUMENT: [
    { phrases: ["we fought", "argument", "after the fight", "we argued"], weight: 6 },
  ],
  MISUNDERSTANDING: [
    { phrases: ["misunderstanding", "she thought", "took it the wrong way", "mixed up"], weight: 5 },
  ],
  EXAM: [
    { phrases: ["exam tomorrow", "exam today", "has an exam", "test tomorrow", "paper kal", "exam week"], weight: 6 },
    { phrases: ["exam", "presentation", "assignment due"], weight: 3 },
  ],
  BIRTHDAY: [
    { phrases: ["her birthday", "birthday tomorrow", "birthday next week", "birthday is today"], weight: 6 },
  ],
  ANNIVERSARY: [
    { phrases: ["our anniversary", "anniversary tomorrow"], weight: 6 },
  ],
  IMPORTANT_EVENT: [
    { phrases: ["important day", "interview", "orientation", "big day", "important meeting", "important event", "important presentation"], weight: 4 },
    { phrases: ["meeting tomorrow", "has a meeting", "presentation next"], weight: 5 },
  ],
  WORK_STRESS: [
    { phrases: ["work stress", "office stress", "boss", "shift was heavy"], weight: 4 },
  ],
  FAMILY_EVENT: [
    { phrases: ["her family", "ammi", "family event", "relative"], weight: 3 },
  ],
  GOOD_NEWS: [
    { phrases: ["did well", "passed her exam", "good news", "she got", "really well", "she succeeded"], weight: 5 },
  ],
  BAD_DAY: [
    { phrases: ["bad day", "rough day", "hard day", "not her day"], weight: 4 },
  ],
  NEEDS_SPACE: [
    { phrases: ["needs space", "give her space", "don't message", "leave her alone", "don't remind me"], weight: 7 },
  ],
  WANTS_SUPPORT: [
    { phrases: ["wants support", "needs me", "feeling sad", "cheer her up", "make something nice"], weight: 4 },
  ],
  UNKNOWN: [],
};

export const USER_FAULT_PHRASES = [
  "i forgot",
  "i missed",
  "my fault",
  "i didn't",
  "i did not",
  "i was late",
  "i ignored",
  "i broke",
  "i hurt",
  "i promised",
];

export const UNCLEAR_FAULT_PHRASES = [
  "not sure",
  "maybe",
  "i think she",
  "unclear",
  "don't know why",
  "what did i do",
];
