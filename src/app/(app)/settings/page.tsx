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
  whatsappNumber?: string | null;
  whatsappReminders?: boolean;
  whatsapp?: {
    configured: boolean;
    hasToken: boolean;
    hasPhoneNumberId: boolean;
    hasTemplate: boolean;
    webhookUrl: string;
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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-display text-4xl text-navy">Settings</h1>

      <Card>
        <CardTitle>WhatsApp reminders</CardTitle>
        {settings.whatsapp?.configured ? (
          <p className="mt-2 text-sm text-muted">
            Official Cloud API is configured on the server. Reminders go to your number after you opt in — never through a
            personal WhatsApp login or browser bot.
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted">
            WhatsApp sending is not active yet. Calendar reminders still work in the app, by email, and by web push. To
            enable WhatsApp, a Meta Cloud API token, phone number ID, and an approved template must be added on the server.
            The product will not pretend a WhatsApp message was sent until then.
          </p>
        )}
        <div className="mt-4 space-y-4">
          <div>
            <Label>Your WhatsApp number (E.164, digits with country code)</Label>
            <Input
              inputMode="tel"
              placeholder="923001234567"
              defaultValue={settings.whatsappNumber ?? ""}
              onBlur={(e) => save({ whatsappNumber: e.target.value.trim() })}
            />
          </div>
          <Row
            label="Send calendar reminders on WhatsApp"
            checked={Boolean(settings.whatsappReminders) && Boolean(settings.whatsapp?.configured)}
            onChange={(v) => {
              if (v && !settings.whatsapp?.configured) {
                toast.error("WhatsApp Cloud API is not configured on the server yet.");
                return;
              }
              save({ whatsappReminders: v });
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={!settings.whatsapp?.configured}
              onClick={async () => {
                const res = await fetch("/api/integrations/whatsapp", { method: "POST" });
                const json = await res.json();
                if (!res.ok) return toast.error(json.error ?? "Could not send a test message.");
                toast.success("Test reminder accepted by Meta.");
              }}
            >
              Send test reminder
            </Button>
            <Button asChild variant="ghost">
              <a href="/docs/whatsapp">Setup guide</a>
            </Button>
          </div>
          <p className="text-xs text-muted">
            WhatsApp reminders also need Notifications and Events enabled. Missing:{" "}
            {[
              !settings.whatsapp?.hasToken && "access token",
              !settings.whatsapp?.hasPhoneNumberId && "phone number ID",
              !settings.whatsapp?.hasTemplate && "approved template name",
            ]
              .filter(Boolean)
              .join(", ") || "nothing — Cloud API looks ready."}
          </p>
        </div>
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
            ["ASSISTED", "Assisted Mode — scheduling is allowed; external actions follow supported integrations."],
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
          <Row label="Email" checked={settings.emailNotifications} onChange={(v) => save({ emailNotifications: v })} />
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
