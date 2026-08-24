export type Emotion =
  | "ANGER"
  | "SADNESS"
  | "HURT"
  | "HAPPINESS"
  | "EXCITEMENT"
  | "LOVE"
  | "STRESS"
  | "ANXIETY"
  | "DISAPPOINTMENT"
  | "CONFUSION"
  | "MISSING"
  | "CELEBRATION"
  | "CONFLICT"
  | "APOLOGY"
  | "SUPPORT"
  | "ROMANTIC"
  | "NORMAL"
  | "UNKNOWN";

export type SituationKind =
  | "MISSED_CALL"
  | "LATE_RESPONSE"
  | "FORGOT_SOMETHING"
  | "BROKEN_PROMISE"
  | "ARGUMENT"
  | "MISUNDERSTANDING"
  | "IMPORTANT_EVENT"
  | "EXAM"
  | "BIRTHDAY"
  | "ANNIVERSARY"
  | "WORK_STRESS"
  | "FAMILY_EVENT"
  | "GOOD_NEWS"
  | "BAD_DAY"
  | "NEEDS_SPACE"
  | "WANTS_SUPPORT"
  | "FORGOT_BIRTHDAY"
  | "UNKNOWN";

export type RelationshipState = "CONFLICT" | "REPAIR" | "SUPPORT" | "CELEBRATION" | "MAINTENANCE" | "QUIET" | "NORMAL";

export type Priority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type CommandIntent =
  | "ADVICE"
  | "CREATE_CARD"
  | "SUGGEST_MESSAGE"
  | "FIND_REEL"
  | "PREPARE_EVERYTHING"
  | "SAVE_EVENT"
  | "GIVE_SPACE"
  | "LOOK_HISTORY"
  | "MODIFY_TONE"
  | "SHOULD_APOLOGIZE"
  | "CHEER_UP"
  | "NOTHING";

export type RecommendedAction =
  | "APOLOGIZE"
  | "GIVE_SPACE"
  | "CLARIFY"
  | "SUPPORT"
  | "ENCOURAGE"
  | "APPRECIATE"
  | "CELEBRATE"
  | "CHECK_IN"
  | "WAIT"
  | "NO_ACTION";

export interface WeightedPhrase {
  phrases: string[];
  weight: number;
}

export interface ParsedCommand {
  raw: string;
  intents: CommandIntent[];
  emotions: { key: Emotion; score: number }[];
  situations: { key: SituationKind; score: number }[];
  primaryEmotion: Emotion;
  primarySituation: SituationKind;
  userFault: boolean;
  faultUnclear: boolean;
  wantsSpace: boolean;
  noRomantic: boolean;
  noFunny: boolean;
  wantsFunny: boolean;
  wantsRomantic: boolean;
  wantsCard: boolean;
  wantsReel: boolean;
  wantsMessage: boolean;
  wantsHistory: boolean;
  shorter: boolean;
  simpler: boolean;
  moreRomantic: boolean;
  followUp: boolean;
  quietHours: number | null;
  eventHint: { title: string; type: string; startAt: string } | null;
  apologyReason: string | null;
  achievement: string | null;
  urgency: Priority;
  style: "short" | "simple" | "romantic" | "supportive" | "apology";
}

export interface HistoryMatch {
  emotion: string;
  situation: string;
  recommendation: string;
  helpfulCount: number;
  unhelpfulCount: number;
  note: string;
}

export interface EngineProfile {
  partnerName: string;
  personality?: string;
  likes: string[];
  dislikes: string[];
  flowers?: string;
  colors?: string;
  foods: string[];
  songs?: string;
  movies?: string;
  activities: string[];
  places: string[];
  gifts?: string;
  makesHappy?: string;
  upsets?: string;
  calms?: string;
  apologyStyle?: string;
  conflictStyle?: string;
  wantsSpace?: boolean;
  messageLength: "short" | "medium" | "long";
  romanticStyle?: string;
  humor?: string;
  memories: string[];
  promises: string[];
  goals?: string;
  concerns?: string;
  communicationStyle?: string;
}

export interface EngineContext {
  now: Date;
  quietUntil: Date | null;
  profile: EngineProfile;
  upcoming: { title: string; type: string; startAt: Date; notes?: string | null }[];
  recentSituations: { description: string; status: string; createdAt: Date }[];
  recentCards: { category: string; theme: string; createdAt: Date }[];
  recentReels: { id: string; url: string; category: string; notes?: string | null; createdAt: Date }[];
  recentMessages: { category: string; content: string }[];
  history: HistoryMatch[];
  lastParse: ParsedCommand | null;
  chat: {
    summary?: string;
    likes: string[];
    dislikes: string[];
    topics: string[];
    style: string[];
    timeline: { at: string | null; event: string; situation: string; outcome?: string }[];
    conflictSignals: number;
    avgPartnerLength: number;
  };
}

export interface PreparePlan {
  date: { title: string; when: string; type: string };
  gift: string;
  message: string;
  cardCategory: string;
  reelCategory: string;
  reminders: string[];
  activity: string;
}

export interface CommandDecision {
  situationDetected: string;
  approach: string;
  recommendedAction: RecommendedAction;
  relationshipState: RelationshipState;
  priority: Priority;
  avoid: string[];
  timing: string;
  messageKey: string;
  cardCategory: string | null;
  reelCategory: string | null;
  reelReason: string | null;
  nothingNeeded: boolean;
  historyNotes: string[];
  pendingEvent: { title: string; type: string; startAt: string; notes: string } | null;
  plan: PreparePlan | null;
  quietUntil: string | null;
}

export interface CommandResultView {
  situationDetected: string;
  recommendedAction: string;
  approach: string;
  avoid: string[];
  message: string | null;
  messageCategory: string | null;
  reel: { id: string; url: string; category: string; reason: string } | null;
  card: { id: string; theme: string; message: string; category: string } | null;
  timing: string;
  plan: PreparePlan | null;
  pendingEvent: { title: string; type: string; startAt: string; notes: string } | null;
  historyNotes: string[];
  nothingNeeded: boolean;
  emotion: Emotion;
  situation: SituationKind;
  relationshipState: RelationshipState;
  priority: Priority;
  quietUntil: string | null;
}
