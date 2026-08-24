export type AutomationMode = "SMART" | "ASSISTED" | "MANUAL";

export type RecommendationType =
  | "APOLOGIZE"
  | "TALK_CALMLY"
  | "GIVE_SPACE"
  | "CLARIFY"
  | "APPRECIATE"
  | "DO_SOMETHING_THOUGHTFUL"
  | "WAIT_BEFORE_RESPONDING"
  | "TALK_IN_PERSON"
  | "NO_ACTION_NEEDED";

export type DailyAction =
  | "SEND"
  | "WAIT"
  | "NO_ACTION"
  | "ASK_USER"
  | "SUGGEST_GESTURE"
  | "SUGGEST_REEL"
  | "SUGGEST_MESSAGE"
  | "SUGGEST_CARD";

export interface SituationAnalysisResult {
  recommendation: RecommendationType;
  confidence: "low" | "medium" | "high";
  summary: string;
  reasoning_summary: string;
  avoid: string[];
  next_step: string;
  suggested_message?: string;
  gesture?: string;
  needs_space: boolean;
  remember?: { title: string; content: string; category?: string }[];
}

export interface ToneReviewResult {
  risk: "low" | "medium" | "high";
  labels: string[];
  headline: string;
  explanation: string;
  alternatives: {
    style: "soft" | "natural" | "direct" | "short" | "apologetic";
    text: string;
  }[];
}

export interface GiftIdea {
  title: string;
  why: string;
  budget: string;
  preparation: string;
  message?: string;
  effort: "free" | "low" | "higher";
}

export const FAVORITE_CATEGORIES = [
  "colors",
  "flowers",
  "foods",
  "drinks",
  "movies",
  "music",
  "hobbies",
  "places",
  "activities",
  "gifts",
  "appreciates",
] as const;

export const MESSAGE_CATEGORIES = [
  "ROMANTIC",
  "APOLOGY",
  "APPRECIATION",
  "FUNNY",
  "GOOD_MORNING",
  "GOOD_NIGHT",
  "CONGRATULATIONS",
  "ENCOURAGEMENT",
  "BIRTHDAY",
  "ANNIVERSARY",
  "THINKING_OF_YOU",
  "MISS_YOU",
  "CUSTOM",
] as const;

export const CARD_CATEGORIES = [
  "GOOD_MORNING",
  "GOOD_NIGHT",
  "ROMANTIC",
  "APPRECIATION",
  "SORRY",
  "BIRTHDAY",
  "ANNIVERSARY",
  "CONGRATULATIONS",
  "MOTIVATION",
  "THINKING_OF_YOU",
  "MISS_YOU",
  "CUSTOM",
] as const;

export const REEL_CATEGORIES = [
  "ROMANTIC",
  "FUNNY",
  "CUTE",
  "APPRECIATION",
  "SORRY",
  "MOTIVATION",
  "CELEBRATION",
  "MEMORY",
] as const;

export const COMMUNICATION_STYLES = [
  "Short messages",
  "Romantic",
  "Funny",
  "Emotional",
  "Simple",
  "Playful",
  "Formal",
] as const;
