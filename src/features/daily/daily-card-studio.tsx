"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DownloadableCard } from "@/components/downloadable-card";

const MORNING_CHIPS = [
  { label: "Warm", occasion: "warm and gentle" },
  { label: "Short", occasion: "very short" },
  { label: "Playful", occasion: "playful" },
  { label: "Mention chai", occasion: "mention chai" },
];

const NIGHT_CHIPS = [
  { label: "Soft", occasion: "soft and calm" },
  { label: "Short", occasion: "very short" },
  { label: "Sleep well", occasion: "wish them rest" },
  { label: "Miss you", occasion: "a little miss you" },
];

type SavedCard = {
  id: string;
  category: string;
  theme: string;
  message: string;
};

export function DailyCardStudio({
  category,
  title,
  blurb,
}: {
  category: "GOOD_MORNING" | "GOOD_NIGHT";
  title: string;
  blurb: string;
}) {
  const chips = category === "GOOD_MORNING" ? MORNING_CHIPS : NIGHT_CHIPS;
  const [card, setCard] = useState<SavedCard | null>(null);
  const [partner, setPartner] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    const [cardsRes, profileRes] = await Promise.all([fetch("/api/cards"), fetch("/api/profile")]);
    const cardsJson = await cardsRes.json();
    const profileJson = await profileRes.json();
    const list = (cardsJson.data ?? []) as SavedCard[];
    setCard(list.find((item) => item.category === category) ?? null);
    setPartner(profileJson.data?.partnerName ?? null);
  }

  useEffect(() => {
    void load();
  }, [category]);

  async function generate(occasion?: string) {
    setLoading(true);
    const res = await fetch("/api/cards", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ category, occasion }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) return toast.error(json.error ?? "Could not make that card.");
    toast.success("Card ready.");
    await load();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-4xl text-navy">{title}</h1>
        <p className="mt-2 text-muted">{blurb}</p>
      </div>
      <Card>
        <p className="text-sm text-muted">Tap a tone. Likes and chat stay in the background.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => void generate(chip.occasion)}
              className="rounded-full bg-paper px-3 py-1.5 text-sm hover:bg-white"
            >
              {chip.label}
            </button>
          ))}
        </div>
        <Button className="mt-4" onClick={() => void generate()} disabled={loading}>
          {loading ? "Making it…" : card ? "Make another" : "Make this card"}
        </Button>
      </Card>
      {card ? (
        <DownloadableCard id={card.id} message={card.message} themeId={card.theme} partnerName={partner} />
      ) : (
        <Card>
          <p className="text-sm text-muted">Tap a tone above. One card, nothing else.</p>
        </Card>
      )}
      <p className="text-sm text-muted">
        Need a different card later?{" "}
        <Link className="underline" href="/cards">
          Card studio
        </Link>
      </p>
    </div>
  );
}
