import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const onboarding = await db.onboardingState.findUnique({ where: { userId: session.user.id } });
  if (!onboarding || !onboarding.completed) redirect("/onboarding");
  if ((onboarding.chatImportStatus ?? "PENDING") === "PENDING") redirect("/import-chat");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { gender: true, relationships: { select: { partnerGender: true }, orderBy: { createdAt: "asc" }, take: 1 } },
  });
  if (!user?.gender) redirect("/onboarding");
  if (user.relationships[0] && !user.relationships[0].partnerGender) redirect("/onboarding");

  return <AppShell user={session.user}>{children}</AppShell>;
}
