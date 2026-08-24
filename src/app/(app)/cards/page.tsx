"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CARD_CATEGORIES } from "@/types";
import { CARD_THEMES } from "@/ai/cards";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

type SavedCard = {
  id: string;
  category: string;
  theme: string;
  message: string;
  html?: string | null;
  status: string;
};

export default function CardsPage() {
  const [category, setCategory] = useState("GOOD_MORNING");
  const [theme, setTheme] = useState("sunrise");
  const [message, setMessage] = useState("");
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/cards");
    const json = await res.json();
    setCards(json.data ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function generate() {
    setLoading(true);
    const res = await fetch("/api/cards", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ category, theme, message }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) return toast.error(json.error ?? "Could not create card");
    toast.success("Card ready to preview.");
    setMessage(json.data.message);
    load();
  }

  const selected = CARD_THEMES.find((t) => t.id === theme);

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-display text-4xl text-navy">Card studio</h1>
      <p className="mt-2 text-muted">Visual background plus real typography — not blurry AI text baked into an image.</p>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {CARD_CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCategory(c)} className={`rounded-full px-3 py-1 text-xs ${category === c ? "bg-navy text-cream" : "bg-paper"}`}>
                {c.replaceAll("_", " ")}
              </button>
            ))}
          </div>
          <div>
            <Label>Theme</Label>
            <select className="h-12 w-full rounded-2xl border border-line bg-white px-4" value={theme} onChange={(e) => setTheme(e.target.value)}>
              {CARD_THEMES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Message</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Leave blank to let US360 draft a short line." />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={generate} disabled={loading}>
              {loading ? "Creating…" : message ? "Save / render" : "Generate"}
            </Button>
            <Button variant="outline" onClick={() => setMessage("")}>
              Edit text
            </Button>
          </div>
        </div>
        <div
          className="flex min-h-[420px] items-center justify-center rounded-[2rem] p-10 text-center shadow-soft"
          style={{ background: selected?.background, color: selected?.text }}
        >
          <div>
            <p className="text-xs uppercase tracking-[0.28em] opacity-80">{selected?.label}</p>
            <p className="mt-6 font-display text-4xl leading-snug">{message || "Your words will appear here."}</p>
          </div>
        </div>
      </div>
      <h2 className="mt-10 font-display text-2xl">Saved cards</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {cards.map((c) => (
          <Card key={c.id}>
            <p className="font-display text-2xl">{c.message}</p>
            <p className="mt-2 text-xs text-muted">
              {c.category} · {c.theme} · {c.status}
            </p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => toast.message("Open & Share", { description: "Download or share from your device. Nothing is sent automatically." })}>
                Share
              </Button>
              <Button size="sm" variant="outline" onClick={() => window.print()}>
                Download
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
