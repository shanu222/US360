"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DownloadableCard } from "@/components/downloadable-card";
import type { CardCategory } from "@prisma/client";

export const DAILY_KINDS = [
  { id: "morning", label: "Good morning", category: "GOOD_MORNING" as CardCategory, occasion: "a warm good morning" },
  { id: "evening", label: "Good evening", category: "CUSTOM" as CardCategory, occasion: "a gentle good evening" },
  { id: "night", label: "Good night", category: "GOOD_NIGHT" as CardCategory, occasion: "a soft good night" },
  { id: "how-is-day", label: "How is your day?", category: "ROMANTIC" as CardCategory, occasion: "asking how their day is going" },
  { id: "thinking", label: "Thinking of you", category: "THINKING_OF_YOU" as CardCategory, occasion: "thinking of you" },
  { id: "appreciation", label: "Daily appreciation", category: "APPRECIATION" as CardCategory, occasion: "daily appreciation" },
  { id: "check-in", label: "Simple check-in", category: "CUSTOM" as CardCategory, occasion: "a short daily check-in" },
] as const;

type SavedCard = {
  id: string;
  category: string;
  theme: string;
  message: string;
};

export function DailyCardStudio({
  initialKind = "morning",
}: {
  initialKind?: string;
}) {
  const start = DAILY_KINDS.find((k) => k.id === initialKind) ?? DAILY_KINDS[0];
  const [kindId, setKindId] = useState(start.id);
  const kind = useMemo(() => DAILY_KINDS.find((k) => k.id === kindId) ?? DAILY_KINDS[0], [kindId]);
  const [card, setCard] = useState<SavedCard | null>(null);
  const [partner, setPartner] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    const [cardsRes, profileRes] = await Promise.all([fetch("/api/cards"), fetch("/api/profile")]);
    const cardsJson = await cardsRes.json();
    const profileJson = await profileRes.json();
    const list = (cardsJson.data ?? []) as SavedCard[];
    setCard(list.find((item) => item.category === kind.category) ?? null);
    setPartner(profileJson.data?.partnerName ?? null);
  }

  useEffect(() => {
    void load();
  }, [kind.category]);

  async function generate() {
    setLoading(true);
    const res = await fetch("/api/cards", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ category: kind.category, occasion: kind.occasion }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) return toast.error(json.error ?? "Could not make that.");
    toast.success("Ready.");
    await load();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-4xl text-navy">Daily Love</h1>
        <p className="mt-2 text-muted">Daily messages and cards only. Pick one, then send it yourself.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {DAILY_KINDS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setKindId(item.id)}
            className={`rounded-full px-3 py-1.5 text-sm ${kindId === item.id ? "bg-navy text-cream" : "bg-paper"}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <Card>
        <p className="font-medium">{kind.label}</p>
        <p className="mt-2 text-sm text-muted">Likes and chat stay in the background. This page does not open the Assistant or Restaurants.</p>
        <Button className="mt-4" onClick={() => void generate()} disabled={loading}>
          {loading ? "Making it…" : card ? "Make another" : "Make this"}
        </Button>
      </Card>
      {card ? (
        <DownloadableCard id={card.id} message={card.message} themeId={card.theme} partnerName={partner} />
      ) : (
        <Card>
          <p className="text-sm text-muted">Nothing prepared yet. Tap Make this.</p>
        </Card>
      )}
    </div>
  );
}
