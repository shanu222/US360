"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { REEL_CATEGORIES } from "@/types";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CommandBar } from "@/features/assistant/command-bar";
import { usePartnerVoice } from "@/lib/use-partner-voice";

type Reel = {
  id: string;
  url: string;
  category: string;
  notes?: string | null;
  favorite: boolean;
};

type Pending = { title: string; at: string; type: string; hint: string; quote: string };
type Platform = { connected: boolean; serverConfigured: boolean; handle: string | null; canAutoSend: boolean; auto: boolean; fallback: string; label: string };

export default function ReelsPage() {
  const voice = usePartnerVoice();
  const [reels, setReels] = useState<Reel[]>([]);
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("CUTE");
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState<Pending[]>([]);
  const [platforms, setPlatforms] = useState<Record<string, Platform>>({});
  const [showLibrary, setShowLibrary] = useState(false);

  async function load() {
    const [r, p, s] = await Promise.all([
      fetch("/api/reels"),
      fetch("/api/calendar/pending"),
      fetch("/api/integrations/status"),
    ]);
    const reelsJson = await r.json();
    const pend = await p.json();
    const status = await s.json();
    setReels(reelsJson.data ?? []);
    setPending(pend.data ?? []);
    setPlatforms(status.data ?? {});
  }

  useEffect(() => {
    load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/reels", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url, category, notes }),
    });
    if (!res.ok) return toast.error("Could not save Reel");
    setUrl("");
    setNotes("");
    load();
  }

  async function decidePending(item: Pending, action: "confirm" | "dismiss") {
    const res = await fetch("/api/calendar/pending", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: item.title, at: item.at, action }),
    });
    if (!res.ok) return toast.error("Could not update that date.");
    toast.success(action === "confirm" ? "Added to calendar." : "Ignored.");
    load();
  }

  async function saveAuto(id: string, value: boolean) {
    if (id !== "email") return;
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ emailNotifications: value, autoEmail: value }),
    });
    load();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-4xl text-navy">What should I send?</h1>
        <p className="mt-2 text-muted">
          Tell US360 what is happening. It finds a Reel from {voice.their} likes and the chat when a Reel is actually appropriate —
          no saved library required. You still approve anything that leaves the app.
        </p>
      </div>

      <Card>
        <p className="text-xs uppercase tracking-[0.2em] text-rose">Connected accounts</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {["instagram", "facebook", "whatsapp", "email"].map((id) => {
            const p = platforms[id];
            return (
              <div key={id} className="rounded-2xl bg-paper p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium capitalize">{id}</p>
                  <Badge tone={p?.connected ? "success" : "default"}>{p?.connected ? "✓ connected" : "not set"}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {p?.serverConfigured ? "Server API ready" : "API credentials not configured"}
                  {p?.handle ? ` · ${p.handle}` : ""}
                </p>
                <p className="mt-1 text-xs text-muted">{p?.canAutoSend ? "Reminders send from your connected Gmail" : p?.fallback}</p>
                {id === "email" ? (
                  <label className="mt-2 flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={Boolean(p?.auto)}
                      onChange={(e) => void saveAuto(id, e.target.checked)}
                    />
                    Auto-send reminder emails to addresses saved in the system
                  </label>
                ) : (
                  <p className="mt-2 text-xs text-muted">Never auto-sent. You open the app and send it yourself.</p>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted">
          Add {voice.their} usernames on{" "}
          <Link className="underline" href="/profile">
            Profile
          </Link>
          .           Setup for mail reminders:{" "}
          <Link className="underline" href="/docs/email">
            email steps
          </Link>
          . Instagram, Facebook, and WhatsApp stay open-and-send.
          .
        </p>
      </Card>

      {pending.length ? (
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-rose">From the WhatsApp export</p>
          <p className="mt-2 text-sm text-muted">Possible upcoming events. Confirm before they stay on the calendar.</p>
          <div className="mt-4 space-y-3">
            {pending.map((item) => (
              <div key={`${item.title}-${item.at}`} className="rounded-2xl bg-paper p-3">
                <p className="font-medium">
                  {item.title} — {new Date(item.at).toLocaleDateString()}
                </p>
                <p className="text-xs text-muted">{item.hint}</p>
                <p className="mt-1 text-sm italic">“{item.quote}”</p>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" onClick={() => void decidePending(item, "confirm")}>
                    Add event
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => void decidePending(item, "dismiss")}>
                    Ignore
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <CommandBar />

      <div>
        <button type="button" className="text-sm underline" onClick={() => setShowLibrary((v) => !v)}>
          {showLibrary ? "Hide optional library" : "Optional: save a Reel URL for later"}
        </button>
        {showLibrary ? (
          <form onSubmit={add} className="card-premium mt-4 space-y-3 p-5">
            <p className="text-sm text-muted">You do not need this. Commands search Instagram from {voice.their} likes. This is only if you want to keep a URL.</p>
            <div>
              <Label>Reel URL</Label>
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.instagram.com/reel/…" />
            </div>
            <div className="flex flex-wrap gap-2">
              {REEL_CATEGORIES.map((c) => (
                <button key={c} type="button" onClick={() => setCategory(c)} className={`rounded-full px-3 py-1 text-xs ${category === c ? "bg-navy text-cream" : "bg-paper"}`}>
                  {c}
                </button>
              ))}
            </div>
            <Textarea placeholder={`Why this fits ${voice.them}`} value={notes} onChange={(e) => setNotes(e.target.value)} />
            <Button type="submit">Save for later</Button>
            {reels.map((r) => (
              <p key={r.id} className="break-all text-xs text-muted">
                {r.category}: {r.url}
              </p>
            ))}
          </form>
        ) : null}
      </div>
    </div>
  );
}
