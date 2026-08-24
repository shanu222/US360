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

type Idea = { query: string; search: string; tag: string };
type Schedule = { id: string; status: string; scheduledAt: string; reelId?: string };

export default function ReelsPage() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("ROMANTIC");
  const [notes, setNotes] = useState("");
  const [connected, setConnected] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [cadenceBusy, setCadenceBusy] = useState(false);

  async function load() {
    const [r, i, s, q] = await Promise.all([
      fetch("/api/reels"),
      fetch("/api/integrations/instagram"),
      fetch("/api/reels/schedule"),
      fetch("/api/reels/ideas"),
    ]);
    const reelsJson = await r.json();
    const ig = await i.json();
    const sch = await s.json();
    const ideaJson = await q.json();
    setReels(reelsJson.data ?? []);
    setConnected(Boolean(ig.data?.connected));
    setSchedules(sch.data ?? []);
    setIdeas(ideaJson.data ?? []);
  }

  useEffect(() => {
    load();
    if (new URLSearchParams(window.location.search).get("ig") === "manual") {
      toast.message("Open Instagram & Share", {
        description: "Official posting isn’t available. Search, save a Reel, then let US360 space the shares.",
      });
    }
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

  async function cadence() {
    setCadenceBusy(true);
    const res = await fetch("/api/reels/cadence", { method: "POST" });
    const json = await res.json();
    setCadenceBusy(false);
    if (!res.ok) return toast.error(json.error ?? "Could not schedule");
    toast.success(`${json.data.scheduled} Reels spaced ~${json.data.gapHours} hours apart. You’ll be asked to share when each is due.`);
    load();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-4xl text-navy">Reels from your chat</h1>
        <p className="mt-2 text-muted">
          US360 never logs into Instagram for you or sends a DM in the background. It searches from chat topics, you save the Reel, then a cadence reminds you with a gap between shares.
        </p>
      </div>
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium">Connect Instagram</p>
          <p className="text-sm text-muted">Official OAuth. Direct auto-send only exists for approved professional accounts.</p>
        </div>
        {connected ? (
          <Badge tone="success">Connected</Badge>
        ) : (
          <Button asChild>
            <a href="/api/integrations/instagram/start">Connect Instagram</a>
          </Button>
        )}
      </Card>

      {ideas.length ? (
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-rose">Search from WhatsApp</p>
          <p className="mt-2 text-sm text-muted">Opens Instagram explore for words that showed up in the export.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {ideas.map((idea) => (
              <a
                key={idea.query}
                href={idea.search}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-gradient-to-r from-navy to-rose px-4 py-2 text-xs text-cream shadow-soft"
              >
                {idea.query}
              </a>
            ))}
          </div>
        </Card>
      ) : null}

      <form onSubmit={add} className="card-premium space-y-3 p-5">
        <div>
          <Label>Paste the Reel URL you found</Label>
          <Input value={url} onChange={(e) => setUrl(e.target.value)} required placeholder="https://www.instagram.com/reel/…" />
        </div>
        <div className="flex flex-wrap gap-2">
          {REEL_CATEGORIES.map((c) => (
            <button key={c} type="button" onClick={() => setCategory(c)} className={`rounded-full px-3 py-1 text-xs ${category === c ? "bg-navy text-cream" : "bg-paper"}`}>
              {c}
            </button>
          ))}
        </div>
        <Textarea placeholder="Why this fits her" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          <Button type="submit">Save Reel</Button>
          <Button type="button" variant="outline" disabled={cadenceBusy || reels.length === 0} onClick={cadence}>
            {cadenceBusy ? "Scheduling…" : "Auto cadence with gaps"}
          </Button>
        </div>
      </form>
      <div className="grid gap-4 md:grid-cols-2">
        {reels.length === 0 ? (
          <div className="md:col-span-2">
            <EmptyState title="No Reels saved" description="Search from the chips above, then paste the URL. Cadence will space them so it doesn’t feel automatic." />
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
              </div>
            </Card>
          ))
        )}
      </div>
      {schedules.length ? (
        <div>
          <h2 className="font-display text-2xl">Cadence</h2>
          <div className="mt-3 space-y-2">
            {schedules.map((s) => (
              <Card key={s.id} className="flex items-center justify-between">
                <span className="text-sm">{new Date(s.scheduledAt).toLocaleString()}</span>
                <Badge tone={s.status === "REQUIRES_ACTION" ? "rose" : "default"}>{s.status.replaceAll("_", " ")}</Badge>
              </Card>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
