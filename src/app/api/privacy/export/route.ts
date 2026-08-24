import { requireUser } from "@/server/auth";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireUser();
    const full = await db.user.findUnique({
      where: { id: user.id },
      include: {
        relationships: { include: { memories: true, favorites: true, dislikes: true, importantDates: true } },
        settings: true,
        calendarEvents: true,
        cards: true,
        messages: true,
        reels: true,
        situations: true,
        chatImports: { select: { id: true, fileName: true, partnerName: true, messageCount: true, firstAt: true, lastAt: true, stats: true, analysis: true, createdAt: true } },
        commandRuns: { select: { id: true, command: true, emotion: true, situation: true, recommendation: true, createdAt: true, feedback: true } },
        writingStyle: true,
      },
    });
    const gmail = full
      ? await db.integrationAccount.findUnique({
          where: { userId_provider: { userId: user.id, provider: "gmail" } },
          select: { status: true, metadata: true, scopes: true, createdAt: true, updatedAt: true },
        })
      : null;
    const { passwordHash, ...safe } = full ?? {};
    void passwordHash;
    const payload = {
      ...safe,
      gmail: gmail
        ? {
            status: gmail.status,
            email: (gmail.metadata as { email?: string } | null)?.email ?? null,
            scopes: gmail.scopes,
            createdAt: gmail.createdAt,
            updatedAt: gmail.updatedAt,
          }
        : null,
    };
    return new Response(JSON.stringify(payload, null, 2), {
      headers: {
        "content-type": "application/json",
        "content-disposition": "attachment; filename=us360-export.json",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
