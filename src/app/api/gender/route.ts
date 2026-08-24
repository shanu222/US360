import { z } from "zod";
import { requireUser } from "@/server/auth";
import { db } from "@/lib/db";
import { handleApiError, jsonOk } from "@/lib/api";
import { parseGender } from "@/lib/voice";

const schema = z.object({
  userGender: z.enum(["male", "female"]),
  partnerGender: z.enum(["male", "female"]),
  partnerName: z.string().min(1).optional(),
});

export async function PUT(req: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());
    await db.user.update({
      where: { id: user.id },
      data: { gender: body.userGender },
    });
    let relationship = await db.relationship.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "asc" } });
    if (!relationship) {
      relationship = await db.relationship.create({
        data: {
          userId: user.id,
          partnerName: body.partnerName || "Partner",
          partnerGender: body.partnerGender,
        },
      });
    } else {
      await db.relationship.update({
        where: { id: relationship.id },
        data: {
          partnerGender: body.partnerGender,
          ...(body.partnerName ? { partnerName: body.partnerName } : {}),
        },
      });
    }
    return jsonOk({ ok: true, userGender: parseGender(body.userGender), partnerGender: parseGender(body.partnerGender) });
  } catch (error) {
    return handleApiError(error);
  }
}
