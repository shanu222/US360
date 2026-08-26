import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";

export default async function DailyLovePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const recs = await db.dailyRecommendation.findMany({
    where: { userId: session.user.id, date: { gte: today } },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-4xl text-navy">Daily Love</h1>
        <p className="mt-2 text-muted">Pick morning or night. One card at a time.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/morning" className="card-premium p-6 hover:shadow-soft">
          <p className="text-xs uppercase tracking-[0.2em] text-rose">Morning</p>
          <h2 className="mt-2 font-display text-3xl">Good morning</h2>
          <p className="mt-2 text-sm text-muted">A single morning card.</p>
        </Link>
        <Link href="/night" className="card-premium p-6 hover:shadow-soft">
          <p className="text-xs uppercase tracking-[0.2em] text-rose">Night</p>
          <h2 className="mt-2 font-display text-3xl">Good night</h2>
          <p className="mt-2 text-sm text-muted">A single night card.</p>
        </Link>
      </div>
      {recs.length ? (
        <Card>
          <CardTitle>Today, if it still feels right</CardTitle>
          <div className="mt-4 space-y-3">
            {recs.map((r) => (
              <p key={r.id} className="text-sm text-muted">
                {r.title}
              </p>
            ))}
          </div>
        </Card>
      ) : null}
      <Button asChild variant="outline">
        <Link href="/cards">Open card studio</Link>
      </Button>
    </div>
  );
}
