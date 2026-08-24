import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/card";

export default function SetupDocsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <p className="text-xs uppercase tracking-[0.28em] text-rose">External services</p>
      <h1 className="font-display text-4xl text-navy">Full system setup</h1>
      <p className="text-muted">
        Follow these steps in order so US360 can run in production. This is not a Firebase app and it does not use
        Resend. Auth is Auth.js + PostgreSQL. Email is each person connecting their own Gmail.
      </p>

      <Card>
        <CardTitle>What US360 uses (and what it does not)</CardTitle>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6">
          <li>
            <strong>Not Firebase.</strong> Sign-in is Auth.js. Data is PostgreSQL. Push is optional VAPID web push, not
            Firebase Cloud Messaging.
          </li>
          <li>
            <strong>Not Resend / SendGrid / one shared mailbox.</strong> Each user clicks Connect Gmail. Mail is sent
            through Google OAuth and the Gmail API from that account.
          </li>
          <li>
            <strong>Not WhatsApp auto-send.</strong> Import a chat ZIP. Sending is Open WhatsApp — the user taps send.
          </li>
        </ul>
      </Card>

      <Card>
        <CardTitle>How it fits together</CardTitle>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6">
          <li>Vercel hosts the Next.js app.</li>
          <li>PostgreSQL stores profiles, memories, and jobs.</li>
          <li>Google OAuth is used for sign-in (optional) and for Connect Gmail (required for email).</li>
          <li>Daily cron calls <code>/api/jobs/run</code>. Reminders leave through that user&apos;s Gmail only.</li>
          <li>OpenAI, web push, live places, and Instagram OAuth are optional.</li>
        </ol>
      </Card>

      <Card>
        <CardTitle>1. Vercel (required)</CardTitle>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6">
          <li>Import the GitHub repo into Vercel.</li>
          <li>Use Node.js 24.x. The build already runs Prisma generate, migrate deploy, then Next.js.</li>
          <li>Copy the production URL (for example <code>https://us-360-eta.vercel.app</code>).</li>
          <li>
            Set <code>AUTH_URL</code> and <code>NEXT_PUBLIC_APP_URL</code> to that exact HTTPS origin, then redeploy.
          </li>
        </ol>
      </Card>

      <Card>
        <CardTitle>2. PostgreSQL (required)</CardTitle>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6">
          <li>Create a database (Vercel Postgres, Neon, or Supabase) and attach it to the project.</li>
          <li>
            Set <code>DATABASE_URL</code> to the pooled URL and <code>DIRECT_URL</code> to the direct / non-pooling URL
            (used for migrations).
          </li>
        </ol>
      </Card>

      <Card>
        <CardTitle>3. Secrets (required)</CardTitle>
        <p className="mt-3 text-sm text-muted">Generate each with openssl rand -base64 32. Server-side only — never NEXT_PUBLIC_.</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6">
          <li>
            <code>AUTH_SECRET</code> — session signing
          </li>
          <li>
            <code>TOKEN_ENCRYPTION_KEY</code> — encrypts Gmail tokens on the server
          </li>
          <li>
            <code>CRON_SECRET</code> — protects the daily job runner
          </li>
        </ul>
      </Card>

      <Card>
        <CardTitle>4. Google Cloud — sign-in + Gmail (required for email)</CardTitle>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6">
          <li>Create or open a Google Cloud project and enable the Gmail API.</li>
          <li>
            OAuth consent scopes: <code>openid</code>, <code>userinfo.email</code>, and <code>gmail.send</code>.
          </li>
          <li>Create a Web application OAuth client (the same client as Google sign-in is fine).</li>
          <li>
            Origins: <code>http://localhost:3000</code> and <code>https://YOUR-DOMAIN</code>.
          </li>
          <li>
            Redirect URIs — local and production — for both:
            <ul className="mt-1 list-disc pl-5">
              <li>
                <code>/api/auth/callback/google</code> (sign-in)
              </li>
              <li>
                <code>/api/integrations/gmail/callback</code> (Connect Gmail)
              </li>
            </ul>
          </li>
          <li>
            In Vercel set <code>AUTH_GOOGLE_ID</code>, <code>AUTH_GOOGLE_SECRET</code>,{" "}
            <code>GMAIL_REDIRECT_URI</code> = <code>https://YOUR-DOMAIN/api/integrations/gmail/callback</code>.
          </li>
          <li>
            While Google is in testing mode, add each tester. Then in the app: Settings → Connect Gmail → Send Test
            Email.
          </li>
        </ol>
        <p className="mt-3 text-sm text-muted">
          Detail:{" "}
          <Link className="underline" href="/docs/email">
            /docs/email
          </Link>
          .
        </p>
      </Card>

      <Card>
        <CardTitle>5. Cron (required for daily reminders)</CardTitle>
        <p className="mt-3 text-sm leading-6 text-muted">
          Vercel already calls <code>/api/jobs/run</code> once per day with <code>Authorization: Bearer CRON_SECRET</code>.
          Set <code>CRON_SECRET</code>. Without cron, test emails still work; scheduled reminders will not fire on their
          own.
        </p>
      </Card>

      <Card>
        <CardTitle>6. Optional extras</CardTitle>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6">
          <li>
            <code>AI_API_KEY</code> (OpenAI) — smarter assistant. The rest of the app works without it.
          </li>
          <li>
            VAPID keys (<code>npx web-push generate-vapid-keys</code>) — browser push. Not Firebase.
          </li>
          <li>
            <code>GOOGLE_PLACES_API_KEY</code> / <code>FOURSQUARE_API_KEY</code> — live venues. Otherwise the Pakistan
            city catalog is used.
          </li>
          <li>
            <code>META_APP_ID</code> / <code>META_APP_SECRET</code> — official Instagram OAuth. Reels are never auto-sent.
          </li>
        </ul>
      </Card>

      <Card>
        <CardTitle>After deploy, in the product</CardTitle>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6">
          <li>Register. Choose male or female for you and your partner.</li>
          <li>On Profile, tap chips or write your own — both work.</li>
          <li>Settings → Connect Gmail → Send Test Email.</li>
          <li>Turn on the reminder types you want.</li>
        </ol>
      </Card>

      <p className="text-sm">
        <Link className="underline" href="/settings">
          Settings
        </Link>
        {" · "}
        <Link className="underline" href="/docs/email">
          Gmail
        </Link>
        {" · "}
        <Link className="underline" href="/docs/integrations">
          Other platforms
        </Link>
      </p>
    </div>
  );
}
