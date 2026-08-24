"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

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
  partnerEmail?: string | null;
  email?: {
    configured: boolean;
    ready: boolean;
    hasHost: boolean;
    hasUser: boolean;
    hasPassword: boolean;
    hasFrom: boolean;
    docs: string;
  };
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);

  async function load() {
    const res = await fetch("/api/settings");
    const json = await res.json();
    setSettings(json.data);
  }

  useEffect(() => {
    load();
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

  const missingSmtp = [
    !settings.email?.hasHost && "SMTP_HOST",
    !settings.email?.hasFrom && "SMTP_FROM",
    !settings.email?.hasUser && "SMTP_USER",
    !settings.email?.hasPassword && "SMTP_PASSWORD",
  ].filter(Boolean);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-display text-4xl text-navy">Settings</h1>

      <Card>
        <CardTitle>Email reminders</CardTitle>
        {settings.email?.configured ? (
          <p className="mt-2 text-sm text-muted">
            SMTP is configured. Calendar reminders and prepared notes can go automatically to emails already saved in
            the system — your account address and her address on Profile.
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted">
            Mail sending is not active yet. Reminders still appear in the app and by web push. Add SMTP on the server
            so saved addresses can receive automatic reminder emails. WhatsApp, Instagram, and Facebook are never
            auto-sent.
          </p>
        )}
        <ul className="mt-3 space-y-1 text-sm">
          <li>
            Your account: <span className="font-medium">{settings.accountEmail || "not set"}</span>
          </li>
          <li>
            Her email (Profile): <span className="font-medium">{settings.partnerEmail || "not set — add it on Profile"}</span>
          </li>
        </ul>
        <p className="mt-2 text-xs text-muted">
          {missingSmtp.length
            ? `Server still needs: ${missingSmtp.join(", ")}.`
            : "SMTP looks ready."}{" "}
          Follow the external setup steps at{" "}
          <a className="underline" href="/docs/email">
            /docs/email
          </a>
          .
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={!settings.email?.configured || !settings.accountEmail}
            onClick={async () => {
              const res = await fetch("/api/integrations/email", { method: "POST" });
              const json = await res.json();
              if (!res.ok) return toast.error(json.error ?? "Could not send a test email.");
              toast.success(`Test email accepted for ${json.data?.to ?? "your address"}.`);
            }}
          >
            Send test email
          </Button>
          <Button asChild variant="ghost">
            <a href="/docs/email">Mail setup steps</a>
          </Button>
          <Button asChild variant="ghost">
            <a href="/profile">Add her email</a>
          </Button>
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
            ["ASSISTED", "Assisted Mode — scheduling is allowed; only email reminders can leave the app automatically."],
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
          <Row label="Email reminders to saved addresses" checked={settings.emailNotifications} onChange={(v) => save({ emailNotifications: v })} />
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
          exports are only processed when you upload them. Generated drafts stay yours. You can export or delete at any time.
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
