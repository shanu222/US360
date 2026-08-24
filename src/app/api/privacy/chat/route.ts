import { requireUser } from "@/server/auth";
import { db } from "@/lib/db";
import { handleApiError, jsonOk } from "@/lib/api";

export async function DELETE() {
  try {
    const user = await requireUser();
    await db.chatImport.deleteMany({ where: { userId: user.id } });
    await db.onboardingState.updateMany({
      where: { userId: user.id },
      data: { chatImportStatus: "PENDING" },
    });
    return jsonOk({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
