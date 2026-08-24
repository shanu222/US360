import { db } from "@/lib/db";

export async function getLatestChatImport(userId: string) {
  try {
    return await db.chatImport.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("chat import lookup failed", error);
    return null;
  }
}
