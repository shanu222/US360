import { z } from "zod";
import { Prisma, type RecommendationType } from "@prisma/client";
import { requireUser } from "@/server/auth";
import { db } from "@/lib/db";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { analyzeSituation, extractMemorySuggestion } from "@/ai/services";
import { track } from "@/lib/analytics";
import { rateLimit } from "@/lib/rate-limit";

const RECS = [
  "APOLOGIZE",
  "TALK_CALMLY",
  "GIVE_SPACE",
  "CLARIFY",
  "APPRECIATE",
  "DO_SOMETHING_THOUGHTFUL",
  "WAIT_BEFORE_RESPONDING",
  "TALK_IN_PERSON",
  "NO_ACTION_NEEDED",
] as const;

function asRecommendation(value: string): RecommendationType {
  const key = value.toUpperCase().replaceAll(" ", "_");
  return (RECS as readonly string[]).includes(key) ? (key as RecommendationType) : "TALK_CALMLY";
}

const schema = z.object({
  description: z.string().min(3).max(4000),
  howUserFeels: z.string().optional(),
  whatUserWants: z.string().optional(),
  afterArgument: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const limited = rateLimit(`ai:${user.id}`, 20, 60_000);
    if (!limited.success) return jsonError("Please wait a moment before another analysis.", 429);

    const body = schema.parse(await req.json());
    const analysis = await analyzeSituation(user.id, body);
    const relationship = user.relationships[0];

    const situation = await db.situation.create({
      data: {
        userId: user.id,
        relationshipId: relationship?.id,
        description: body.description,
        howUserFeels: body.howUserFeels,
        whatUserWants: body.whatUserWants,
        afterArgument: Boolean(body.afterArgument),
        status: "OPEN",
        analysis: {
          create: {
            recommendation: asRecommendation(analysis.recommendation),
            confidence: analysis.confidence || "medium",
            summary: analysis.summary,
            reasoningSummary: analysis.reasoning_summary || analysis.summary,
            avoid: analysis.avoid ?? [],
            nextStep: analysis.next_step || "Send a short, specific message when you’re ready.",
            suggestedMessage: analysis.suggested_message,
            gesture: analysis.gesture,
            needsSpace: Boolean(analysis.needs_space),
            rawJson: analysis as unknown as Prisma.InputJsonValue,
          },
        },
      },
    });

    let remember = analysis.remember ?? [];
    if (!remember.length) {
      const hint = await extractMemorySuggestion(user.id, body.description);
      if (hint.suggest && hint.title) {
        remember = [{ title: hint.title, content: hint.content ?? body.description, category: hint.category }];
      }
    }

    await track("ai_analysis_request", user.id, { feature: "situation" });
    return jsonOk({ situationId: situation.id, analysis: { ...analysis, remember } });
  } catch (error) {
    if (error instanceof Error && error.message === "AI_LIMIT") {
      return jsonError("You’ve reached today’s AI limit. You can still write manually.", 429);
    }
    return handleApiError(error);
  }
}
