import { z } from "zod";
import { requireUser } from "@/server/auth";
import { db } from "@/lib/db";
import { handleApiError, jsonOk } from "@/lib/api";
import { generateCardCopy } from "@/ai/services";
import { pickTheme, renderCardHtml } from "@/ai/cards";
import { fingerprint } from "@/lib/crypto";
import { track } from "@/lib/analytics";
import type { CardCategory } from "@prisma/client";

const schema = z.object({
  category: z.string(),
  theme: z.string().optional(),
  message: z.string().optional(),
  occasion: z.string().optional(),
});

export async function GET() {
  try {
    const user = await requireUser();
    const cards = await db.card.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 40 });
    return jsonOk(cards);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());
    const recent = await db.card.findMany({
      where: { userId: user.id, category: body.category as CardCategory },
      orderBy: { createdAt: "desc" },
      take: 8,
    });
    const theme = body.theme
      ? { id: body.theme }
      : pickTheme(body.category, recent.map((c) => c.theme));

    const copy = body.message
      ? { message: body.message, kicker: body.occasion ?? theme.id }
      : await generateCardCopy(user.id, { category: body.category, theme: theme.id, occasion: body.occasion });

    const html = renderCardHtml({
      message: copy.message,
      themeId: theme.id,
      partnerName: user.relationships[0]?.partnerName,
      occasion: copy.kicker,
    });
    const fp = fingerprint([user.id, body.category, theme.id, copy.message]);
    const existing = await db.card.findFirst({ where: { userId: user.id, fingerprint: fp } });
    if (existing) return jsonOk(existing);

    const card = await db.card.create({
      data: {
        userId: user.id,
        relationshipId: user.relationships[0]?.id,
        category: body.category as CardCategory,
        theme: theme.id,
        message: copy.message,
        html,
        status: "READY",
        fingerprint: fp,
      },
    });
    await track("cards_generated", user.id, { category: body.category });
    return jsonOk(card);
  } catch (error) {
    return handleApiError(error);
  }
}
