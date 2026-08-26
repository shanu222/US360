import { z } from "zod";
import { requireUser } from "@/server/auth";
import { db } from "@/lib/db";
import { handleApiError, jsonOk } from "@/lib/api";
import type { MessageCategory } from "@prisma/client";

const schema = z.object({
  content: z.string().min(1),
  category: z.string().optional(),
  approved: z.boolean().optional(),
});

export async function GET() {
  try {
    const user = await requireUser();
    const messages = await db.message.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 40,
    });
    return jsonOk(messages);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());
    const message = await db.message.create({
      data: {
        userId: user.id,
        relationshipId: user.relationships[0]?.id,
        content: body.content,
        category: (body.category as MessageCategory) || "CUSTOM",
        approved: body.approved ?? false,
      },
    });
    return jsonOk(message);
  } catch (error) {
    return handleApiError(error);
  }
}
