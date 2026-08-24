"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CARD_CATEGORIES } from "@/types";
import { CARD_THEMES } from "@/ai/cards";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/input";
import { LoveCard } from "@/components/love-card";

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
  const [theme, setTheme] = useState("aurora");
  const [message, setMessage] = useState("");
  const [kicker, setKicker] = useState("From your chat");
  const [partner, setPartner] = useState<string | null>(null);
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/cards");
    const json = await res.json();
    setCards(json.data ?? []);
  }

  useEffect(() => {
    load();
    fetch("/api/chat/import")
      .then((r) => r.json())
      .then((j) => setPartner(j.data?.partnerName ?? null))
      .catch(() => {});
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
    toast.success("Card ready.");
    setMessage(json.data.message);
    setKicker("From your chat");
    load();
  }

  async function share(card: SavedCard) {
    const text = card.message;
    if (navigator.share) {
      await navigator.share({ title: "US360 card", text });
      return;
    }
    await navigator.clipboard.writeText(text);
    toast.success("Copied. Paste it anywhere you send from.");
  }

  function download(card: SavedCard) {
    const blob = new Blob([card.html || card.message], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `us360-card-${card.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const selected = useMemo(() => CARD_THEMES.find((t) => t.id === theme), [theme]);

  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-xs uppercase tracking-[0.28em] text-rose">From your WhatsApp</p>
      <h1 className="mt-2 font-display text-4xl text-navy md:text-5xl">Colorful cards</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Lines are drafted from chat likes, routines, and recent tone — then set in a real designed card. You still send it yourself.
      </p>
      <div className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {CARD_CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCategory(c)} className={`rounded-full px-3 py-1 text-xs ${category === c ? "bg-navy text-cream" : "bg-paper"}`}>
                {c.replaceAll("_", " ")}
              </button>
            ))}
          </div>
          <div>
            <Label>Palette</Label>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {CARD_THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`h-12 rounded-2xl border ${theme === t.id ? "border-navy ring-2 ring-navy/30" : "border-line"}`}
                  style={{ background: t.background }}
                  title={t.label}
                />
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">{selected?.label}</p>
          </div>
          <div>
            <Label>Message</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Leave blank — US360 writes from the chat." />
          </div>
          <Button onClick={generate} disabled={loading} className="w-full">
            {loading ? "Painting…" : "Generate from chat"}
          </Button>
        </div>
        <LoveCard message={message} themeId={theme} partnerName={partner} kicker={kicker} />
      </div>
      <h2 className="mt-10 font-display text-2xl">Saved</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {cards.map((c) => (
          <div key={c.id} className="space-y-3">
            <LoveCard message={c.message} themeId={c.theme} partnerName={partner} kicker={c.category.replaceAll("_", " ")} className="min-h-[280px]" />
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => share(c)}>
                Share
              </Button>
              <Button size="sm" variant="outline" onClick={() => download(c)}>
                Download
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
