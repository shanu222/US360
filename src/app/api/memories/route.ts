import { z } from "zod";
import { requireUser, getPrimaryRelationship } from "@/server/auth";
import { db } from "@/lib/db";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import type { MemoryCategory, Importance } from "@prisma/client";

const schema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  category: z.string().optional(),
  importance: z.string().optional(),
});

export async function GET() {
  try {
    const user = await requireUser();
    const relationship = await getPrimaryRelationship(user.id);
    if (!relationship) return jsonOk([]);
    const items = await db.relationshipMemory.findMany({
      where: { relationshipId: relationship.id },
      orderBy: { createdAt: "desc" },
    });
    return jsonOk(items);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const relationship = await getPrimaryRelationship(user.id);
    if (!relationship) return jsonError("Complete onboarding first.");
    const body = schema.parse(await req.json());
    const item = await db.relationshipMemory.create({
      data: {
        relationshipId: relationship.id,
        title: body.title,
        content: body.content,
        category: (body.category as MemoryCategory) || "GENERAL",
        importance: (body.importance as Importance) || "MEDIUM",
      },
    });
    return jsonOk(item);
  } catch (error) {
    return handleApiError(error);
  }
}
