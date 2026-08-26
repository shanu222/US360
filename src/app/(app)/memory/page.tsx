"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { Badge } from "@/components/ui/badge";
import { usePartnerVoice } from "@/lib/use-partner-voice";

const CATS = ["ALL", "FAVORITES", "LIKES", "DISLIKES", "IMPORTANT", "MEMORIES", "PROMISES", "GOALS", "PREFERENCES", "GENERAL"];

type Memory = {
  id: string;
  title: string;
  content: string;
  category: string;
  importance: string;
  createdAt: string;
};

export default function MemoryPage() {
  const voice = usePartnerVoice();
  const [items, setItems] = useState<Memory[]>([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("ALL");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<{ kind: string; title: string; quote: string }[]>([]);

  async function load() {
    setLoading(true);
    const [mem, pend] = await Promise.all([fetch("/api/memories"), fetch("/api/lifestyle/pending")]);
    const json = await mem.json();
    const pjson = await pend.json();
    setItems(json.data ?? []);
    setPending(pjson.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () =>
      items.filter((i) => (cat === "ALL" || i.category === cat) && `${i.title} ${i.content}`.toLowerCase().includes(q.toLowerCase())),
    [items, cat, q],
  );

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/memories", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, content, category: cat === "ALL" ? "GENERAL" : cat }),
    });
    if (!res.ok) return toast.error("Could not save memory");
    setTitle("");
    setContent("");
    toast.success("Remembered.");
    load();
  }

  async function decidePending(item: { title: string; quote: string }, action: "confirm" | "dismiss") {
    const res = await fetch("/api/lifestyle/pending", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: item.title, quote: item.quote, action }),
    });
    if (!res.ok) return toast.error("Could not update that.");
    toast.success(action === "confirm" ? "Saved to memory." : "Ignored.");
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/memories/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-4xl text-navy">Memory</h1>
      <p className="mt-2 text-muted">What you want kept. Chat details stay in the background unless you confirm them here.</p>
      {pending.length ? (
        <Card className="mt-6">
          <p className="text-sm font-medium">Confirm later</p>
          <p className="mt-1 text-xs text-muted">Food and place notes from chat — not shown while you ask a question.</p>
          <div className="mt-3 space-y-2">
            {pending.slice(0, 8).map((item) => (
              <div key={`${item.title}-${item.quote}`} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-paper px-3 py-2">
                <p className="text-sm">
                  {item.kind}: {item.title}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => void decidePending(item, "confirm")}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => void decidePending(item, "dismiss")}>
                    Ignore
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
      <form onSubmit={add} className="card-premium mt-6 space-y-3 p-5">
        <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <Textarea placeholder={`${voice.They} loves roses. ${voice.They} has a presentation on Friday.`} value={content} onChange={(e) => setContent(e.target.value)} required />
        <Button type="submit">Add memory</Button>
      </form>
      <div className="mt-6 flex flex-wrap gap-2">
        {CATS.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`rounded-full px-3 py-1 text-xs ${cat === c ? "bg-navy text-cream" : "bg-paper"}`}>
            {c}
          </button>
        ))}
      </div>
      <Input className="mt-4" placeholder="Search memories" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {loading ? <p className="text-sm text-muted">Loading memories…</p> : null}
        {!loading && filtered.length === 0 ? (
          <div className="md:col-span-2">
            <EmptyState title="No memories yet" description="Start with something simple: a favorite, a date, a promise." />
          </div>
        ) : null}
        {filtered.map((m) => (
          <Card key={m.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{m.title}</p>
                <p className="mt-2 text-sm text-muted">{m.content}</p>
              </div>
              <Badge>{m.category.toLowerCase()}</Badge>
            </div>
            <p className="mt-3 text-xs text-muted">{new Date(m.createdAt).toLocaleDateString()}</p>
            <Button size="sm" variant="ghost" className="mt-2" onClick={() => remove(m.id)}>
              Delete
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
