import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/env";
import { db } from "@/lib/db";
import { Card, CardTitle } from "@/components/ui/card";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.email || !isAdminEmail(session.user.email)) redirect("/home");

  const [usage, jobs, integrations] = await Promise.all([
    db.aIUsageLog.aggregate({ _sum: { tokensIn: true, tokensOut: true }, _count: true }),
    db.jobRun.findMany({ orderBy: { startedAt: "desc" }, take: 12 }),
    db.integrationAccount.groupBy({ by: ["provider", "status"], _count: true }),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <h1 className="font-display text-4xl text-navy">Admin</h1>
      <p className="text-sm text-muted">System health only. Relationship content is not shown.</p>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-muted">AI calls</p>
          <p className="font-display text-4xl">{usage._count}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Tokens in</p>
          <p className="font-display text-4xl">{usage._sum.tokensIn ?? 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Tokens out</p>
          <p className="font-display text-4xl">{usage._sum.tokensOut ?? 0}</p>
        </Card>
      </div>
      <Card>
        <CardTitle>Recent jobs</CardTitle>
        <ul className="mt-3 space-y-2 text-sm">
          {jobs.map((j) => (
            <li key={j.id} className="flex justify-between">
              <span>{j.jobName}</span>
              <span className="text-muted">{j.status}</span>
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <CardTitle>Integrations</CardTitle>
        <ul className="mt-3 space-y-2 text-sm">
          {integrations.map((i) => (
            <li key={`${i.provider}-${i.status}`}>
              {i.provider} · {i.status} · {i._count}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
