import { requireUser } from "@/server/auth";
import { db } from "@/lib/db";
import { handleApiError, jsonOk } from "@/lib/api";

export async function DELETE() {
  try {
    const user = await requireUser();
    await db.user.delete({ where: { id: user.id } });
    return jsonOk({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
