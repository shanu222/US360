import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/card";

export default function WhatsAppDocsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <p className="text-xs uppercase tracking-[0.28em] text-rose">Open-and-send only</p>
      <h1 className="font-display text-4xl text-navy">WhatsApp</h1>
      <p className="text-muted">
        US360 never logs into WhatsApp, never asks for a personal password, and never uses browser bots. WhatsApp is
        never auto-sent — not reminders, and not Reels. Import a chat export for memory and calendar. Automatic
        reminders go by email. See{" "}
        <Link className="underline" href="/docs/email">
          /docs/email
        </Link>
        .
      </p>
      <Card>
        <CardTitle>What still happens</CardTitle>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6">
          <li>Upload a WhatsApp export ZIP to fill Memory, likes, and dates</li>
          <li>Calendar reminders by email, in-app, and web push</li>
          <li>Open WhatsApp with a reminder, Reel link, card words, and image links packed in — you tap send</li>
        </ul>
      </Card>
      <p className="text-sm">
        <Link className="underline" href="/settings">
          Back to settings
        </Link>
        {" · "}
        <Link className="underline" href="/docs/email">
          Email setup
        </Link>
      </p>
    </div>
  );
}
