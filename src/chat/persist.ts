import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { ChatAnalysis } from "@/chat/analyze";
import type { ParsedMessage } from "@/chat/parse";
import type { MemoryCategory, Importance } from "@prisma/client";

function asJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export async function persistChatAnalysis(opts: {
  userId: string;
  userName?: string | null;
  fileName: string;
  chatFileName?: string;
  analysis: ChatAnalysis;
  messages: ParsedMessage[];
}) {
  const { userId, analysis, messages } = opts;

  let relationship = await db.relationship.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  if (!relationship) {
    relationship = await db.relationship.create({
      data: {
        userId,
        partnerName: analysis.partnerName,
        startDate: analysis.firstAt ? new Date(analysis.firstAt) : null,
        communicationStyle: analysis.communicationStyle.join(", "),
      },
    });
  } else {
    relationship = await db.relationship.update({
      where: { id: relationship.id },
      data: {
        partnerName: relationship.partnerName || analysis.partnerName,
        startDate: relationship.startDate ?? (analysis.firstAt ? new Date(analysis.firstAt) : null),
        communicationStyle:
          relationship.communicationStyle || analysis.communicationStyle.join(", ") || null,
      },
    });
  }

  const relationshipId = relationship.id;

  const imported = await db.chatImport.create({
    data: {
      userId,
      relationshipId,
      fileName: opts.fileName,
      chatFileName: opts.chatFileName,
      messageCount: analysis.messageCount,
      partnerName: analysis.partnerName,
      firstAt: analysis.firstAt ? new Date(analysis.firstAt) : null,
      lastAt: analysis.lastAt ? new Date(analysis.lastAt) : null,
      stats: asJson({
        textCount: analysis.textCount,
        mediaCount: analysis.mediaCount,
        callCount: analysis.callCount,
        systemCount: analysis.systemCount,
        bySender: analysis.bySender,
        hourHistogram: analysis.hourHistogram,
        weekdayHistogram: analysis.weekdayHistogram,
        mediaBreakdown: analysis.mediaBreakdown,
        initiatedByPartnerDays: analysis.initiatedByPartnerDays,
        initiatedByUserDays: analysis.initiatedByUserDays,
        avgUserLength: analysis.avgUserLength,
        avgPartnerLength: analysis.avgPartnerLength,
        emojiShare: analysis.emojiShare,
        urduShare: analysis.urduShare,
        goodMorningCount: analysis.goodMorningCount,
        goodNightCount: analysis.goodNightCount,
        missYouCount: analysis.missYouCount,
        conflictSignals: analysis.conflictSignals,
      }),
      analysis: asJson({
        summary: analysis.summary,
        likes: analysis.likes,
        dislikes: analysis.dislikes,
        foods: analysis.foods,
        places: analysis.places,
        activities: analysis.activities,
        familyMentions: analysis.familyMentions,
        boundaries: analysis.boundaries,
        dates: analysis.dates,
        promises: analysis.promises,
        topics: analysis.topics,
        communicationStyle: analysis.communicationStyle,
        notable: analysis.notable,
      }),
    },
  });

  const sample = messages
    .filter((m) => m.kind === "text" && m.text.length > 0)
    .slice(-400)
    .map((m) => ({
      importId: imported.id,
      sentAt: m.sentAt,
      sender: m.sender,
      isPartner: m.sender.toLowerCase() === analysis.partnerName.toLowerCase(),
      kind: m.kind,
      text: m.text.slice(0, 2000),
    }));
  if (sample.length) {
    await db.chatMessage.createMany({ data: sample });
  }

  const existingMemories = await db.relationshipMemory.findMany({
    where: { relationshipId },
    select: { title: true },
  });
  const memoryTitles = new Set(existingMemories.map((m) => m.title.toLowerCase()));
  for (const fact of analysis.facts.slice(0, 40)) {
    if (memoryTitles.has(fact.title.toLowerCase())) continue;
    await db.relationshipMemory.create({
      data: {
        relationshipId,
        title: fact.title.slice(0, 120),
        content: fact.content.slice(0, 2000),
        category: fact.category as MemoryCategory,
        importance: fact.importance as Importance,
        source: "whatsapp-import",
      },
    });
    memoryTitles.add(fact.title.toLowerCase());
  }

  const existingFavs = await db.favorite.findMany({ where: { relationshipId } });
  const favKeys = new Set(existingFavs.map((f) => `${f.category}:${f.value.toLowerCase()}`));
  async function addFavorite(category: string, value: string) {
    const key = `${category}:${value.toLowerCase()}`;
    if (favKeys.has(key)) return;
    await db.favorite.create({ data: { relationshipId, category, value } });
    favKeys.add(key);
  }
  for (const food of analysis.foods) await addFavorite("foods", food);
  for (const place of analysis.places) await addFavorite("places", place);
  for (const act of analysis.activities) await addFavorite("activities", act);
  for (const like of analysis.likes) await addFavorite("appreciates", like);

  const existingDislikes = await db.dislike.findMany({ where: { relationshipId } });
  const dislikeKeys = new Set(existingDislikes.map((d) => d.value.toLowerCase()));
  for (const dislike of analysis.dislikes) {
    if (dislikeKeys.has(dislike.toLowerCase())) continue;
    await db.dislike.create({ data: { relationshipId, category: "general", value: dislike } });
    dislikeKeys.add(dislike.toLowerCase());
  }

  for (const d of analysis.dates) {
    const title = `${d.title} (from chat)`;
    if (memoryTitles.has(title.toLowerCase())) continue;
    await db.relationshipMemory.create({
      data: {
        relationshipId,
        title,
        content: `${d.hint} Confirm the real date in Calendar if you want a reminder.`,
        category: d.type === "BIRTHDAY" ? "IMPORTANT" : "GOALS",
        importance: "MEDIUM",
        source: "whatsapp-import",
      },
    });
  }

  if (analysis.writingSamples.length) {
    const existingStyle = await db.writingStyle.findUnique({ where: { userId } });
    const samples = analysis.writingSamples.join("\n\n");
    await db.writingStyle.upsert({
      where: { userId },
      update: {
        samples: (existingStyle?.samples ? `${samples}\n\n${existingStyle.samples}` : samples).slice(0, 4000),
        notes: "Extracted from WhatsApp export",
      },
      create: { userId, samples, notes: "Extracted from WhatsApp export" },
    });
  }

  await db.preference.upsert({
    where: { relationshipId_key: { relationshipId, key: "chat_peak_hour" } },
    update: { value: String(analysis.hourHistogram.indexOf(Math.max(...analysis.hourHistogram))) },
    create: {
      relationshipId,
      key: "chat_peak_hour",
      value: String(analysis.hourHistogram.indexOf(Math.max(...analysis.hourHistogram))),
    },
  });

  await db.onboardingState.upsert({
    where: { userId },
    update: { chatImportStatus: "IMPORTED" },
    create: { userId, completed: true, step: 8, chatImportStatus: "IMPORTED", completedAt: new Date() },
  });

  return { importId: imported.id, relationshipId, analysis };
}
