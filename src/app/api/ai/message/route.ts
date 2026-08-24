import { z } from "zod";
import { requireUser } from "@/server/auth";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { generateMessage } from "@/ai/services";
import { track } from "@/lib/analytics";

const schema = z.object({
  intent: z.string().min(1).max(2000),
  category: z.string(),
  tone: z.string().optional(),
  length: z.string().optional(),
  soundLikeMe: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());
    const data = await generateMessage(user.id, body);
    await track("messages_generated", user.id);
    return jsonOk(data);
  } catch (error) {
    if (error instanceof Error && error.message === "AI_LIMIT") {
      return jsonError("You’ve reached today’s AI limit.", 429);
    }
    return handleApiError(error);
  }
}
