import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/card";

export default function EmailDocsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <p className="text-xs uppercase tracking-[0.28em] text-rose">Saved addresses only</p>
      <h1 className="font-display text-4xl text-navy">Email reminder setup</h1>
      <p className="text-muted">
        Calendar reminders can be emailed automatically to addresses already in US360 — your account email and the
        partner email on Profile. WhatsApp, Instagram, Facebook, and Reels are never auto-sent.
      </p>

      <Card>
        <CardTitle>External steps</CardTitle>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6">
          <li>Pick a mail provider (Gmail App Password, Outlook, Resend, SendGrid, Amazon SES, or any SMTP host).</li>
          <li>Verify a From address the provider lets you send as.</li>
          <li>
            Set <code>SMTP_HOST</code> (Gmail: <code>smtp.gmail.com</code>).
          </li>
          <li>
            Set <code>SMTP_PORT</code> to <code>587</code> (STARTTLS) or <code>465</code> (SSL).
          </li>
          <li>Set <code>SMTP_USER</code> (usually the mailbox address).</li>
          <li>
            Set <code>SMTP_PASSWORD</code>. Gmail needs a 16-character App Password (Google Account → Security →
            2-Step Verification → App passwords), not your normal password.
          </li>
          <li>
            Set <code>SMTP_FROM</code>, for example <code>US360 &lt;you@gmail.com&gt;</code>.
          </li>
          <li>On Vercel, add the same variables and redeploy. Locally, put them in <code>.env</code> and restart the app.</li>
          <li>Confirm your account email, add a partner email on Profile if notes should reach them, and turn on Email + Events in Settings.</li>
          <li>Use Send test email on Settings. The product will not claim Sent unless the mail server accepts the message.</li>
          <li>Keep the daily cron (<code>CRON_SECRET</code> + <code>/api/jobs/run</code>) so scheduled mails actually fire.</li>
        </ol>
      </Card>

      <Card>
        <CardTitle>What is emailed</CardTitle>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6">
          <li>Your calendar reminders → your account email</li>
          <li>Prepared notes for your partner → their Profile email</li>
          <li>Reels / Instagram / Facebook / WhatsApp → never auto-sent</li>
        </ul>
      </Card>

      <p className="text-sm">
        <Link className="underline" href="/settings">
          Back to Settings
        </Link>
        {" · "}
        <Link className="underline" href="/docs/integrations">
          Other platforms
        </Link>
      </p>
    </div>
  );
}
