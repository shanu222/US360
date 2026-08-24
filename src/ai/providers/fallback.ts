import type { ChatMessage, GenerateOptions, GenerateResult, LLMProvider } from "@/ai/types";
import { localJsonForPrompt } from "@/ai/local-replies";

/**
 * Deterministic fallback used when no API key is configured or the provider fails.
 * Keeps the product usable for local development and graceful degradation.
 */
export class FallbackProvider implements LLMProvider {
  name = "fallback";

  async generate(messages: ChatMessage[], options: GenerateOptions = {}): Promise<GenerateResult> {
    const text = options.json ? JSON.stringify(localJsonForPrompt(messages)) : this.plainReply(messages);
    return { text, tokensIn: 0, tokensOut: 0, model: "fallback" };
  }

  private plainReply(messages: ChatMessage[]) {
    const last = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
    if (!last.trim()) {
      return "I'm here. Tell me what happened, and we can figure out a thoughtful next step.";
    }
    return "Based on what you described, a calm, specific message is likely more helpful than a long explanation. If you'd like, I can draft a few versions for you to edit.";
  }
}
