import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/card";

export default function IntegrationsDocsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <p className="text-xs uppercase tracking-[0.28em] text-rose">Official APIs only</p>
      <h1 className="font-display text-4xl text-navy">Platform setup</h1>
      <p className="text-muted">
        US360 never asks for personal Instagram, Facebook, or WhatsApp passwords and never uses browser bots. Until
        credentials exist, the app shows connected identifiers and opens the official app for you to tap send. It will
        not claim a message was sent.
      </p>
      <Card>
        <CardTitle>Instagram</CardTitle>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6">
          <li>Meta Developer account</li>
          <li>Instagram professional/business account where Meta requires it</li>
          <li>OAuth (`META_APP_ID`, `META_APP_SECRET`)</li>
          <li>Permissions such as `instagram_basic` / content publish where approved</li>
          <li>Access tokens and webhooks if you enable posting</li>
        </ul>
        <p className="mt-3 text-sm text-muted">Consumer DMs are not available to third-party apps. Fallback: Open Instagram.</p>
      </Card>
      <Card>
        <CardTitle>Facebook</CardTitle>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6">
          <li>Meta Developer account</li>
          <li>Page configuration where required</li>
          <li>OAuth and Page permissions</li>
          <li>Access tokens</li>
        </ul>
        <p className="mt-3 text-sm text-muted">Personal profile DMs are not automated. Fallback: Open Facebook.</p>
      </Card>
      <Card>
        <CardTitle>WhatsApp</CardTitle>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6">
          <li>Meta Developer account</li>
          <li>WhatsApp Business Cloud API</li>
          <li>Business phone number</li>
          <li>Access token, phone number ID, approved templates, webhooks</li>
        </ul>
        <p className="mt-3 text-sm text-muted">See /docs/whatsapp. Without a template, send opens wa.me for you to tap send.</p>
      </Card>
      <Card>
        <CardTitle>Email</CardTitle>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6">
          <li>SMTP or transactional provider (`SMTP_HOST`, `SMTP_FROM`, credentials)</li>
          <li>Verified sender address</li>
        </ul>
      </Card>
      <p className="text-sm">
        <Link className="underline" href="/reels">
          Back to Reels
        </Link>
      </p>
    </div>
  );
}
