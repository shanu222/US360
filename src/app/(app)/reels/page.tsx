"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { REEL_CATEGORIES } from "@/types";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";

type Reel = {
  id: string;
  url: string;
  category: string;
  notes?: string | null;
  favorite: boolean;
};

export default function ReelsPage() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("ROMANTIC");
  const [notes, setNotes] = useState("");
  const [connected, setConnected] = useState(false);
  const [schedules, setSchedules] = useState<{ id: string; status: string; scheduledAt: string }[]>([]);

  async function load() {
    const [r, i, s] = await Promise.all([fetch("/api/reels"), fetch("/api/integrations/instagram"), fetch("/api/reels/schedule")]);
    const reelsJson = await r.json();
    const ig = await i.json();
    const sch = await s.json();
    setReels(reelsJson.data ?? []);
    setConnected(Boolean(ig.data?.connected));
    setSchedules(sch.data ?? []);
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

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-4xl text-navy">Reel vault</h1>
        <p className="mt-2 text-muted">Save Reels you already love. US360 never asks for an Instagram password.</p>
      </div>
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium">Connect Instagram</p>
          <p className="text-sm text-muted">Official OAuth only. If posting isn’t supported, use Open Instagram & Share.</p>
        </div>
        {connected ? (
          <Badge tone="success">Connected</Badge>
        ) : (
          <Button asChild>
            <a href="/api/integrations/instagram/start">Connect Instagram</a>
          </Button>
        )}
      </Card>
      <form onSubmit={add} className="card-premium space-y-3 p-5">
        <div>
          <Label>Reel URL</Label>
          <Input value={url} onChange={(e) => setUrl(e.target.value)} required placeholder="https://www.instagram.com/reel/…" />
        </div>
        <div className="flex flex-wrap gap-2">
          {REEL_CATEGORIES.map((c) => (
            <button key={c} type="button" onClick={() => setCategory(c)} className={`rounded-full px-3 py-1 text-xs ${category === c ? "bg-navy text-cream" : "bg-paper"}`}>
              {c}
            </button>
          ))}
        </div>
        <Textarea placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <Button type="submit">Save Reel</Button>
      </form>
      <div className="grid gap-4 md:grid-cols-2">
        {reels.length === 0 ? (
          <div className="md:col-span-2">
            <EmptyState title="No Reels saved" description="Paste a URL from Instagram. We’ll help you remember when a share might fit." />
          </div>
        ) : (
          reels.map((r) => (
            <Card key={r.id}>
              <Badge>{r.category}</Badge>
              <p className="mt-3 break-all text-sm">{r.url}</p>
              {r.notes ? <p className="mt-2 text-sm text-muted">{r.notes}</p> : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" asChild>
                  <a href={r.url} target="_blank" rel="noreferrer">
                    Open Instagram & Share
                  </a>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    const when = prompt("Schedule (YYYY-MM-DDTHH:MM)");
                    if (!when) return;
                    await fetch("/api/reels/schedule", {
                      method: "POST",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({ reelId: r.id, scheduledAt: when }),
                    });
                    toast.success("Scheduled. You’ll be asked to share when it’s time.");
                    load();
                  }}
                >
                  Schedule
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
      {schedules.length ? (
        <div>
          <h2 className="font-display text-2xl">Scheduled</h2>
          <div className="mt-3 space-y-2">
            {schedules.map((s) => (
              <Card key={s.id} className="flex items-center justify-between">
                <span className="text-sm">{new Date(s.scheduledAt).toLocaleString()}</span>
                <Badge>{s.status.replaceAll("_", " ")}</Badge>
              </Card>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
