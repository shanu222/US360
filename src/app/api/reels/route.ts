import { z } from "zod";
import { requireUser } from "@/server/auth";
import { db } from "@/lib/db";
import { handleApiError, jsonOk } from "@/lib/api";
import { track } from "@/lib/analytics";
import type { ReelCategory } from "@prisma/client";

const schema = z.object({
  url: z.string().url(),
  category: z.string(),
  notes: z.string().optional(),
  favorite: z.boolean().optional(),
});

export async function GET() {
  try {
    const user = await requireUser();
    const reels = await db.reel.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
    return jsonOk(reels);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());
    const reel = await db.reel.create({
      data: {
        userId: user.id,
        relationshipId: user.relationships[0]?.id,
        url: body.url,
        category: body.category as ReelCategory,
        notes: body.notes,
        favorite: body.favorite ?? false,
      },
    });
    await track("reels_saved", user.id);
    return jsonOk(reel);
  } catch (error) {
    return handleApiError(error);
  }
}
