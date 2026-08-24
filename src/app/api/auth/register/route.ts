import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export async function POST(req: Request) {
  try {
    const limited = rateLimit(`register:${clientIp(req.headers)}`, 8, 60_000);
    if (!limited.success) return jsonError("Please wait a moment before trying again.", 429);

    const body = schema.parse(await req.json());
    const email = body.email.toLowerCase();
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) return jsonError("An account with this email already exists.");

    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await db.user.create({
      data: {
        email,
        name: body.name,
        passwordHash,
        settings: { create: {} },
        onboarding: { create: { step: 1 } },
      },
    });
    return jsonOk({ id: user.id });
  } catch (error) {
    return handleApiError(error);
  }
}
