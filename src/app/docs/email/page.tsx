import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/card";

export default function EmailDocsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <p className="text-xs uppercase tracking-[0.28em] text-rose">Your Gmail, not a shared mailbox</p>
      <h1 className="font-display text-4xl text-navy">Connect Gmail</h1>
      <p className="text-muted">
        Each US360 user connects their own Gmail with Google&apos;s official OAuth. Reminders are sent through the Gmail
        API from that account. US360 never asks for a Gmail password or App Password, and never uses one global mailbox
        for everyone.
      </p>

      <Card>
        <CardTitle>What you do in the app</CardTitle>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6">
          <li>Open Settings → Email &amp; notifications → Gmail.</li>
          <li>Click Connect Gmail and sign in with Google.</li>
          <li>Allow US360 to send mail on your behalf (Gmail send scope only).</li>
          <li>Send Test Email. The product shows Sent only if Gmail accepts the message.</li>
          <li>Turn on the reminder types you want. Automatic partner emails stay off until you enable them.</li>
        </ol>
      </Card>

      <Card>
        <CardTitle>Google Cloud (developers)</CardTitle>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6">
          <li>Create or open a Google Cloud project.</li>
          <li>Enable the <strong>Gmail API</strong>.</li>
          <li>
            Configure the OAuth consent screen. Add scopes <code>openid</code>,{" "}
            <code>https://www.googleapis.com/auth/userinfo.email</code>, and{" "}
            <code>https://www.googleapis.com/auth/gmail.send</code>.
          </li>
          <li>
            Create an OAuth client ID of type <strong>Web application</strong>. You can reuse the same client as Google
            sign-in.
          </li>
          <li>
            Authorized JavaScript origins: <code>http://localhost:3000</code> and your production origin (for example{" "}
            <code>https://us-360-eta.vercel.app</code>).
          </li>
          <li>
            Authorized redirect URIs — development:
            <ul className="mt-1 list-disc pl-5">
              <li>
                <code>http://localhost:3000/api/auth/callback/google</code> (sign-in)
              </li>
              <li>
                <code>http://localhost:3000/api/integrations/gmail/callback</code> (Gmail send)
              </li>
            </ul>
          </li>
          <li>
            Authorized redirect URIs — production (must match the live URL exactly):
            <ul className="mt-1 list-disc pl-5">
              <li>
                <code>https://YOUR-DOMAIN/api/auth/callback/google</code>
              </li>
              <li>
                <code>https://YOUR-DOMAIN/api/integrations/gmail/callback</code>
              </li>
            </ul>
          </li>
          <li>
            In Vercel → Project → Settings → Environment Variables, set server-side only (never <code>NEXT_PUBLIC_</code>
            ):
            <ul className="mt-1 list-disc pl-5">
              <li>
                <code>AUTH_GOOGLE_ID</code> / <code>AUTH_GOOGLE_SECRET</code> (or <code>GMAIL_GOOGLE_ID</code> /{" "}
                <code>GMAIL_GOOGLE_SECRET</code> if you use a separate client)
              </li>
              <li>
                <code>AUTH_URL</code> or <code>NEXT_PUBLIC_APP_URL</code> = production origin
              </li>
              <li>
                <code>GMAIL_REDIRECT_URI</code> = <code>https://YOUR-DOMAIN/api/integrations/gmail/callback</code>
              </li>
              <li>
                <code>AUTH_SECRET</code> and <code>TOKEN_ENCRYPTION_KEY</code> (encrypts Gmail refresh tokens)
              </li>
            </ul>
          </li>
          <li>Redeploy. Keep the daily cron (<code>CRON_SECRET</code> + <code>/api/jobs/run</code>) so scheduled Gmail sends fire.</li>
          <li>
            While the app is in Google testing mode, add each tester under OAuth consent screen → Test users.{" "}
            <code>gmail.send</code> is a sensitive scope and may require Google verification before a wide public rollout.
          </li>
        </ol>
      </Card>

      <Card>
        <CardTitle>What is emailed</CardTitle>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6">
          <li>From: your connected Gmail only</li>
          <li>Your reminders → your connected Gmail / account email</li>
          <li>Partner notes → their Profile email, only if you enable Automatic partner emails or Send now</li>
          <li>Reels / Instagram / Facebook / WhatsApp → never emailed or auto-sent</li>
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
