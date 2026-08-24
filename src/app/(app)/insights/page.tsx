import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { computeInsights } from "@/services/insights";
import { Card, CardTitle } from "@/components/ui/card";
import { WeeklyFocusToggle } from "@/features/insights/weekly-focus";
import { Button } from "@/components/ui/button";

export default async function InsightsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const data = await computeInsights(session.user.id);
  const focus = await db.weeklyFocus.findFirst({
    where: { userId: session.user.id },
    orderBy: { weekStart: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-4xl text-navy">Insights</h1>
        <p className="mt-2 text-muted">Patterns from what you recorded — not a diagnosis, and never a label for her.</p>
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
        <p className="text-xs uppercase tracking-[0.28em] text-rose">Better partner</p>
        <h2 className="mt-2 font-display text-3xl">This week’s focus</h2>
        {focus ? (
          <>
            <p className="mt-3 font-medium">{focus.title}</p>
            <p className="mt-2 text-sm text-muted">{focus.body}</p>
            <WeeklyFocusToggle id={focus.id} completed={focus.completed} />
          </>
        ) : (
          <Button className="mt-4" asChild>
            <a href="/api/insights/weekly">Prepare this week’s focus</a>
          </Button>
        )}
      </Card>
    </div>
  );
}
