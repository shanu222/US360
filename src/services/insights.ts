import { db } from "@/lib/db";

export async function computeInsights(userId: string) {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const situations = await db.situation.findMany({
    where: { userId, createdAt: { gte: start } },
    include: { analysis: true },
  });

  const resolved = situations.filter((s) => s.status === "RESOLVED").length;
  const unresolved = situations.filter((s) => s.status === "UNRESOLVED" || s.status === "OPEN").length;
  const topics = new Map<string, number>();
  for (const s of situations) {
    const key = s.category || s.analysis?.recommendation || "unspecified";
    topics.set(key, (topics.get(key) ?? 0) + 1);
  }
  const recurring = [...topics.entries()].sort((a, b) => b[1] - a[1])[0];

  const cards = await db.card.count({ where: { userId, createdAt: { gte: start } } });
  const messages = await db.message.count({ where: { userId, createdAt: { gte: start } } });
  const reels = await db.reel.count({ where: { userId, createdAt: { gte: start } } });

  const data = {
    period: start.toISOString().slice(0, 7),
    situationsRecorded: situations.length,
    resolved,
    unresolved,
    recurringTopic: recurring ? humanize(recurring[0]) : "None yet",
    cardsCreated: cards,
    messagesDrafted: messages,
    reelsSaved: reels,
    note: "These patterns reflect only what you chose to record. They are not a diagnosis of your relationship or of your partner.",
  };

  await db.insight.create({
    data: { userId, period: data.period, data },
  });

  return data;
}

function humanize(value: string) {
  return value.replaceAll("_", " ").toLowerCase();
}
