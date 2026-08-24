import { requireUser } from "@/server/auth";
import { db } from "@/lib/db";
import { handleApiError, jsonOk } from "@/lib/api";
import { instagramConfigured } from "@/integrations/instagram";

export async function GET() {
  try {
    const user = await requireUser();
    const account = await db.integrationAccount.findUnique({
      where: { userId_provider: { userId: user.id, provider: "instagram" } },
    });
    return jsonOk({
      configured: instagramConfigured(),
      connected: account?.status === "connected",
      status: account?.status ?? "disconnected",
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE() {
  try {
    const user = await requireUser();
    await db.integrationAccount.deleteMany({ where: { userId: user.id, provider: "instagram" } });
    return jsonOk({ disconnected: true });
  } catch (error) {
    return handleApiError(error);
  }
}
