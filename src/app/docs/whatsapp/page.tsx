import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/card";

export default function WhatsAppDocsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <p className="text-xs uppercase tracking-[0.28em] text-rose">Official API only</p>
      <h1 className="font-display text-4xl text-navy">WhatsApp reminders</h1>
      <p className="text-muted">
        US360 never logs into WhatsApp, never asks for a personal password, and never uses browser bots. Reminders are
        sent only through the official WhatsApp Business Cloud API (or an approved provider using that API).
      </p>
      <Card>
        <CardTitle>Until credentials are added</CardTitle>
        <p className="mt-3 text-sm leading-6 text-muted">
          Calendar reminders still work in the app, by email, and by web push. WhatsApp sending stays off and the
          Settings page will say it is not configured. The product will not pretend a message was sent.
        </p>
      </Card>
      <Card>
        <CardTitle>External setup</CardTitle>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6">
          <li>A Meta Developer account</li>
          <li>WhatsApp Business Platform / Cloud API on a Meta app</li>
          <li>A verified business, where Meta requires it</li>
          <li>A WhatsApp Business phone number (the sender)</li>
          <li>Permissions: <code>whatsapp_business_messaging</code> and related Cloud API scopes</li>
          <li>A permanent access token and the Phone Number ID</li>
          <li>Webhook URL: <code>/api/integrations/whatsapp/webhook</code> with a verify token</li>
          <li>
            An approved message template (utility) with two body variables — event title and timing — named in{" "}
            <code>WHATSAPP_REMINDER_TEMPLATE</code>
          </li>
        </ol>
      </Card>
      <Card>
        <CardTitle>Approved template</CardTitle>
        <p className="mt-3 text-sm leading-6 text-muted">
          Business-initiated reminders outside the 24-hour window must use an approved utility template. Submit a body with
          two variables — event title and timing:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-2xl bg-paper p-4 text-xs leading-6">
{`Reminder ❤️
{{1}} is {{2}}. You may want to wish her good luck or prepare a supportive message.`}
        </pre>
      </Card>
      <Card>
        <CardTitle>Environment variables</CardTitle>
        <pre className="mt-3 overflow-x-auto rounded-2xl bg-paper p-4 text-xs leading-6">
{`WHATSAPP_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_REMINDER_TEMPLATE=us360_reminder
WHATSAPP_TEMPLATE_LANG=en
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_API_BASE=`}
        </pre>
        <p className="mt-3 text-sm text-muted">
          After these are set in Vercel, each user opts in under Settings with their own WhatsApp number (the recipient).
        </p>
      </Card>
      <p className="text-sm">
        <Link className="underline" href="/settings">
          Back to settings
        </Link>
      </p>
    </div>
  );
}
