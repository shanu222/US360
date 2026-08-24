import { z } from "zod";
import { requireUser } from "@/server/auth";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { reviewTone } from "@/ai/services";
import { track } from "@/lib/analytics";

const schema = z.object({ message: z.string().min(1).max(4000) });

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());
    const data = await reviewTone(user.id, body.message);
    await track("ai_analysis_request", user.id, { feature: "tone" });
    return jsonOk(data);
  } catch (error) {
    if (error instanceof Error && error.message === "AI_LIMIT") {
      return jsonError("You’ve reached today’s AI limit.", 429);
    }
    return handleApiError(error);
  }
}
