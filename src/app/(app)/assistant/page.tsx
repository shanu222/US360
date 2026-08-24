import Link from "next/link";
import { AssistantStudio } from "@/features/assistant/assistant-studio";

export default function AssistantPage() {
  return (
    <div className="space-y-8">
      <AssistantStudio
        mode="situation"
        heading="What should I do?"
        placeholder="We had an argument because I forgot to call her."
      />
      <div className="mx-auto flex max-w-6xl flex-wrap gap-3">
        <Link className="rounded-full bg-paper px-4 py-2 text-sm" href="/assistant/apologize">
          Should I apologize?
        </Link>
        <Link className="rounded-full bg-paper px-4 py-2 text-sm" href="/assistant/before-you-send">
          Before you send
        </Link>
        <Link className="rounded-full bg-paper px-4 py-2 text-sm" href="/assistant/message-studio">
          Message studio
        </Link>
        <Link className="rounded-full bg-paper px-4 py-2 text-sm" href="/assistant/after-argument">
          We just had a fight
        </Link>
      </div>
    </div>
  );
}
