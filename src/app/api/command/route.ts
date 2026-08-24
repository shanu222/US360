import { z } from "zod";
import { requireUser } from "@/server/auth";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { runCommand, savePendingEvent } from "@/engine/run";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  command: z.string().min(2).max(4000),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const limited = rateLimit(`command:${user.id}`, 20, 60_000);
    if (!limited.success) return jsonError("Please wait a moment before another command.", 429);
    const body = schema.parse(await req.json());
    const result = await runCommand({ userId: user.id, command: body.command });
    return jsonOk(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET() {
  try {
    const user = await requireUser();
    const runs = await db.commandRun.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 12,
      include: { feedback: true },
    }).catch(() => []);
    return jsonOk(runs);
  } catch (error) {
    return handleApiError(error);
  }
}
