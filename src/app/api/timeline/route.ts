import { requireUser } from "@/server/auth";
import { handleApiError, jsonOk } from "@/lib/api";
import { buildRelationshipTimeline } from "@/engine/timeline";

export async function GET() {
  try {
    const user = await requireUser();
    const items = await buildRelationshipTimeline(user.id);
    return jsonOk(items);
  } catch (error) {
    return handleApiError(error);
  }
}
