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
        writingStyle: true,
      },
    });
    const { passwordHash, ...safe } = full ?? {};
    void passwordHash;
    return new Response(JSON.stringify(safe, null, 2), {
      headers: {
        "content-type": "application/json",
        "content-disposition": "attachment; filename=us360-export.json",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
