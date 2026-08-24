import { z } from "zod";
import { requireUser } from "@/server/auth";
import { db } from "@/lib/db";
import { handleApiError, jsonOk } from "@/lib/api";

const schema = z.object({ samples: z.string().min(1).max(8000) });

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());
    const style = await db.writingStyle.upsert({
      where: { userId: user.id },
      update: { samples: body.samples },
      create: { userId: user.id, samples: body.samples },
    });
    return jsonOk({ id: style.id });
  } catch (error) {
    return handleApiError(error);
  }
}
