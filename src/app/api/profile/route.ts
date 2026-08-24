import { z } from "zod";
import { requireUser } from "@/server/auth";
import { db } from "@/lib/db";
import { handleApiError, jsonOk } from "@/lib/api";
import { PROFILE_FIELDS } from "@/engine/profile-fields";

const schema = z.object({
  partnerName: z.string().optional(),
  communicationStyle: z.string().optional(),
  values: z.record(z.string()).optional(),
});

export async function GET() {
  try {
    const user = await requireUser();
    const relationship = await db.relationship.findFirst({
      where: { userId: user.id },
      include: { preferences: true, favorites: true, dislikes: true, importantDates: true },
    });
    const values = Object.fromEntries((relationship?.preferences ?? []).map((p) => [p.key, p.value]));
    return jsonOk({
      fields: PROFILE_FIELDS,
      partnerName: relationship?.partnerName ?? "",
      communicationStyle: relationship?.communicationStyle ?? "",
      values,
      favorites: relationship?.favorites ?? [],
      dislikes: relationship?.dislikes ?? [],
      importantDates: relationship?.importantDates ?? [],
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());
    let relationship = await db.relationship.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "asc" } });
    if (!relationship) {
      relationship = await db.relationship.create({
        data: { userId: user.id, partnerName: body.partnerName || "Partner" },
      });
    } else if (body.partnerName || body.communicationStyle) {
      relationship = await db.relationship.update({
        where: { id: relationship.id },
        data: {
          partnerName: body.partnerName || relationship.partnerName,
          communicationStyle: body.communicationStyle ?? relationship.communicationStyle,
        },
      });
    }
    for (const [key, value] of Object.entries(body.values ?? {})) {
      await db.preference.upsert({
        where: { relationshipId_key: { relationshipId: relationship.id, key } },
        update: { value },
        create: { relationshipId: relationship.id, key, value },
      });
    }
    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
