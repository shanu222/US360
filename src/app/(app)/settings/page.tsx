"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { voiceFor } from "@/lib/voice";

type Gmail = {
  configured: boolean;
  connected: boolean;
  expired: boolean;
  email: string | null;
  status: string;
};

type Settings = {
  automationMode: string;
  morningTime: string;
  afternoonTime: string;
  eveningTime: string;
  nightTime: string;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  notifyMorning: boolean;
  notifyEvening: boolean;
  notifyNight: boolean;
  notifyEvents: boolean;
  aiShareMemories: boolean;
  aiShareCalendar: boolean;
  aiShareSituations: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  timezone?: string;
  accountEmail?: string | null;
  myEmail?: string | null;
  partnerEmail?: string | null;
  partnerGender?: string | null;
  emailCalendarReminders?: boolean;
  emailEventReminders?: boolean;
  emailImportantDates?: boolean;
  emailRelationshipReminders?: boolean;
  emailScheduledMessages?: boolean;
  autoPartnerEmail?: boolean;
  autoEmail?: boolean;
  gmail?: Gmail;
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [testing, setTesting] = useState(false);

  async function load() {
    const res = await fetch("/api/settings");
    const json = await res.json();
    setSettings(json.data);
  }

  useEffect(() => {
    load();
    const q = new URLSearchParams(window.location.search).get("gmail");
    if (q === "connected") toast.success("Gmail connected.");
    if (q === "error") toast.error("Gmail authorization failed. Try Connect Gmail again.");
    if (q === "denied") toast.error("Gmail access was denied.");
    if (q === "setup") toast.error("Google OAuth is not configured on the server yet. See /docs/email.");
  }, []);

  async function save(patch: Partial<Settings>) {
    const next = { ...settings, ...patch } as Settings;
    setSettings(next);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    toast.success("Saved.");
  }

  if (!settings) return <p className="text-sm text-muted">Loading settings…</p>;

  const voice = voiceFor(settings.partnerGender);
  const gmail = settings.gmail;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-display text-4xl text-navy">Settings</h1>

      <Card>
        <p className="text-xs uppercase tracking-[0.2em] text-rose">Email & notifications</p>
        <CardTitle className="mt-2">Gmail</CardTitle>
        <p className="mt-2 text-sm text-muted">
          Connect your own Gmail. Reminders are sent from that account through Google&apos;s official OAuth and Gmail
          API — not a shared mailbox, and never with a Gmail password.
        </p>

        {gmail?.expired ? (
          <p className="mt-3 rounded-2xl bg-paper px-4 py-3 text-sm">
            ⚠️ Gmail connection expired
            <span className="mt-1 block text-muted">Reconnect so US360 can keep sending from your account.</span>
          </p>
        ) : gmail?.connected ? (
          <p className="mt-3 rounded-2xl bg-paper px-4 py-3 text-sm">
            ✅ Gmail Connected
            <span className="mt-1 block font-medium">{gmail.email}</span>
          </p>
        ) : (
          <p className="mt-3 text-sm text-muted">Connect your Gmail account to receive US360 reminders.</p>
        )}

        <ul className="mt-3 space-y-1 text-sm">
          <li>
            My Email: <span className="font-medium">{settings.myEmail || gmail?.email || settings.accountEmail || "not set"}</span>
          </li>
          <li>
            {voice.Their} email (Profile):{" "}
            <span className="font-medium">{settings.partnerEmail || "not set — add it on Profile"}</span>
          </li>
        </ul>
        <p className="mt-2 text-xs text-muted">
          From is always your connected Gmail. US360 will not claim a send unless Gmail accepts the message.{" "}
          <a className="underline" href="/docs/email">
            Google Cloud setup
          </a>
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {gmail?.connected && !gmail.expired ? (
            <>
              <Button
                variant="outline"
                disabled={testing}
                onClick={async () => {
                  setTesting(true);
                  const res = await fetch("/api/integrations/email", { method: "POST" });
                  const json = await res.json();
                  setTesting(false);
                  if (!res.ok) return toast.error(json.error ?? "Failed");
                  toast.success(`Sent from ${json.data?.from ?? "your Gmail"} to ${json.data?.to}.`);
                }}
              >
                {testing ? "Sending…" : "Send Test Email"}
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  if (!confirm("Disconnect Gmail? Scheduled emails will wait until you reconnect.")) return;
                  const res = await fetch("/api/integrations/gmail", { method: "DELETE" });
                  if (!res.ok) return toast.error("Could not disconnect Gmail.");
                  toast.success("Gmail disconnected.");
                  load();
                }}
              >
                Disconnect Gmail
              </Button>
            </>
          ) : (
            <Button asChild>
              <a href="/api/integrations/gmail/start">{gmail?.expired ? "Reconnect Gmail" : "Connect Gmail"}</a>
            </Button>
          )}
          <Button asChild variant="ghost">
            <a href="/profile">Add {voice.their} email</a>
          </Button>
        </div>

        <p className="mt-6 text-xs uppercase tracking-[0.2em] text-rose">Email settings</p>
        <div className="mt-3 space-y-4">
          <Row label="Calendar reminders" checked={settings.emailCalendarReminders !== false} onChange={(v) => save({ emailCalendarReminders: v })} />
          <Row label="Event reminders" checked={settings.emailEventReminders !== false} onChange={(v) => save({ emailEventReminders: v })} />
          <Row label="Important-date reminders" checked={settings.emailImportantDates !== false} onChange={(v) => save({ emailImportantDates: v })} />
          <Row label="Relationship reminders" checked={settings.emailRelationshipReminders !== false} onChange={(v) => save({ emailRelationshipReminders: v })} />
          <Row label="Scheduled messages" checked={settings.emailScheduledMessages !== false} onChange={(v) => save({ emailScheduledMessages: v })} />
          <Row
            label="Automatic partner emails"
            checked={Boolean(settings.autoPartnerEmail)}
            onChange={(v) => save({ autoPartnerEmail: v, autoEmail: v })}
          />
        </div>
      </Card>

      <Card>
        <CardTitle>Instagram, Facebook, WhatsApp</CardTitle>
        <p className="mt-2 text-sm text-muted">
          These are never auto-sent — not reminders, and not Reels. US360 can open the official app with a caption
          ready. You tap send yourself. Chat import still uses a WhatsApp export ZIP, not a live login.
        </p>
      </Card>

      <Card>
        <CardTitle>WhatsApp chat</CardTitle>
        <p className="mt-2 text-sm text-muted">
          Upload a WhatsApp export ZIP. US360 reads the whole chat locally on the server — no AI — and fills Memory,
          likes, dates, and your writing style.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <a href="/import-chat?again=1">Import or replace chat</a>
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              if (!confirm("Delete the uploaded WhatsApp export and extracted chat records?")) return;
              await fetch("/api/privacy/chat", { method: "DELETE" });
              toast.success("Uploaded chat deleted.");
            }}
          >
            Delete uploaded chat
          </Button>
        </div>
      </Card>

      <Card>
        <CardTitle>Automation</CardTitle>
        <div className="mt-4 space-y-3">
          {[
            ["SMART", "Smart Mode — prepares recommendations and cards. You approve sending."],
            ["ASSISTED", "Assisted Mode — scheduling is allowed; only your connected Gmail can leave the app automatically."],
            ["MANUAL", "Manual Mode — AI only recommends. Nothing is scheduled automatically."],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => save({ automationMode: id })}
              className={`block w-full rounded-2xl border p-3 text-left text-sm ${settings.automationMode === id ? "border-navy" : "border-line"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </Card>

      <Card id="notifications">
        <CardTitle>Notifications</CardTitle>
        <div className="mt-4 space-y-4">
          <Row label="Enable notifications" checked={settings.notificationsEnabled} onChange={(v) => save({ notificationsEnabled: v })} />
          <Row label="Email reminders from my Gmail" checked={settings.emailNotifications} onChange={(v) => save({ emailNotifications: v })} />
          <Row label="Web push" checked={settings.pushNotifications} onChange={(v) => save({ pushNotifications: v })} />
          <Row label="Morning" checked={settings.notifyMorning} onChange={(v) => save({ notifyMorning: v })} />
          <Row label="Evening" checked={settings.notifyEvening} onChange={(v) => save({ notifyEvening: v })} />
          <Row label="Night" checked={settings.notifyNight} onChange={(v) => save({ notifyNight: v })} />
          <Row label="Events" checked={settings.notifyEvents} onChange={(v) => save({ notifyEvents: v })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Quiet hours start</Label>
              <Input type="time" value={settings.quietHoursStart} onChange={(e) => save({ quietHoursStart: e.target.value })} />
            </div>
            <div>
              <Label>Quiet hours end</Label>
              <Input type="time" value={settings.quietHoursEnd} onChange={(e) => save({ quietHoursEnd: e.target.value })} />
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle>AI data preferences</CardTitle>
        <div className="mt-4 space-y-4">
          <Row label="Share memories with AI" checked={settings.aiShareMemories} onChange={(v) => save({ aiShareMemories: v })} />
          <Row label="Share calendar with AI" checked={settings.aiShareCalendar} onChange={(v) => save({ aiShareCalendar: v })} />
          <Row label="Share recent situations" checked={settings.aiShareSituations} onChange={(v) => save({ aiShareSituations: v })} />
        </div>
      </Card>

      <Card>
        <CardTitle>Privacy</CardTitle>
        <p className="mt-2 text-sm text-muted">
          US360 stores the profile, memories, dates, cards, messages, Reels, and command history you save. WhatsApp
          exports are only processed when you upload them. Gmail tokens stay encrypted on the server and are never sent
          to the browser. You can export or delete at any time.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <a href="/api/privacy/export">Export my data</a>
          </Button>
          <Button variant="outline" onClick={() => fetch("/api/privacy/memories", { method: "DELETE" }).then(() => toast.success("Memories deleted"))}>
            Delete memory
          </Button>
          <Button variant="outline" onClick={() => fetch("/api/privacy/relationship", { method: "DELETE" }).then(() => toast.success("Relationship data deleted"))}>
            Delete relationship data
          </Button>
          <Button variant="outline" onClick={() => fetch("/api/integrations/instagram", { method: "DELETE" }).then(() => toast.success("Instagram disconnected"))}>
            Disconnect Instagram
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              if (!confirm("Delete your account and all data? This cannot be undone.")) return;
              await fetch("/api/privacy/account", { method: "DELETE" });
              await signOut({ callbackUrl: "/" });
            }}
          >
            Delete account
          </Button>
        </div>
      </Card>

      <Button variant="ghost" onClick={() => signOut({ callbackUrl: "/" })}>
        Sign out
      </Button>
    </div>
  );
}

function Row({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
