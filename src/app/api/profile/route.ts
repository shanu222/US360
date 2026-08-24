import { z } from "zod";
import { requireUser } from "@/server/auth";
import { db } from "@/lib/db";
import { handleApiError, jsonOk } from "@/lib/api";
import { profileFields } from "@/engine/profile-fields";
import { parseGender } from "@/lib/voice";

const schema = z.object({
  partnerName: z.string().optional(),
  communicationStyle: z.string().optional(),
  values: z.record(z.string()).optional(),
  userGender: z.enum(["male", "female"]).optional(),
  partnerGender: z.enum(["male", "female"]).optional(),
});

export async function GET() {
  try {
    const user = await requireUser();
    const relationship = await db.relationship.findFirst({
      where: { userId: user.id },
      include: { preferences: true, favorites: true, dislikes: true, importantDates: true },
    });
    const values = Object.fromEntries((relationship?.preferences ?? []).map((p) => [p.key, p.value]));
    const partnerGender = parseGender(relationship?.partnerGender);
    return jsonOk({
      fields: profileFields(partnerGender),
      partnerName: relationship?.partnerName ?? "",
      communicationStyle: relationship?.communicationStyle ?? "",
      userGender: parseGender(user.gender),
      partnerGender,
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
    if (body.userGender) {
      await db.user.update({ where: { id: user.id }, data: { gender: body.userGender } });
    }
    let relationship = await db.relationship.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "asc" } });
    if (!relationship) {
      relationship = await db.relationship.create({
        data: { userId: user.id, partnerName: body.partnerName || "Partner", partnerGender: body.partnerGender },
      });
    } else if (body.partnerName || body.communicationStyle || body.partnerGender) {
      relationship = await db.relationship.update({
        where: { id: relationship.id },
        data: {
          partnerName: body.partnerName || relationship.partnerName,
          communicationStyle: body.communicationStyle ?? relationship.communicationStyle,
          partnerGender: body.partnerGender ?? relationship.partnerGender,
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
    const city = body.values?.user_city?.trim();
    if (city) {
      await db.user.update({ where: { id: user.id }, data: { city } });
    }
    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
