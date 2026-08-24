import { buildAIContext } from "@/ai/context";
import { contextToPrompt } from "@/ai/context-types";
import { generateAI, parseJson } from "@/ai/provider";
import {
  localCardCopy,
  localGiftIdeas,
  localMessages,
  localSituation,
  localToneReview,
  localWeeklyFocus,
} from "@/ai/local-replies";
import type { SituationAnalysisResult, ToneReviewResult, GiftIdea } from "@/types";

export async function analyzeSituation(
  userId: string,
  input: { description: string; howUserFeels?: string; whatUserWants?: string; afterArgument?: boolean },
) {
  try {
    const ctx = await buildAIContext(userId);
    const result = await generateAI(
      userId,
      input.afterArgument ? "after-argument" : "situation-analysis",
      [
        {
          role: "system",
          content: `${contextToPrompt(ctx)}

Return JSON with keys:
recommendation (APOLOGIZE | TALK_CALMLY | GIVE_SPACE | CLARIFY | APPRECIATE | DO_SOMETHING_THOUGHTFUL | WAIT_BEFORE_RESPONDING | TALK_IN_PERSON | NO_ACTION_NEEDED),
confidence (low|medium|high),
summary, reasoning_summary, avoid (string[]), next_step, suggested_message, gesture, needs_space (boolean),
remember (optional array of {title, content, category}).
Never claim certainty about the partner's inner state.`,
        },
        {
          role: "user",
          content: `Situation: ${input.description}
How I feel: ${input.howUserFeels ?? "not specified"}
What I want: ${input.whatUserWants ?? "not specified"}`,
        },
      ],
      { json: true },
    );
    const parsed = parseJson<SituationAnalysisResult>(result.text);
    if (!parsed.recommendation || !parsed.summary) throw new Error("AI_PARSE");
    return {
      ...parsed,
      avoid: Array.isArray(parsed.avoid) ? parsed.avoid : [],
      needs_space: Boolean(parsed.needs_space),
      recommendation: String(parsed.recommendation).toUpperCase().replaceAll(" ", "_") as SituationAnalysisResult["recommendation"],
    };
  } catch {
    return localSituation(input.description) as SituationAnalysisResult;
  }
}

export async function reviewTone(userId: string, message: string) {
  try {
    const ctx = await buildAIContext(userId);
    const result = await generateAI(
      userId,
      "before-you-send",
      [
        {
          role: "system",
          content: `${contextToPrompt(ctx)}
Review the user's draft message. Do not force a change.
Return JSON: risk (low|medium|high), labels (string[]), headline, explanation,
alternatives: array of {style: soft|natural|direct|short|apologetic, text}.`,
        },
        { role: "user", content: `Draft message:\n${message}` },
      ],
      { json: true },
    );
    const parsed = parseJson<ToneReviewResult>(result.text);
    if (!parsed.headline || !Array.isArray(parsed.alternatives)) throw new Error("AI_PARSE");
    return parsed;
  } catch {
    return localToneReview() as ToneReviewResult;
  }
}

export async function generateMessage(
  userId: string,
  input: { intent: string; category: string; tone?: string; length?: string; soundLikeMe?: boolean },
) {
  try {
    const ctx = await buildAIContext(userId);
    const result = await generateAI(
      userId,
      "message-studio",
      [
        {
          role: "system",
          content: `${contextToPrompt(ctx)}
Write 3 suggested messages. They are drafts for the user to approve.
Return JSON: { messages: string[] }
Honor the requested tone (${input.tone ?? "natural"}) and length (${input.length ?? "medium"}).
${input.soundLikeMe && ctx.writingStyle ? "Match the user's writing style samples closely." : ""}
Language: ${ctx.language ?? "en"}.`,
        },
        { role: "user", content: `Category: ${input.category}\nWhat I want to say: ${input.intent}` },
      ],
      { json: true },
    );
    const parsed = parseJson<{ messages: string[] }>(result.text);
    if (!Array.isArray(parsed.messages) || !parsed.messages.length) throw new Error("AI_PARSE");
    return parsed;
  } catch {
    return localMessages(input.intent, input.category);
  }
}

