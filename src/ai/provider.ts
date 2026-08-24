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

async function logUsage(data: {
  userId: string;
  feature: string;
  model: string;
  tokensIn?: number;
  tokensOut?: number;
  success: boolean;
  cached?: boolean;
}) {
  try {
    await db.aIUsageLog.create({
      data: {
        userId: data.userId,
        feature: data.feature,
        model: data.model,
        tokensIn: data.tokensIn ?? 0,
        tokensOut: data.tokensOut ?? 0,
        success: data.success,
        cached: data.cached ?? false,
      },
    });
  } catch (error) {
    console.error("AI usage log failed", error);
  }
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

  const withSafety: ChatMessage[] = [{ role: "system", content: SAFETY_SYSTEM }, ...messages];
  const llm = getLLM();

  if (used >= dailyLimit && llm.name !== "fallback") {
    const fallback = new FallbackProvider();
    const result = await fallback.generate(withSafety, options);
    await logUsage({ userId, feature, model: result.model, success: true, cached: true });
    return result;
  }

  try {
    const result = await llm.generate(withSafety, options);
    await logUsage({
      userId,
      feature,
      model: result.model,
      tokensIn: result.tokensIn,
      tokensOut: result.tokensOut,
      success: true,
      cached: llm.name === "fallback",
    });
    return result;
  } catch (error) {
    console.error("AI provider failed; using local fallback", error);
    await logUsage({ userId, feature, model: llm.name, success: false });
    const fallback = new FallbackProvider();
    const result = await fallback.generate(withSafety, options);
    await logUsage({ userId, feature, model: result.model, success: true, cached: true });
    return result;
  }
}

export function parseJson<T>(text: string): T {
  const trimmed = text.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  const json = start >= 0 && end >= 0 ? trimmed.slice(start, end + 1) : trimmed;
  try {
    return JSON.parse(json) as T;
  } catch {
    throw new Error("AI_PARSE");
  }
}
