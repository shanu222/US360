import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { computeInsights } from "@/services/insights";
import { Card, CardTitle } from "@/components/ui/card";
import { WeeklyFocusToggle, WeeklyFocusPrepare } from "@/features/insights/weekly-focus";
import { Button } from "@/components/ui/button";
import { getLatestChatImport } from "@/chat/queries";
import { voiceFor } from "@/lib/voice";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function InsightsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [data, focus, chatImport, relationship] = await Promise.all([
    computeInsights(session.user.id),
    db.weeklyFocus.findFirst({
      where: { userId: session.user.id },
      orderBy: { weekStart: "desc" },
    }),
    getLatestChatImport(session.user.id),
    db.relationship.findFirst({ where: { userId: session.user.id }, orderBy: { createdAt: "asc" } }),
  ]);
  const voice = voiceFor(relationship?.partnerGender);

  const stats = (chatImport?.stats ?? {}) as {
    hourHistogram?: number[];
    weekdayHistogram?: number[];
    mediaCount?: number;
    goodMorningCount?: number;
    goodNightCount?: number;
    bySender?: { name: string; count: number; share: number }[];
    initiatedByPartnerDays?: number;
    initiatedByUserDays?: number;
  };
  const analysis = (chatImport?.analysis ?? {}) as {
    summary?: string;
    likes?: string[];
    dislikes?: string[];
    foods?: string[];
    places?: string[];
    topics?: { topic: string; count: number }[];
    communicationStyle?: string[];
  };
  const hours = stats.hourHistogram ?? [];
  const days = stats.weekdayHistogram ?? [];
  const maxHour = Math.max(1, ...hours);
  const maxDay = Math.max(1, ...days);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-4xl text-navy">Insights</h1>
        <p className="mt-2 text-muted">Patterns from what you recorded — not a diagnosis, and never a label for {voice.them}.</p>
      </div>
      {chatImport ? (
        <Card>
          <p className="text-xs uppercase tracking-[0.28em] text-rose">WhatsApp chat</p>
          <CardTitle className="mt-2">
            {chatImport.messageCount.toLocaleString()} lines with {chatImport.partnerName}
          </CardTitle>
          <p className="mt-3 text-sm leading-6 text-muted">{analysis.summary}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {(stats.bySender ?? []).slice(0, 3).map((s) => (
              <div key={s.name} className="rounded-2xl bg-paper px-4 py-3">
                <p className="text-xs text-muted">{s.name}</p>
                <p className="mt-1 font-display text-2xl">{s.share}%</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-xs uppercase tracking-[0.2em] text-muted">Hours</p>
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
          <div className="mt-5 flex flex-wrap gap-2 text-sm">
            {(analysis.communicationStyle ?? []).map((s) => (
              <span key={s} className="rounded-full bg-paper px-3 py-1">
                {s}
              </span>
            ))}
            {(analysis.likes ?? []).slice(0, 6).map((s) => (
              <span key={s} className="rounded-full bg-[#f3e6e3] px-3 py-1 text-rose">
                {s}
              </span>
            ))}
            {(analysis.foods ?? []).slice(0, 5).map((s) => (
              <span key={`food-${s}`} className="rounded-full bg-paper px-3 py-1">
                {s}
              </span>
            ))}
            {(analysis.dislikes ?? []).slice(0, 4).map((s) => (
              <span key={`d-${s}`} className="rounded-full bg-paper px-3 py-1">
                {s}
              </span>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted">
            Built from the export text only — no AI. You started {stats.initiatedByUserDays ?? 0} days;
            {chatImport.partnerName} started {stats.initiatedByPartnerDays ?? 0}.{" "}
            {stats.mediaCount ? `${stats.mediaCount} media items were referenced.` : ""}
          </p>
          <Button className="mt-4" asChild variant="outline">
            <Link href="/import-chat?again=1">Re-import chat</Link>
          </Button>
        </Card>
      ) : (
        <Card>
          <CardTitle>WhatsApp chat</CardTitle>
          <p className="mt-2 text-sm text-muted">Import an export ZIP to see hour-by-hour patterns and fill Memory.</p>
          <Button className="mt-4" asChild>
            <Link href="/import-chat?again=1">Import WhatsApp ZIP</Link>
          </Button>
        </Card>
      )}
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
