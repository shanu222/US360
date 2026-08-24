import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { OnboardingFlow } from "@/features/onboarding/onboarding-flow";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const state = await db.onboardingState.findUnique({ where: { userId: session.user.id } });
  if (state?.completed) redirect("/home");

  return <OnboardingFlow defaultTimezone={Intl.DateTimeFormat().resolvedOptions().timeZone} />;
}
