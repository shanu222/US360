export interface MessageTemplate {
  key: string;
  emotion: string[];
  situation: string[];
  tone: "apology" | "supportive" | "romantic" | "simple" | "celebration" | "space";
  length: "short" | "medium";
  body: string;
}

export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    key: "apology",
    emotion: ["ANGER", "HURT", "DISAPPOINTMENT"],
    situation: ["MISSED_CALL", "FORGOT_SOMETHING", "BROKEN_PROMISE", "ARGUMENT"],
    tone: "apology",
    length: "short",
    body: "I'm sorry about {APOLOGY_REASON}. I understand that it affected you, and I should have handled it better. I'm here when you want to talk.",
  },
  {
    key: "apology",
    emotion: ["ANGER", "HURT"],
    situation: ["MISSED_CALL"],
    tone: "apology",
    length: "medium",
    body: "I'm sorry I didn't call when I said I would. You were right to expect that from me, and I don't want to explain it away. I'll do better with the next one. I'm here whenever you're ready.",
  },
  {
    key: "apology-birthday",
    emotion: ["ANGER", "HURT"],
    situation: ["FORGOT_BIRTHDAY", "BIRTHDAY"],
    tone: "apology",
    length: "short",
    body: "I'm sorry I missed the weight of your birthday. That day should have felt like it belonged to you, and I let it slip. I want to make the rest of it kinder, if you'll let me.",
  },
  {
    key: "clarify",
    emotion: ["ANGER", "CONFUSION", "CONFLICT"],
    situation: ["MISUNDERSTANDING", "ARGUMENT"],
    tone: "simple",
    length: "short",
    body: "I can tell this landed badly. I don't want to argue it in a thread. When you're ready, I want to understand what felt off — not defend myself first.",
  },
  {
    key: "space",
    emotion: ["ANGER", "CONFLICT"],
    situation: ["NEEDS_SPACE"],
    tone: "space",
    length: "short",
    body: "I'll give you space. I'm here when you want to talk — no rush.",
  },
  {
    key: "support",
    emotion: ["SADNESS", "STRESS", "ANXIETY"],
    situation: ["WANTS_SUPPORT", "BAD_DAY", "WORK_STRESS"],
    tone: "supportive",
    length: "short",
    body: "I'm sorry today is heavy. You don't have to carry it neatly for me. I'm in your corner.",
  },
  {
    key: "support",
    emotion: ["STRESS"],
    situation: ["EXAM", "WORK_STRESS"],
    tone: "supportive",
    length: "medium",
    body: "I know this stretch is a lot, {NAME}. You don't have to be impressive right now — showing up is already something. I'm proud of how you keep going.",
  },
  {
    key: "exam",
    emotion: ["STRESS", "ANXIETY", "SUPPORT"],
    situation: ["EXAM"],
    tone: "supportive",
    length: "short",
    body: "You've prepared for this. I hope {EVENT} treats you kindly tomorrow. I'll be thinking of you — no pressure to reply.",
  },
  {
    key: "congrats",
    emotion: ["CELEBRATION", "HAPPINESS"],
    situation: ["GOOD_NEWS", "EXAM"],
    tone: "celebration",
    length: "short",
    body: "I'm proud of you for {ACHIEVEMENT}. That one is yours.",
  },
  {
    key: "birthday",
    emotion: ["HAPPINESS", "LOVE", "CELEBRATION"],
    situation: ["BIRTHDAY"],
    tone: "romantic",
    length: "medium",
    body: "Happy birthday, {NAME}. I hope today has {FAVORITE_THING} in it, and a little ease. I'm glad you're in my ordinary days.",
  },
  {
    key: "missing",
    emotion: ["MISSING", "LOVE", "ROMANTIC"],
    situation: ["WANTS_SUPPORT"],
    tone: "romantic",
    length: "short",
    body: "I miss you — simply, without making it heavy. {PERSONAL_DETAIL}",
  },
  {
    key: "cheer",
    emotion: ["SADNESS"],
    situation: ["WANTS_SUPPORT", "BAD_DAY"],
    tone: "supportive",
    length: "short",
    body: "Thinking of you. If a small {FAVORITE_THING} would help, I'm in. If you just want quiet, that's fine too.",
  },
  {
    key: "morning",
    emotion: ["ROMANTIC", "NORMAL"],
    situation: ["WANTS_SUPPORT"],
    tone: "romantic",
    length: "short",
    body: "Good morning, {NAME}. I hope today brings you {POSITIVE_WISH}. Don't forget how much {APPRECIATION_POINT}.",
  },
  {
    key: "night",
    emotion: ["ROMANTIC", "NORMAL"],
    situation: ["WANTS_SUPPORT"],
    tone: "romantic",
    length: "short",
    body: "Sleep well. The day can stop here — you don't have to carry it into the night.",
  },
  {
    key: "appreciate",
    emotion: ["LOVE", "NORMAL", "HAPPINESS"],
    situation: ["WANTS_SUPPORT"],
    tone: "simple",
    length: "short",
    body: "I just wanted to tell you that I really appreciate {PERSONAL_DETAIL}. It means more to me than I probably say.",
  },
  {
    key: "checkin",
    emotion: ["NORMAL"],
    situation: ["UNKNOWN"],
    tone: "simple",
    length: "short",
    body: "Just checking in. No need to write a lot back — I hope your day's been alright.",
  },
];