export async function generateCardCopy(
  userId: string,
  input: { category: string; theme: string; occasion?: string; custom?: string },
) {
  try {
    const ctx = await buildAIContext(userId);
    const result = await generateAI(
      userId,
      "card-copy",
      [
        {
          role: "system",
          content: `${contextToPrompt(ctx)}
Write a short elegant card message (max 18 words). No clichés, no excessive hearts, no cheap valentine language.
Return JSON: { message: string, kicker: string }`,
        },
        {
          role: "user",
          content: `Category: ${input.category}. Theme: ${input.theme}. Occasion: ${input.occasion ?? "none"}. Note: ${input.custom ?? "none"}`,
        },
      ],
      { json: true },
    );
    const parsed = parseJson<{ message: string; kicker: string }>(result.text);
    if (!parsed.message) throw new Error("AI_PARSE");
    return parsed;
  } catch {
    return localCardCopy(input.category, input.theme);
  }
}

export async function generateGiftIdeas(
  userId: string,
  input: { occasion: string; budget: string; timeAvailable: string; interests?: string },
) {
  try {
    const ctx = await buildAIContext(userId);
    const result = await generateAI(
      userId,
      "gift-ideas",
      [
        {
          role: "system",
          content: `${contextToPrompt(ctx)}
Suggest 3 to 5 ideas. Never make expensive spending the default. Include at least one free idea.
Return JSON: { ideas: [{ title, why, budget, preparation, message, effort: free|low|higher }] }`,
        },
        {
          role: "user",
          content: `Occasion: ${input.occasion}. Budget: ${input.budget}. Time: ${input.timeAvailable}. Interests: ${input.interests ?? "use known preferences"}`,
        },
      ],
      { json: true },
    );
    const parsed = parseJson<{ ideas: GiftIdea[] }>(result.text);
    if (!Array.isArray(parsed.ideas) || !parsed.ideas.length) throw new Error("AI_PARSE");
    return parsed;
  } catch {
    return localGiftIdeas() as { ideas: GiftIdea[] };
  }
}

export async function generateSmileIdeas(userId: string, extras?: { budget?: string; time?: string }) {
  return generateGiftIdeas(userId, {
    occasion: "Make her smile today",
    budget: extras?.budget ?? "prefer free or low",
    timeAvailable: extras?.time ?? "a little time",
  });
}

export async function generateWeeklyFocus(userId: string) {
  try {
    const ctx = await buildAIContext(userId);
    const result = await generateAI(
      userId,
      "better-partner",
      [
        {
          role: "system",
          content: `${contextToPrompt(ctx)}
Create one weekly personal-development focus for the user (not a diagnosis of the partner).
Themes may include listening, keeping promises, appreciation, quality time, patience, communication.
Return JSON: { title: string, body: string }`,
        },
        { role: "user", content: "What should this week's focus be?" },
      ],
      { json: true },
    );
    const parsed = parseJson<{ title: string; body: string }>(result.text);
    if (!parsed.title || !parsed.body) throw new Error("AI_PARSE");
    return parsed;
  } catch {
    return localWeeklyFocus();
  }
}

export async function extractMemorySuggestion(userId: string, text: string) {
  try {
    const result = await generateAI(
      userId,
      "memory-extract",
      [
        {
          role: "system",
          content: `If the text contains a durable personal fact worth remembering (preference, date, dislike, promise), return JSON { suggest: true, title, content, category }.
Otherwise { suggest: false }. Never invent facts. Never silently store. The user must confirm.`,
        },
        { role: "user", content: text },
      ],
      { json: true },
    );
    return parseJson<{ suggest: boolean; title?: string; content?: string; category?: string }>(result.text);
  } catch {
    return { suggest: false };
  }
}
