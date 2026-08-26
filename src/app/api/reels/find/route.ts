import { z } from "zod";
import { requireUser } from "@/server/auth";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { loadEngineContext } from "@/engine/context";
import { parseCommand } from "@/engine/parse";
import { suggestReels } from "@/engine/reels";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  moment: z.string().min(2).max(4000),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const limited = rateLimit(`reels-find:${user.id}`, 20, 60_000);
    if (!limited.success) return jsonError("Please wait a moment before another search.", 429);
    const body = schema.parse(await req.json());
    const ctx = await loadEngineContext(user.id);
    const parsed = parseCommand(body.moment, ctx.lastParse, ctx.now);
    const reels = suggestReels({
      emotion: parsed.primaryEmotion,
      situation: parsed.primarySituation,
      likes: [...ctx.profile.likes, ...ctx.chat.likes],
      foods: [...ctx.profile.foods, ...ctx.chat.foods],
      topics: ctx.chat.topics,
      calms: ctx.profile.calms,
      movies: ctx.profile.movies,
      songs: ctx.profile.songs,
      reelQueries: ctx.chat.reelQueries,
    });
    return jsonOk({ reels, heard: parsed.raw });
  } catch (error) {
    return handleApiError(error);
  }
}
