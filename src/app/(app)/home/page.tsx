import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { greetingForHour, localHour } from "@/lib/utils";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getLatestChatImport } from "@/chat/queries";

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

  const [upcoming, chatImport] = await Promise.all([
    db.calendarEvent.findMany({
      where: { userId: user.id, startAt: { gte: new Date() } },
      orderBy: { startAt: "asc" },
      take: 3,
    }),
    getLatestChatImport(user.id),
  ]);

  const tasks = [
    { href: "/morning", label: "Good morning", detail: "One morning card" },
    { href: "/night", label: "Good night", detail: "One night card" },
    { href: "/food", label: "Food", detail: "What to eat" },
    { href: "/explore", label: "Explore", detail: "Where to go" },
    { href: "/reels", label: "Find a Reel", detail: "Five Instagram Reels" },
    { href: "/assistant", label: "Help", detail: "What should I do?" },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-4xl text-navy md:text-5xl">
          {greetingForHour(hour)}, {user.name?.split(" ")[0] ?? "there"}
        </h1>
        <p className="mt-2 text-muted">
          {relationship ? `Caring for ${relationship.partnerName}. Pick one thing.` : "Set up a relationship profile to personalize US360."}
        </p>
      </div>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {tasks.map((task) => (
          <Link key={task.href} href={task.href} className="card-premium flex flex-col gap-1 p-4 hover:shadow-soft">
            <span className="font-medium">{task.label}</span>
            <span className="text-xs text-muted">{task.detail}</span>
          </Link>
        ))}
      </section>

      <Card>
        <CardTitle>Upcoming</CardTitle>
        <div className="mt-4 space-y-3">
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted">No upcoming dates. Add one from Calendar when you need it.</p>
          ) : (
            upcoming.map((e) => (
              <Link key={e.id} href="/calendar" className="flex items-center justify-between rounded-2xl bg-paper px-4 py-3">
                <div>
                  <p className="font-medium">{e.title}</p>
                  <p className="text-xs text-muted">{e.startAt.toLocaleDateString()}</p>
                </div>
                <Badge>{daysUntilLabel(e.startAt)}</Badge>
              </Link>
            ))
          )}
        </div>
      </Card>

      {!chatImport ? (
        <p className="text-sm text-muted">
          Optional: import a chat ZIP from{" "}
          <Link className="underline" href="/memory">
            Memory
          </Link>{" "}
          so US360 can learn quietly in the background.
        </p>
      ) : (
        <p className="text-sm text-muted">
          <Link className="underline" href="/more">
            More
          </Link>
        </p>
      )}
    </div>
  );
}

function daysUntilLabel(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const days = Math.round((start.getTime() - now.getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days}d`;
}
