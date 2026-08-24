import { z } from "zod";
import { requireUser } from "@/server/auth";
import { db } from "@/lib/db";
import { handleApiError, jsonOk } from "@/lib/api";
import type { RecommendationType } from "@prisma/client";

const schema = z.object({
  command: z.string(),
  summary: z.string(),
  approach: z.string(),
  avoid: z.array(z.string()),
  message: z.string().optional(),
  recommendation: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());
    const key = (body.recommendation ?? "TALK_CALMLY").replaceAll(" ", "_").toUpperCase();
    const rec = (
      {
        APOLOGIZE: "APOLOGIZE",
        GIVE_SPACE: "GIVE_SPACE",
        CLARIFY: "CLARIFY",
        SUPPORT: "DO_SOMETHING_THOUGHTFUL",
        ENCOURAGE: "SUGGEST_MESSAGE",
        APPRECIATE: "APPRECIATE",
        CELEBRATE: "SUGGEST_CARD",
        CHECK_IN: "SUGGEST_MESSAGE",
        WAIT: "WAIT",
        NO_ACTION: "NO_ACTION_NEEDED",
      } as Record<string, RecommendationType>
    )[key] ?? "TALK_CALMLY";
    const situation = await db.situation.create({
      data: {
        userId: user.id,
        relationshipId: user.relationships[0]?.id,
        description: body.command.slice(0, 2000),
        category: "command",
        analysis: {
          create: {
            recommendation: rec,
            confidence: "high",
            summary: body.summary,
            reasoningSummary: body.approach,
            avoid: body.avoid,
            nextStep: body.approach,
            suggestedMessage: body.message,
            needsSpace: /space/i.test(body.recommendation ?? ""),
          },
        },
      },
    });
    return jsonOk(situation);
  } catch (error) {
    return handleApiError(error);
  }
}
