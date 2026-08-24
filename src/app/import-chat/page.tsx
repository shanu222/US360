import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ChatImportFlow } from "@/features/chat/chat-import-flow";

export const dynamic = "force-dynamic";

export default async function ImportChatPage({
  searchParams,
}: {
  searchParams: Promise<{ again?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [state, params] = await Promise.all([
    db.onboardingState.findUnique({ where: { userId: session.user.id } }),
    searchParams,
  ]);
  if (!state?.completed) redirect("/onboarding");

  const again = params.again === "1";
  if (state.chatImportStatus !== "PENDING" && !again) redirect("/home");

  return <ChatImportFlow allowSkip={!again} />;
}
