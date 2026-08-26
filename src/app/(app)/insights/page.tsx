import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { computeInsights } from "@/services/insights";
import { Card, CardTitle } from "@/components/ui/card";
import { WeeklyFocusToggle, WeeklyFocusPrepare } from "@/features/insights/weekly-focus";
import { getLatestChatImport } from "@/chat/queries";
import { voiceFor } from "@/lib/voice";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function InsightsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [data, focus, chatImport, relationship, upcoming] = await Promise.all([
    computeInsights(session.user.id),
    db.weeklyFocus.findFirst({
      where: { userId: session.user.id },
      orderBy: { weekStart: "desc" },
    }),
    getLatestChatImport(session.user.id),
    db.relationship.findFirst({ where: { userId: session.user.id }, orderBy: { createdAt: "asc" } }),
    db.calendarEvent.findMany({
      where: { userId: session.user.id, startAt: { gte: new Date() } },
      orderBy: { startAt: "asc" },
      take: 4,
    }),
  ]);
  const voice = voiceFor(relationship?.partnerGender);

  const stats = (chatImport?.stats ?? {}) as {
    hourHistogram?: number[];
    weekdayHistogram?: number[];
    goodMorningCount?: number;
    goodNightCount?: number;
    initiatedByPartnerDays?: number;
    initiatedByUserDays?: number;
  };
  const analysis = (chatImport?.analysis ?? {}) as {
    communicationStyle?: string[];
    topics?: { topic: string; count: number }[];
  };
  const hours = stats.hourHistogram ?? [];
  const days = stats.weekdayHistogram ?? [];
  const maxHour = Math.max(1, ...hours);
  const maxDay = Math.max(1, ...days);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-4xl text-navy">Insights</h1>
        <p className="mt-2 text-muted">
          Patterns from what you recorded — not a diagnosis, and never a label for {voice.them}. Likes and foods live in
          Memory. Daily Love and Restaurants stay on their own pages.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-muted">Situations this month</p>
          <p className="mt-2 font-display text-4xl">{data.situationsRecorded}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Resolved</p>
          <p className="mt-2 font-display text-4xl">{data.resolved}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Still open</p>
          <p className="mt-2 font-display text-4xl">{data.unresolved}</p>
        </Card>
      </div>
      <Card>
        <CardTitle>Recurring topic</CardTitle>
        <p className="mt-2 text-lg capitalize">{data.recurringTopic}</p>
        <p className="mt-3 text-sm text-muted">{data.note}</p>
      </Card>
      <Card>
        <CardTitle>Activity this month</CardTitle>
        <p className="mt-2 text-sm text-muted">
          {data.cardsCreated} cards · {data.messagesDrafted} messages · {data.reelsSaved} reels saved
        </p>
      </Card>
      {upcoming.length ? (
        <Card>
          <CardTitle>Upcoming reminders</CardTitle>
          <ul className="mt-3 space-y-2 text-sm">
            {upcoming.map((e) => (
              <li key={e.id}>
                {e.title} · {e.startAt.toLocaleDateString()}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">
            Open Calendar to manage these. Reminders email from your connected Gmail only.
          </p>
        </Card>
      ) : null}
      {hours.length ? (
        <Card>
          <CardTitle>Communication hours</CardTitle>
          <p className="mt-2 text-sm text-muted">Derived from imported chat patterns — not a transcript.</p>
          <div className="mt-2 flex h-16 items-end gap-0.5">
            {hours.map((n, i) => (
              <div
                key={i}
                title={`${i}:00 · ${n}`}
                className="flex-1 rounded-t bg-navy/80"
                style={{ height: `${Math.max(6, (n / maxHour) * 100)}%` }}
              />
            ))}
          </div>
          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs">
            {days.map((n, i) => (
              <div key={WEEKDAYS[i]} className="rounded-xl bg-paper py-2">
                <p className="text-muted">{WEEKDAYS[i]}</p>
                <p className="mt-1 font-medium" style={{ opacity: 0.4 + (n / maxDay) * 0.6 }}>
                  {n}
                </p>
              </div>
            ))}
          </div>
          {(analysis.communicationStyle ?? []).length ? (
            <div className="mt-5 flex flex-wrap gap-2 text-sm">
              {(analysis.communicationStyle ?? []).map((s) => (
                <span key={s} className="rounded-full bg-paper px-3 py-1">
                  {s}
                </span>
              ))}
            </div>
          ) : null}
          {(analysis.topics ?? []).slice(0, 6).length ? (
            <p className="mt-4 text-xs text-muted">
              Recurring chat themes: {(analysis.topics ?? []).slice(0, 6).map((t) => t.topic).join(" · ")}
            </p>
          ) : null}
        </Card>
      ) : null}
      <Card>
        <p className="text-xs uppercase tracking-[0.28em] text-rose">Better partner</p>
        <h2 className="mt-2 font-display text-3xl">This week’s focus</h2>
        {focus ? (
          <>
            <p className="mt-3 font-medium">{focus.title}</p>
            <p className="mt-2 text-sm text-muted">{focus.body}</p>
            <WeeklyFocusToggle id={focus.id} completed={focus.completed} />
          </>
        ) : (
          <WeeklyFocusPrepare />
        )}
      </Card>
    </div>
  );
}
