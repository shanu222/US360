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

  return <AppShell user={session.user}>{children}</AppShell>;
}
