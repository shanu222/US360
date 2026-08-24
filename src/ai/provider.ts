import { db } from "@/lib/db";
import { FallbackProvider } from "@/ai/providers/fallback";
import { OpenAIProvider } from "@/ai/providers/openai";
import { SAFETY_SYSTEM, type ChatMessage, type GenerateOptions, type GenerateResult, type LLMProvider } from "@/ai/types";

let cached: LLMProvider | null = null;

export function getLLM(): LLMProvider {
  if (cached) return cached;
  const provider = (process.env.AI_PROVIDER ?? "openai").toLowerCase();
  const key = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL ?? "gpt-4o-mini";

  if (provider === "openai" && key) {
    cached = new OpenAIProvider(key, model);
  } else {
    cached = new FallbackProvider();
  }
  return cached;
}

export async function generateAI(
  userId: string,
  feature: string,
  messages: ChatMessage[],
  options: GenerateOptions = {},
): Promise<GenerateResult> {
  const settings = await db.userSettings.findUnique({ where: { userId } });
  const dailyLimit = settings?.dailyAiLimit ?? Number(process.env.AI_DAILY_USER_LIMIT ?? 40);

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const used = await db.aIUsageLog.count({
    where: { userId, createdAt: { gte: start }, cached: false },
  });

  if (used >= dailyLimit) {
    throw new Error("AI_LIMIT");
  }

  const llm = getLLM();
  const withSafety: ChatMessage[] = [
    { role: "system", content: SAFETY_SYSTEM },
    ...messages,
  ];

  try {
    const result = await llm.generate(withSafety, options);
    await db.aIUsageLog.create({
      data: {
        userId,
        feature,
        model: result.model,
        tokensIn: result.tokensIn,
        tokensOut: result.tokensOut,
        success: true,
        cached: llm.name === "fallback",
      },
    });
    return result;
  } catch (error) {
    await db.aIUsageLog.create({
      data: {
        userId,
        feature,
        model: llm.name,
        success: false,
      },
    });
    throw error;
  }
}

export function parseJson<T>(text: string): T {
  const trimmed = text.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  const json = start >= 0 && end >= 0 ? trimmed.slice(start, end + 1) : trimmed;
  return JSON.parse(json) as T;
}
