import { requireUser } from "@/server/auth";
import { handleApiError, jsonOk } from "@/lib/api";
import { platformStatus } from "@/integrations/platforms";

export async function GET() {
  try {
    const user = await requireUser();
    return jsonOk(await platformStatus(user.id));
  } catch (error) {
    return handleApiError(error);
  }
}
