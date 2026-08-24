import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { OnboardingFlow } from "@/features/onboarding/onboarding-flow";
import { parseGender } from "@/lib/voice";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { onboarding: true, relationships: { orderBy: { createdAt: "asc" }, take: 1 } },
  });
  if (!user) redirect("/login");

  const state = user.onboarding;
  const needsGender = !parseGender(user.gender) || Boolean(state?.completed && user.relationships[0] && !parseGender(user.relationships[0].partnerGender));
  const genderOnly = Boolean(state?.completed && needsGender);

  if (state?.completed && !needsGender) {
    if (state.chatImportStatus === "PENDING") redirect("/import-chat");
    redirect("/home");
  }

  return (
    <OnboardingFlow
      defaultTimezone={Intl.DateTimeFormat().resolvedOptions().timeZone}
      existingUserGender={parseGender(user.gender)}
      existingPartnerGender={parseGender(user.relationships[0]?.partnerGender)}
      existingPartnerName={user.relationships[0]?.partnerName ?? ""}
      genderOnly={genderOnly}
      nextPath={state?.chatImportStatus === "PENDING" ? "/import-chat" : "/home"}
    />
  );
}
