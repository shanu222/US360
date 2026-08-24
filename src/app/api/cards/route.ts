import { z } from "zod";
import { requireUser } from "@/server/auth";
import { db } from "@/lib/db";
import { handleApiError, jsonOk } from "@/lib/api";
import { generateCardCopy } from "@/ai/services";
import { pickTheme, renderCardHtml } from "@/ai/cards";
import { composeChatCard, localCardCopy } from "@/ai/local-replies";
import { fingerprint } from "@/lib/crypto";
import { track } from "@/lib/analytics";
import { getLatestChatImport } from "@/chat/queries";
import { CARD_CATEGORIES } from "@/types";
import type { CardCategory } from "@prisma/client";

const schema = z.object({
  category: z.enum(CARD_CATEGORIES),
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
    const partnerName = user.relationships[0]?.partnerName;
    const recent = await db.card.findMany({
      where: { userId: user.id, category: body.category as CardCategory },
      orderBy: { createdAt: "desc" },
      take: 8,
    });
    const theme = body.theme
      ? { id: body.theme }
      : pickTheme(body.category, recent.map((c) => c.theme));

    const imported = await getLatestChatImport(user.id);
    const analysis = (imported?.analysis ?? {}) as {
      likes?: string[];
      foods?: string[];
      topics?: { topic: string; count: number }[];
      missYouCount?: number;
      notable?: { text: string }[];
      communicationStyle?: string[];
    };
    const stats = (imported?.stats ?? {}) as { missYouCount?: number };

    const custom = body.message?.trim();
    let copy = custom ? { message: custom, kicker: body.occasion ?? "" } : null;
    if (!copy && (analysis.likes?.length || analysis.foods?.length || analysis.topics?.length)) {
      copy = composeChatCard({
        category: body.category,
        partnerName,
        likes: analysis.likes,
        foods: analysis.foods,
        topics: analysis.topics,
        missYouCount: stats.missYouCount,
        notable: analysis.notable,
        communicationStyle: analysis.communicationStyle,
      });
    }
    if (!copy) {
      try {
        copy = await generateCardCopy(user.id, {
          category: body.category,
          theme: theme.id,
          occasion: body.occasion,
        });
      } catch {
        copy = null;
      }
    }
    if (!copy?.message) {
      copy = localCardCopy(body.category, theme.id, partnerName ?? undefined);
    }

    const html = renderCardHtml({
      message: copy.message,
      themeId: theme.id,
      partnerName,
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
