import { z } from "zod";
import { requireUser } from "@/server/auth";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { generateSmileIdeas } from "@/ai/services";
import { track } from "@/lib/analytics";

const schema = z.object({
  budget: z.string().optional(),
  time: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());
    const data = await generateSmileIdeas(user.id, body);
    await track("ideas_viewed", user.id, { feature: "smile" });
    return jsonOk(data);
  } catch (error) {
    if (error instanceof Error && error.message === "AI_LIMIT") {
      return jsonError("You’ve reached today’s AI limit.", 429);
    }
    return handleApiError(error);
  }
}
