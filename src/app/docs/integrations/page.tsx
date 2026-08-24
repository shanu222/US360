import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/card";

export default function IntegrationsDocsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <p className="text-xs uppercase tracking-[0.28em] text-rose">Official apps + email</p>
      <h1 className="font-display text-4xl text-navy">Platform setup</h1>
      <p className="text-muted">
        US360 never asks for personal Instagram, Facebook, or WhatsApp passwords and never uses browser bots. Those
        apps are never auto-sent — the product opens them so you tap send. Only email reminders can leave the app
        automatically, and only to addresses already saved.
      </p>
      <Card>
        <CardTitle>Email (the only auto-send)</CardTitle>
        <p className="mt-3 text-sm text-muted">
          Each person connects their own Gmail in Settings. Mail is sent through Google OAuth and the Gmail API from
          that account. Full steps:{" "}
          <Link className="underline" href="/docs/email">
            /docs/email
          </Link>
          .
        </p>
      </Card>
      <Card>
        <CardTitle>Instagram</CardTitle>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6">
          <li>Add their username on Profile so Open Instagram works</li>
          <li>Optional official OAuth (`META_APP_ID`, `META_APP_SECRET`)</li>
          <li>Reels and DMs are never auto-sent</li>
        </ul>
      </Card>
      <Card>
        <CardTitle>Facebook</CardTitle>
        <p className="mt-3 text-sm text-muted">Add their Facebook identifier on Profile. Sending is always Open Facebook.</p>
      </Card>
      <Card>
        <CardTitle>WhatsApp</CardTitle>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6">
          <li>Import a chat export ZIP — that is not sending</li>
          <li>Reminders and Reels never auto-send on WhatsApp</li>
          <li>Open WhatsApp (`wa.me`) when you are ready to tap send</li>
        </ul>
        <p className="mt-3 text-sm text-muted">
          Cloud API notes remain at{" "}
          <Link className="underline" href="/docs/whatsapp">
            /docs/whatsapp
          </Link>
          , but US360 will not use them to auto-send.
        </p>
      </Card>
      <p className="text-sm">
        <Link className="underline" href="/reels">
          Back to Reels
        </Link>
        {" · "}
        <Link className="underline" href="/settings">
          Settings
        </Link>
      </p>
    </div>
  );
}
