import { requireUser } from "@/server/auth";
import { handleApiError, jsonOk } from "@/lib/api";
import { getLatestChatImport } from "@/chat/queries";
import { instagramSearchUrl, reelQueriesFromChat } from "@/chat/dates";

export async function GET() {
  try {
    const user = await requireUser();
    const imported = await getLatestChatImport(user.id);
    const analysis = (imported?.analysis ?? {}) as {
      likes?: string[];
      foods?: string[];
      activities?: string[];
      places?: string[];
      topics?: { topic: string; count: number }[];
      reelQueries?: string[];
    };
    const queries = analysis.reelQueries?.length
      ? analysis.reelQueries
      : reelQueriesFromChat(analysis);
    return jsonOk(
      queries.map((query) => ({
        query,
        ...instagramSearchUrl(query),
      })),
    );
  } catch (error) {
    return handleApiError(error);
  }
}
