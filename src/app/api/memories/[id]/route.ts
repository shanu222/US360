import { requireUser, getPrimaryRelationship } from "@/server/auth";
import { db } from "@/lib/db";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const relationship = await getPrimaryRelationship(user.id);
    const memory = await db.relationshipMemory.findFirst({
      where: { id, relationshipId: relationship?.id },
    });
    if (!memory) return jsonError("Not found", 404);
    await db.relationshipMemory.delete({ where: { id } });
    return jsonOk({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
