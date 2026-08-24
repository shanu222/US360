import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { DownloadableCard } from "@/components/downloadable-card";

export default async function DailyLovePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const recs = await db.dailyRecommendation.findMany({
    where: { userId: session.user.id, date: { gte: today } },
    orderBy: { createdAt: "desc" },
  });
  const cards = await db.card.findMany({
    where: { userId: session.user.id, category: { in: ["GOOD_MORNING", "GOOD_NIGHT"] } },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-4xl text-navy">Daily Love</h1>
        <p className="mt-2 text-muted">Prepared with restraint. Skip anything that would feel automatic.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {recs.length === 0 ? (
          <Card className="md:col-span-2">
            <CardTitle>Nothing needed right now</CardTitle>
            <p className="mt-2 text-sm text-muted">
              You already showed care, or today is quiet. You can still create a card or message by hand.
            </p>
            <div className="mt-4 flex gap-2">
              <Button asChild>
                <Link href="/cards">Create a card</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/assistant">Ask what to do</Link>
              </Button>
            </div>
          </Card>
        ) : (
          recs.map((r) => (
            <Card key={r.id}>
              <Badge>{r.action.replaceAll("_", " ")}</Badge>
              <h2 className="mt-3 font-display text-2xl">{r.title}</h2>
              <p className="mt-2 text-sm text-muted">{r.body}</p>
            </Card>
          ))
        )}
      </div>
      <h2 className="font-display text-2xl">Prepared cards</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((c) => (
          <div key={c.id} className="space-y-3">
            <DownloadableCard message={c.message} themeId={c.theme} id={c.id} />
            <Button asChild size="sm">
              <Link href="/cards">Open in studio</Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
