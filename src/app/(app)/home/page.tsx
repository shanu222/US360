import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { greetingForHour, localHour } from "@/lib/utils";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

  const upcoming = await db.calendarEvent.findMany({
    where: { userId: user.id, startAt: { gte: new Date() } },
    orderBy: { startAt: "asc" },
    take: 3,
  });

  const next = upcoming[0];
  const status = next
    ? `${next.title} · ${daysUntilLabel(next.startAt)}`
    : "Nothing urgent on the calendar.";

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-rose">Today</p>
        <h1 className="mt-2 font-display text-4xl text-navy md:text-5xl">
          {greetingForHour(hour)}, {user.name?.split(" ")[0] ?? "there"}
        </h1>
        <p className="mt-2 text-muted">{relationship ? `Caring for ${relationship.partnerName}.` : "Add a relationship in Settings → Profile."}</p>
      </div>

      <Card>
        <p className="text-xs uppercase tracking-[0.2em] text-rose">Status</p>
        <CardTitle className="mt-2">{status}</CardTitle>
        <p className="mt-2 text-sm text-muted">Open a section in the menu when you need it. Home stays an overview.</p>
      </Card>

      <Card>
        <CardTitle>Upcoming</CardTitle>
        <div className="mt-4 space-y-3">
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted">No upcoming dates. Add one in Calendar.</p>
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

      <section>
        <h2 className="mb-3 font-display text-2xl">Quick actions</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { href: "/daily-love", label: "Daily Love" },
            { href: "/assistant", label: "Ask the Assistant" },
            { href: "/calendar", label: "Calendar" },
            { href: "/restaurants", label: "Restaurants" },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="card-premium p-4 text-sm font-medium hover:shadow-soft">
              {item.label}
            </Link>
          ))}
        </div>
      </section>
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
