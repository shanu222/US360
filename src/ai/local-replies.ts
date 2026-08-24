import type { ChatMessage } from "@/ai/types";

export function composeChatCard(opts: {
  category: string;
  partnerName?: string | null;
  likes?: string[];
  foods?: string[];
  topics?: { topic: string; count: number }[];
  missYouCount?: number;
  notable?: { text: string }[];
  communicationStyle?: string[];
}) {
  const name = opts.partnerName?.split(" ")[0] || "you";
  const like = opts.likes?.[0];
  const food = opts.foods?.[0];
  const topic = opts.topics?.[0]?.topic;
  const bilingual = opts.communicationStyle?.includes("Bilingual");
  const lines: Record<string, string[]> = {
    GOOD_MORNING: [
      food ? `Good morning. I hope there’s ${food} in your day, and a little ease.` : `Good morning. I hope today treats ${name} kindly.`,
      bilingual ? `Subah bakhair. I’m in your corner today.` : `A quiet good morning — no performance, just care.`,
    ],
    GOOD_NIGHT: [
      `Sleep well. The day can stop here; you don’t have to carry it into the night.`,
      opts.missYouCount ? `Good night. I missed you in the ordinary hours, too.` : `Rest. I’ll still be here in the morning.`,
    ],
    ROMANTIC: [
      like ? `I keep you in the small details — even ${like}.` : `I keep thinking of you, without making a speech of it.`,
    ],
    APPRECIATION: [
      topic ? `Thank you for how you hold ${topic}. I notice.` : `Thank you for the way you show up. I notice it.`,
    ],
    MISS_YOU: [`I miss you — simply, without making it heavy.`],
    THINKING_OF_YOU: [food ? `Thinking of you, and of ${food} together.` : `Just a quiet note: you’re on my mind.`],
    SORRY: [`I’m sorry. You deserved better from me in that moment.`],
    CUSTOM: [opts.notable?.[0]?.text ? clipLine(opts.notable[0].text) : `A small note, in my own words, because you matter.`],
  };
  const pool = lines[opts.category] ?? lines.CUSTOM;
  return { message: pool[0], kicker: like || food || topic || "" };
}

function clipLine(value: string) {
  const v = value.replace(/\s+/g, " ").trim();
  return v.length > 90 ? `${v.slice(0, 89).trim()}…` : v;
}

export function localCardCopy(category: string, themeLabel: string, partnerName?: string) {
  const name = partnerName || "you";
  const byCategory: Record<string, string> = {
    GOOD_MORNING: `Good morning. I hope today treats ${name} kindly.`,
    GOOD_NIGHT: `Sleep well. I’m glad you’re in my ordinary days.`,
    ROMANTIC: `I keep thinking of you — not as a performance, just honestly.`,
    APPRECIATION: `Thank you for the way you show up. I notice it.`,
    SORRY: `I’m sorry. You deserved better from me in that moment.`,
    BIRTHDAY: `Happy birthday. I hope this year feels like it belongs to you.`,
    ANNIVERSARY: `Another year of choosing each other in the small hours, too.`,
    CONGRATULATIONS: `I’m proud of you. This one is yours.`,
    MOTIVATION: `You don’t have to be impressive today. Showing up is enough.`,
    THINKING_OF_YOU: `Just a quiet note: you’re on my mind.`,
    MISS_YOU: `I miss you — simply, without making it heavy.`,
    CUSTOM: `A small note, in my own words, because you matter.`,
  };
  return {
    message: byCategory[category] ?? byCategory.CUSTOM,
    kicker: themeLabel,
  };
}

export function localMessages(intent: string, category: string) {
  void category;
  const base = intent.trim() || "I wanted to say this carefully.";
  return {
    messages: [
      base,
      `${base} I don’t want to rush this — I just wanted you to know.`,
      `A shorter version: ${base.slice(0, 140)}`,
    ],
  };
}

export function localWeeklyFocus() {
  return {
    title: "Listen all the way through",
    body: "This week, practice finishing her sentence in your head before you answer. The work is patience, not a speech.",
  };
}

export function localGiftIdeas() {
  return {
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
  };
}

export function localToneReview() {
  return {
    risk: "medium",
    labels: ["worth a pause"],
    headline: "This can stay honest without landing sharp.",
    explanation:
      "Based on the wording, a calmer version can keep your point and leave more room for her to hear it.",
    alternatives: [
      { style: "soft", text: "I'm feeling hurt and need a little time. Can we talk about this when we're both calmer?" },
      { style: "natural", text: "I care about this, and I don't want to say something I'll regret. Can we pause and come back to it?" },
      { style: "direct", text: "I disagree, and I also don't want this to turn into a fight. Let's talk properly." },
      { style: "short", text: "I need a minute. I do care — I just don't want to make this worse." },
      { style: "apologetic", text: "I'm sorry — that came out sharper than I meant. I care, and I want to talk this through." },
    ],
  };
}

export function localSituation(last: string) {
  const lower = last.toLowerCase();
  return {
    recommendation: lower.includes("forgot") || lower.includes("argument") || lower.includes("sorry") ? "APOLOGIZE" : "TALK_CALMLY",
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
  };
}

export function localMemoryHint() {
  return { suggest: false };
}

/** Pick a valid JSON payload from the prompt so every studio keeps working without an API key. */
export function localJsonForPrompt(messages: ChatMessage[]) {
  const blob = messages.map((m) => m.content).join("\n").toLowerCase();
  const last = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

  if (blob.includes("short elegant card") || blob.includes("theme:") || blob.includes("kicker")) {
    const category = last.match(/category:\s*([a-z_]+)/i)?.[1] ?? "CUSTOM";
    const theme = last.match(/theme:\s*([^.\n]+)/i)?.[1]?.trim() ?? "Card";
    return localCardCopy(category.toUpperCase(), theme);
  }
  if (blob.includes("write 3 suggested") || blob.includes("what i want to say")) {
    const intent = last.replace(/^[\s\S]*what i want to say:\s*/i, "").trim() || last;
    const category = last.match(/category:\s*([a-z_]+)/i)?.[1] ?? "CUSTOM";
    return localMessages(intent, category);
  }
  if (blob.includes("weekly") || blob.includes("this week's focus") || blob.includes("better partner")) {
    return localWeeklyFocus();
  }
  if (blob.includes("durable personal fact") || blob.includes("suggest: true")) {
    return localMemoryHint();
  }
  if (blob.includes("review the user's draft") || blob.includes("draft message")) {
    return localToneReview();
  }
  if (blob.includes("gift") || blob.includes("budget") || blob.includes("make her smile")) {
    return localGiftIdeas();
  }
  return localSituation(last);
}
