import type { ChatMessage, GenerateOptions, GenerateResult, LLMProvider } from "@/ai/types";

/**
 * Deterministic fallback used when no API key is configured or the provider fails.
 * Keeps the product usable for local development and graceful degradation.
 */
export class FallbackProvider implements LLMProvider {
  name = "fallback";

  async generate(messages: ChatMessage[], options: GenerateOptions = {}): Promise<GenerateResult> {
    const last = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
    const text = options.json ? this.jsonReply(last) : this.plainReply(last);
    return { text, tokensIn: 0, tokensOut: 0, model: "fallback" };
  }

  private jsonReply(last: string) {
    const lower = last.toLowerCase();

    if (lower.includes("tone") || lower.includes("before you send") || lower.includes("escalate")) {
      return JSON.stringify({
        risk: "high",
        labels: ["dismissive", "defensive"],
        headline: "This message may escalate the conversation.",
        explanation:
          "Based on the wording, this could land as shut-down rather than honest. You can keep your point and soften the edge.",
        alternatives: [
          { style: "soft", text: "I'm feeling hurt and need a little time. Can we talk about this when we're both calmer?" },
          { style: "natural", text: "I care about this, and I don't want to say something I'll regret. Can we pause and come back to it?" },
          { style: "direct", text: "I disagree, and I also don't want this to turn into a fight. Let's talk properly." },
          { style: "short", text: "I need a minute. I do care — I just don't want to make this worse." },
          { style: "apologetic", text: "I'm sorry — that came out sharper than I meant. I care, and I want to talk this through." },
        ],
      });
    }

    if (lower.includes("gift") || lower.includes("budget")) {
      return JSON.stringify({
        ideas: [
          {
            title: "A handwritten note with a shared memory",
            why: "Personal, free, and based on your relationship rather than spending.",
            budget: "Free",
            preparation: "5–10 minutes",
            message: "I keep thinking about that moment — thank you for being you.",
            effort: "free",
          },
          {
            title: "Her favorite coffee or dessert",
            why: "A small, familiar pleasure usually lands better than a generic gift.",
            budget: "Low",
            preparation: "A short stop on your way",
            effort: "low",
          },
          {
            title: "A quiet evening planned around her interests",
            why: "Quality time is often more meaningful than something expensive.",
            budget: "Low to moderate",
            preparation: "Plan the time, not the spectacle",
            effort: "low",
          },
        ],
      });
    }

    if (lower.includes("smile") || lower.includes("gesture")) {
      return JSON.stringify({
        ideas: [
          { title: "Send a specific appreciation", why: "Name one thing she did recently.", effort: "free", budget: "Free", preparation: "2 minutes" },
          { title: "Share a small memory", why: "Recalling a good moment can reset the tone of a day.", effort: "free", budget: "Free", preparation: "5 minutes" },
          { title: "Bring her favorite drink", why: "Familiar and thoughtful without being extravagant.", effort: "low", budget: "Low", preparation: "A short detour" },
        ],
      });
    }

    return JSON.stringify({
      recommendation: lower.includes("forgot") || lower.includes("argument") ? "APOLOGIZE" : "TALK_CALMLY",
      confidence: "medium",
      summary: "Based on what you described, this seems like a communication gap rather than a settled conclusion about either of you.",
      reasoning_summary:
        "It appears something important was missed, and the other person may have felt unseen. One possible interpretation is that a sincere, specific acknowledgment would help more than a long explanation.",
      avoid: [
        "Defending yourself before acknowledging the impact",
        "Minimizing how it felt for her",
        "Sending a long message while emotions are high",
      ],
      next_step: "Send a short, specific message that names what happened and asks if she is open to talking.",
      suggested_message:
        "I'm sorry I missed that. You deserved better from me, and I don't want to brush this off. Can we talk when you're ready?",
      gesture: "A short, sincere check-in is enough. You do not need a grand gesture unless it feels natural.",
      needs_space: false,
      remember: [],
    });
  }

  private plainReply(last: string) {
    if (!last.trim()) {
      return "I'm here. Tell me what happened, and we can figure out a thoughtful next step.";
    }
    return "Based on what you described, a calm, specific message is likely more helpful than a long explanation. If you'd like, I can draft a few versions for you to edit.";
  }
}
