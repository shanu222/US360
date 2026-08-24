import { requireUser, getPrimaryRelationship } from "@/server/auth";
import { db } from "@/lib/db";
import { handleApiError, jsonOk } from "@/lib/api";

export async function DELETE() {
  try {
    const user = await requireUser();
    const relationship = await getPrimaryRelationship(user.id);
    if (relationship) {
      await db.relationshipMemory.deleteMany({ where: { relationshipId: relationship.id } });
    }
    return jsonOk({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
