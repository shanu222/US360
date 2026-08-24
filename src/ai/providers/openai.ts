import OpenAI from "openai";
import type { ChatMessage, GenerateOptions, GenerateResult, LLMProvider } from "@/ai/types";

export class OpenAIProvider implements LLMProvider {
  name = "openai";
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model = "gpt-4o-mini") {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async generate(messages: ChatMessage[], options: GenerateOptions = {}): Promise<GenerateResult> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      temperature: options.temperature ?? 0.6,
      max_tokens: options.maxTokens ?? Number(process.env.AI_MAX_TOKENS ?? 1200),
      response_format: options.json ? { type: "json_object" } : undefined,
      messages,
    });

    const text = completion.choices[0]?.message?.content ?? "";
    return {
      text,
      tokensIn: completion.usage?.prompt_tokens ?? 0,
      tokensOut: completion.usage?.completion_tokens ?? 0,
      model: completion.model,
    };
  }
}
