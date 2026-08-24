import { requireUser } from "@/server/auth";
import { db } from "@/lib/db";
import { handleApiError, jsonOk } from "@/lib/api";

export async function POST() {
  try {
    const user = await requireUser();
    await db.onboardingState.upsert({
      where: { userId: user.id },
      update: { chatImportStatus: "SKIPPED" },
      create: { userId: user.id, completed: true, step: 8, chatImportStatus: "SKIPPED", completedAt: new Date() },
    });
    return jsonOk({ skipped: true });
  } catch (error) {
    return handleApiError(error);
  }
}
