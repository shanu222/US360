import { requireUser } from "@/server/auth";
import { db } from "@/lib/db";
import { handleApiError, jsonOk } from "@/lib/api";

export async function DELETE() {
  try {
    const user = await requireUser();
    await db.relationship.deleteMany({ where: { userId: user.id } });
    await db.calendarEvent.deleteMany({ where: { userId: user.id } });
    await db.card.deleteMany({ where: { userId: user.id } });
    await db.message.deleteMany({ where: { userId: user.id } });
    await db.reel.deleteMany({ where: { userId: user.id } });
    await db.situation.deleteMany({ where: { userId: user.id } });
    return jsonOk({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
