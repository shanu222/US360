import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { q = "" } = await searchParams;
  const query = q.trim();

  const [memories, events, reels, messages, cards, situations] = query
    ? await Promise.all([
        db.relationshipMemory.findMany({
          where: { relationship: { userId: session.user.id }, OR: [{ title: { contains: query, mode: "insensitive" } }, { content: { contains: query, mode: "insensitive" } }] },
          take: 8,
        }),
        db.calendarEvent.findMany({ where: { userId: session.user.id, title: { contains: query, mode: "insensitive" } }, take: 8 }),
        db.reel.findMany({ where: { userId: session.user.id, OR: [{ url: { contains: query, mode: "insensitive" } }, { notes: { contains: query, mode: "insensitive" } }] }, take: 8 }),
        db.message.findMany({ where: { userId: session.user.id, content: { contains: query, mode: "insensitive" } }, take: 8 }),
        db.card.findMany({ where: { userId: session.user.id, message: { contains: query, mode: "insensitive" } }, take: 8 }),
        db.situation.findMany({ where: { userId: session.user.id, description: { contains: query, mode: "insensitive" } }, take: 8 }),
      ])
    : [[], [], [], [], [], []];

  const groups = [
    { title: "Memories", href: "/memory", items: memories.map((m) => ({ id: m.id, text: m.title })) },
    { title: "Events", href: "/calendar", items: events.map((m) => ({ id: m.id, text: m.title })) },
    { title: "Reels", href: "/reels", items: reels.map((m) => ({ id: m.id, text: m.url })) },
    { title: "Messages", href: "/assistant/message-studio", items: messages.map((m) => ({ id: m.id, text: m.content.slice(0, 80) })) },
    { title: "Cards", href: "/cards", items: cards.map((m) => ({ id: m.id, text: m.message })) },
    { title: "Situations", href: "/assistant", items: situations.map((m) => ({ id: m.id, text: m.description.slice(0, 80) })) },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-4xl text-navy">Search</h1>
      <form className="mt-4">
        <input name="q" defaultValue={q} placeholder="Memories, events, reels, messages…" className="h-12 w-full rounded-full border border-line bg-white px-5" />
      </form>
      <div className="mt-6 space-y-4">
        {groups.map((g) => (
          <Card key={g.title}>
            <h2 className="font-medium">{g.title}</h2>
            {g.items.length === 0 ? (
              <p className="mt-2 text-sm text-muted">No matches.</p>
            ) : (
              <ul className="mt-2 space-y-2 text-sm">
                {g.items.map((i) => (
                  <li key={i.id}>
                    <Link href={g.href} className="hover:underline">
                      {i.text}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
