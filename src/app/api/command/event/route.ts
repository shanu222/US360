import { z } from "zod";
import { requireUser } from "@/server/auth";
import { handleApiError, jsonOk } from "@/lib/api";
import { savePendingEvent } from "@/engine/run";

const schema = z.object({
  title: z.string().min(1),
  type: z.string(),
  startAt: z.string(),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());
    const event = await savePendingEvent(user.id, body);
    return jsonOk(event);
  } catch (error) {
    return handleApiError(error);
  }
}
