import { z } from "zod";
import { Prisma } from "@prisma/client";
import { requireUser } from "@/server/auth";
import { db } from "@/lib/db";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { generateGiftIdeas } from "@/ai/services";
import { track } from "@/lib/analytics";

const schema = z.object({
  occasion: z.string(),
  budget: z.string(),
  timeAvailable: z.string(),
  interests: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());
    const data = await generateGiftIdeas(user.id, body);
    await db.giftSuggestion.create({
      data: { userId: user.id, occasion: body.occasion, budget: body.budget, ideas: data.ideas as unknown as Prisma.InputJsonValue },
    });
    await track("ideas_viewed", user.id, { feature: "gifts" });
    return jsonOk(data);
  } catch (error) {
    if (error instanceof Error && error.message === "AI_LIMIT") {
      return jsonError("You’ve reached today’s AI limit.", 429);
    }
    return handleApiError(error);
  }
}
