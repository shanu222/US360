import { requireUser } from "@/server/auth";
import { handleApiError, jsonOk } from "@/lib/api";
import { disconnectGmail, gmailStatus } from "@/integrations/gmail";

export async function GET() {
  try {
    const user = await requireUser();
    return jsonOk(await gmailStatus(user.id));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE() {
  try {
    const user = await requireUser();
    await disconnectGmail(user.id);
    return jsonOk({ disconnected: true });
  } catch (error) {
    return handleApiError(error);
  }
}
