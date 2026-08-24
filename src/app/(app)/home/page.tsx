import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { greetingForHour, localHour } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const QUICK = [
  { href: "/assistant", label: "What Should I Do?", emoji: "🧠" },
  { href: "/assistant/message-studio", label: "Write a Message", emoji: "💌" },
  { href: "/reels", label: "Send a Reel", emoji: "🎬" },
  { href: "/cards", label: "Create a Card", emoji: "🎨" },
  { href: "/ideas", label: "Make Her Smile", emoji: "🎁" },
  { href: "/calendar", label: "View Calendar", emoji: "📅" },
];

export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { settings: true, relationships: true },
  });
  if (!user) redirect("/login");

  const relationship = user.relationships[0];
  const hour = localHour(user.timezone || "UTC");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [recommendation, upcoming, morningCard, nightCard, reel, chatImport] = await Promise.all([
    db.dailyRecommendation.findFirst({
      where: { userId: user.id, date: { gte: today } },
      orderBy: { createdAt: "desc" },
    }),
    db.calendarEvent.findMany({
      where: { userId: user.id, startAt: { gte: new Date() } },
      orderBy: { startAt: "asc" },
      take: 4,
    }),
    db.card.findFirst({
      where: { userId: user.id, category: "GOOD_MORNING" },
      orderBy: { createdAt: "desc" },
    }),
    db.card.findFirst({
      where: { userId: user.id, category: "GOOD_NIGHT" },
      orderBy: { createdAt: "desc" },
    }),
    db.reel.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    db.chatImport.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { partnerName: true, messageCount: true, analysis: true, firstAt: true, lastAt: true },
    }),
  ]);

  const suggestion = recommendation ?? {
    title: "Today’s suggestion",
    body: upcoming[0]
      ? `${upcoming[0].title} is coming up. Consider a short, encouraging note if it feels natural.`
      : "Nothing needed right now. A quiet, ordinary day can still be a good day.",
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-rose">Today’s relationship brief</p>
        <h1 className="mt-2 font-display text-4xl text-navy md:text-5xl">
          {greetingForHour(hour)}, {user.name?.split(" ")[0] ?? "there"}
        </h1>
        <p className="mt-2 text-muted">
          {relationship ? `Caring for ${relationship.partnerName}.` : "Set up a relationship profile to personalize US360."}
        </p>
      </div>

      <Card className="bg-[linear-gradient(135deg,#fffdfb,#f4ece4)]">
        <CardHeader>
          <div>
            <Badge tone="rose">Today’s suggestion</Badge>
            <CardTitle className="mt-3">{suggestion.title}</CardTitle>
            <CardDescription className="mt-2 max-w-2xl text-base leading-7">{suggestion.body}</CardDescription>
          </div>
        </CardHeader>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/assistant">Do It</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/ideas">Give Me Another Idea</Link>
          </Button>
        </div>
      </Card>

      {chatImport ? (
        <ChatBrief
          partnerName={chatImport.partnerName}
          messageCount={chatImport.messageCount}
          analysis={chatImport.analysis}
        />
      ) : (
        <Card>
          <CardTitle>WhatsApp chat</CardTitle>
          <CardDescription className="mt-2">
            Import a chat ZIP to fill Memory with likes, routines, and how you write — no AI reads the export.
          </CardDescription>
          <div className="mt-4">
            <Button asChild variant="outline">
              <Link href="/import-chat?again=1">Import WhatsApp ZIP</Link>
            </Button>
          </div>
        </Card>
      )}

      <section>
        <h2 className="mb-4 font-display text-2xl">Quick actions</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {QUICK.map((q) => (
            <Link key={q.href} href={q.href} className="card-premium flex flex-col items-start gap-2 p-4 hover:shadow-soft">
              <span className="text-xl">{q.emoji}</span>
              <span className="text-sm font-medium">{q.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle>Upcoming</CardTitle>
          <div className="mt-4 space-y-3">
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted">No upcoming dates yet. Add one from Calendar.</p>
            ) : (
              upcoming.map((e) => (
                <div key={e.id} className="flex items-center justify-between rounded-2xl bg-paper px-4 py-3">
                  <div>
                    <p className="font-medium">{e.title}</p>
                    <p className="text-xs text-muted">{e.type} · {e.startAt.toLocaleDateString()}</p>
                  </div>
                  <Badge>{e.type.toLowerCase()}</Badge>
                </div>
              ))
            )}
          </div>
        </Card>
        <Card>
          <CardTitle>Daily Love</CardTitle>
          <div className="mt-4 space-y-3 text-sm">
            <Row href="/daily-love" label="Morning Card" ready={Boolean(morningCard)} />
            <Row href="/reels" label="Today's Reel" ready={Boolean(reel)} />
            <Row href="/ideas" label="Thoughtful Gesture" ready />
            <Row href="/daily-love" label="Good Night Card" ready={Boolean(nightCard)} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function Row({ href, label, ready }: { href: string; label: string; ready?: boolean }) {
  return (
    <Link href={href} className="flex items-center justify-between rounded-2xl bg-paper px-4 py-3">
      <span>{label}</span>
      <Badge tone={ready ? "success" : "default"}>{ready ? "Ready" : "Open"}</Badge>
    </Link>
  );
}

function ChatBrief({
  partnerName,
  messageCount,
  analysis,
}: {
  partnerName: string | null;
  messageCount: number;
  analysis: unknown;
}) {
  const a = (analysis ?? {}) as {
    summary?: string;
    likes?: string[];
    topics?: { topic: string; count: number }[];
    communicationStyle?: string[];
  };
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Badge tone="rose">From WhatsApp</Badge>
          <CardTitle className="mt-3">
            {messageCount.toLocaleString()} messages with {partnerName ?? "your partner"}
          </CardTitle>
          <CardDescription className="mt-2 max-w-2xl">{a.summary}</CardDescription>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/insights">See patterns</Link>
        </Button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {(a.communicationStyle ?? []).map((s) => (
          <Badge key={s}>{s}</Badge>
        ))}
        {(a.likes ?? []).slice(0, 5).map((s) => (
          <Badge key={s} tone="rose">
            {s}
          </Badge>
        ))}
        {(a.topics ?? []).slice(0, 4).map((t) => (
          <Badge key={t.topic}>{t.topic}</Badge>
        ))}
      </div>
    </Card>
  );
}
