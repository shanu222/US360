import type { Emotion, RecommendedAction, SituationKind } from "@/engine/types";

export interface DecisionRule {
  id: string;
  when: {
    emotions?: Emotion[];
    situations?: SituationKind[];
    userFault?: boolean;
    wantsSpace?: boolean;
    importantEvent?: boolean;
  };
  then: {
    action: RecommendedAction;
    state: "CONFLICT" | "REPAIR" | "SUPPORT" | "CELEBRATION" | "MAINTENANCE" | "QUIET" | "NORMAL";
    priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    avoid: string[];
    approach: string;
    timing: string;
    messageKey: string;
    card?: string | null;
    reel?: string | null;
  };
}

export const DECISION_RULES: DecisionRule[] = [
  {
    id: "space-first",
    when: { wantsSpace: true },
    then: {
      action: "GIVE_SPACE",
      state: "QUIET",
      priority: "CRITICAL",
      avoid: ["Follow-up messages", "Funny Reel", "Romantic pressure", "Asking her to talk now"],
      approach: "Honor the request for space. Being present later is better than being persistent now.",
      timing: "Do not send anything until the quiet window ends, unless she reaches out.",
      messageKey: "space",
      card: null,
      reel: null,
    },
  },
  {
    id: "anger-fault",
    when: { emotions: ["ANGER", "HURT", "CONFLICT"], userFault: true },
    then: {
      action: "APOLOGIZE",
      state: "CONFLICT",
      priority: "CRITICAL",
      avoid: ["Defending yourself immediately", "A joke", "A long romantic message", "Multiple messages", "Funny Reel"],
      approach: "Apologize for your part and avoid becoming defensive. Name what happened. Ask if she is open to talking later.",
      timing: "Send one short apology first and wait for a response before any card or Reel.",
      messageKey: "apology",
      card: "SORRY",
      reel: null,
    },
  },
  {
    id: "anger-unclear",
    when: { emotions: ["ANGER", "CONFLICT"] },
    then: {
      action: "CLARIFY",
      state: "CONFLICT",
      priority: "CRITICAL",
      avoid: ["Assuming you know", "Funny content", "Turning it into a speech"],
      approach: "Stay calm. Acknowledge the tension and ask a clarifying question instead of arguing the facts.",
      timing: "One calm message. Then wait.",
      messageKey: "clarify",
      card: null,
      reel: null,
    },
  },
  {
    id: "sad-support",
    when: { emotions: ["SADNESS", "STRESS", "ANXIETY"], situations: ["WANTS_SUPPORT", "BAD_DAY", "WORK_STRESS"] },
    then: {
      action: "SUPPORT",
      state: "SUPPORT",
      priority: "HIGH",
      avoid: ["Minimizing it", "Fixing her feelings", "A punchline if she did not ask for humor"],
      approach: "Validate first. A short supportive note lands better than advice.",
      timing: "Send the supportive message now. A Reel is optional and only if she likes light content when stressed.",
      messageKey: "support",
      card: "MOTIVATION",
      reel: "CUTE",
    },
  },
  {
    id: "exam",
    when: { situations: ["EXAM", "IMPORTANT_EVENT"] },
    then: {
      action: "ENCOURAGE",
      state: "SUPPORT",
      priority: "HIGH",
      avoid: ["Adding pressure", "Long speeches", "Needy check-ins during the exam"],
      approach: "Encourage without crowding her. One steady note is enough.",
      timing: "A short message the evening before or the morning of. Ask how it went after.",
      messageKey: "exam",
      card: "MOTIVATION",
      reel: "MOTIVATION",
    },
  },
  {
    id: "birthday-conflict",
    when: { emotions: ["ANGER", "HURT"], situations: ["BIRTHDAY", "FORGOT_BIRTHDAY"] },
    then: {
      action: "APOLOGIZE",
      state: "CONFLICT",
      priority: "CRITICAL",
      avoid: ["A party-tone Reel", "Acting like the birthday cancels the hurt"],
      approach: "The birthday still matters, but the current hurt comes first. Apologize, then keep the day simple.",
      timing: "Apology first. Birthday warmth only if she is open to it.",
      messageKey: "apology-birthday",
      card: "SORRY",
      reel: null,
    },
  },
  {
    id: "birthday",
    when: { situations: ["BIRTHDAY", "ANNIVERSARY"] },
    then: {
      action: "CELEBRATE",
      state: "CELEBRATION",
      priority: "HIGH",
      avoid: ["Last-minute panic dumping five messages"],
      approach: "Prepare a specific, personal note and one visual. Quality over volume.",
      timing: "Morning of the day, unless she prefers evenings.",
      messageKey: "birthday",
      card: "BIRTHDAY",
      reel: "CELEBRATION",
    },
  },
  {
    id: "good-news",
    when: { emotions: ["CELEBRATION", "HAPPINESS"], situations: ["GOOD_NEWS"] },
    then: {
      action: "CELEBRATE",
      state: "CELEBRATION",
      priority: "HIGH",
      avoid: ["Making it about you"],
      approach: "Celebrate her specifically. Name what she did.",
      timing: "Now is appropriate.",
      messageKey: "congrats",
      card: "CONGRATULATIONS",
      reel: "CELEBRATION",
    },
  },
  {
    id: "missing",
    when: { emotions: ["MISSING", "LOVE", "ROMANTIC"] },
    then: {
      action: "CHECK_IN",
      state: "MAINTENANCE",
      priority: "MEDIUM",
      avoid: ["Guilt-tripping her to reply"],
      approach: "A warm, specific note. No performance.",
      timing: "Whenever the day is quiet — not during a known conflict.",
      messageKey: "missing",
      card: "MISS_YOU",
      reel: "ROMANTIC",
    },
  },
  {
    id: "cheer",
    when: { emotions: ["SADNESS"], situations: ["WANTS_SUPPORT"] },
    then: {
      action: "SUPPORT",
      state: "SUPPORT",
      priority: "MEDIUM",
      avoid: ["Forcing jokes if she is raw"],
      approach: "Something gentle and familiar — a favorite, not a spectacle.",
      timing: "One kind note. Optionally a light Reel if she likes humor.",
      messageKey: "cheer",
      card: "THINKING_OF_YOU",
      reel: "FUNNY",
    },
  },
];

export const COMMUNICATION_RULES = [
  "Listen before explaining.",
  "Name the impact, not just your intent.",
  "Ask instead of assuming.",
  "One message is usually enough.",
];

export const CONFLICT_RULES = [
  "Accountability before context.",
  "De-escalate; do not win.",
  "Space is a repair attempt when she asked for it.",
  "No jokes during heat.",
];

export const SUPPORT_RULES = [
  "Validation before advice.",
  "Specific beats grand.",
  "Don't flood her with content.",
];

export const MAINTENANCE_RULES = [
  "Remember the details she already told you.",
  "Keep promises small and kept.",
  "Quiet days can still be good days.",
];

export const ROMANTIC_RULES = [
  "Warmth without pressure.",
  "Good morning and good night are optional, not a quota.",
  "Skip romance during unresolved conflict.",
];
