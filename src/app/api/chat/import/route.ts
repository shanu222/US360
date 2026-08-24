import { z } from "zod";
import { requireUser } from "@/server/auth";
import { db } from "@/lib/db";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { parseWhatsAppChat } from "@/chat/parse";
import { analyzeWhatsAppChat } from "@/chat/analyze";
import { persistChatAnalysis } from "@/chat/persist";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const maxDuration = 60;

const schema = z.object({
  fileName: z.string().min(1).max(240),
  chatFileName: z.string().optional(),
  text: z.string().min(20).max(8_000_000),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const limited = rateLimit(`chat-import:${user.id}`, 4, 60_000);
    if (!limited.success) return jsonError("Please wait a moment before importing again.", 429);
    const ipLimit = rateLimit(`chat-import-ip:${clientIp(req.headers)}`, 8, 60_000);
    if (!ipLimit.success) return jsonError("Please wait a moment before importing again.", 429);

    const body = schema.parse(await req.json());
    const messages = parseWhatsAppChat(body.text);
    if (messages.length < 3) {
      return jsonError("That file did not look like a WhatsApp chat export. Use the ZIP from WhatsApp → Export chat.");
    }

    const relationship = await db.relationship.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });

    const analysis = analyzeWhatsAppChat(messages, {
      userName: user.name,
      fileName: body.fileName,
      partnerHint: relationship?.partnerName,
    });
    const saved = await persistChatAnalysis({
      userId: user.id,
      userName: user.name,
      fileName: body.fileName,
      chatFileName: body.chatFileName,
      analysis,
      messages,
    });
    return jsonOk({
      importId: saved.importId,
      summary: analysis.summary,
      partnerName: analysis.partnerName,
      messageCount: analysis.messageCount,
      facts: analysis.facts.length,
      likes: analysis.likes,
      dislikes: analysis.dislikes,
      foods: analysis.foods,
      places: analysis.places,
      topics: analysis.topics,
      communicationStyle: analysis.communicationStyle,
      calendarEvents: analysis.calendarEvents.filter((e) => e.confidence === "high").length,
      pendingCalendar: analysis.calendarEvents.filter((e) => e.confidence !== "high").length,
      reelQueries: analysis.reelQueries,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET() {
  try {
    const user = await requireUser();
    const latest = await db.chatImport.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fileName: true,
        partnerName: true,
        messageCount: true,
        firstAt: true,
        lastAt: true,
        stats: true,
        analysis: true,
        createdAt: true,
      },
    });
    return jsonOk(latest);
  } catch (error) {
    return handleApiError(error);
  }
}
