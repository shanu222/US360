import Link from "next/link";
import { AssistantStudio } from "@/features/assistant/assistant-studio";
import { CommandBar } from "@/features/assistant/command-bar";

export default function AssistantPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <CommandBar focus="moment" />
      <div className="flex flex-wrap gap-3">
        <Link className="rounded-full bg-paper px-4 py-2 text-sm" href="/assistant/apologize">
          Should I apologize?
        </Link>
        <Link className="rounded-full bg-paper px-4 py-2 text-sm" href="/assistant/after-argument">
          We just had a fight
        </Link>
        <Link className="rounded-full bg-paper px-4 py-2 text-sm" href="/assistant/before-you-send">
          Before you send
        </Link>
        <Link className="rounded-full bg-paper px-4 py-2 text-sm" href="/reels">
          Find a Reel
        </Link>
        <Link className="rounded-full bg-paper px-4 py-2 text-sm" href="/assistant/message-studio">
          Message studio
        </Link>
      </div>
      <details className="rounded-3xl border border-line bg-white p-5">
        <summary className="cursor-pointer text-sm font-medium">Need a deeper look?</summary>
        <div className="mt-4">
          <AssistantStudio
            mode="situation"
            heading="Tell the story"
            placeholder="We had an argument because I forgot to call."
          />
        </div>
      </details>
    </div>
  );
}
