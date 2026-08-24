import { z } from "zod";
import { requireUser } from "@/server/auth";
import { db } from "@/lib/db";
import { handleApiError, jsonOk } from "@/lib/api";

const schema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string(), auth: z.string() }),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());
    await db.pushSubscription.upsert({
      where: { endpoint: body.endpoint },
      update: { userId: user.id, p256dh: body.keys.p256dh, auth: body.keys.auth },
      create: { userId: user.id, endpoint: body.endpoint, p256dh: body.keys.p256dh, auth: body.keys.auth },
    });
    return jsonOk({ subscribed: true });
  } catch (error) {
    return handleApiError(error);
  }
}
