import { z } from "zod";
import { requireUser } from "@/server/auth";
import { db } from "@/lib/db";
import { handleApiError, jsonOk } from "@/lib/api";

const schema = z.object({
  commandRunId: z.string(),
  helpful: z.boolean().optional(),
  sent: z.boolean().optional(),
  outcome: z.enum(["HELPFUL", "NOT_HELPFUL", "SENT", "NOT_SENT", "POSITIVE_RESPONSE", "NO_RESPONSE"]).optional(),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());
    const run = await db.commandRun.findFirst({ where: { id: body.commandRunId, userId: user.id } });
    if (!run) return handleApiError(new Error("UNAUTHORIZED"));
    const helpful =
      body.helpful ??
      (body.outcome === "HELPFUL" || body.outcome === "POSITIVE_RESPONSE" ? true : body.outcome === "NOT_HELPFUL" ? false : undefined);
    const sent = body.sent ?? (body.outcome === "SENT" || body.outcome === "POSITIVE_RESPONSE" ? true : body.outcome === "NOT_SENT" ? false : undefined);
    const row = await db.commandFeedback.upsert({
      where: { commandRunId: body.commandRunId },
      update: { helpful, sent, outcome: body.outcome },
      create: { commandRunId: body.commandRunId, userId: user.id, helpful, sent, outcome: body.outcome },
    });
    return jsonOk(row);
  } catch (error) {
    return handleApiError(error);
  }
}
