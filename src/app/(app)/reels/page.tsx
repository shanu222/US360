"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { usePartnerVoice } from "@/lib/use-partner-voice";

type Suggested = { id: string; title: string; query: string; url: string };

export default function ReelsPage() {
  const voice = usePartnerVoice();
  const chips = [
    `${voice.They} is angry`,
    `${voice.They} is sad`,
    `${voice.They} is stressed`,
    "Make them smile",
    "Something cute",
  ];
  const [moment, setMoment] = useState("");
  const [loading, setLoading] = useState(false);
  const [reels, setReels] = useState<Suggested[]>([]);

  async function find(text = moment) {
    const next = text.trim();
    if (!next) return;
    setLoading(true);
    const res = await fetch("/api/reels/find", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ moment: next }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) return toast.error(json.error ?? "Could not find Reels.");
    setMoment(next);
    setReels(json.data?.reels ?? []);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-4xl text-navy">Find a Reel</h1>
        <p className="mt-2 text-muted">Describe the moment. You get five Reels. Tap one to open it in Instagram.</p>
      </div>

      <Card>
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => void find(chip)}
              className="rounded-full bg-paper px-3 py-1.5 text-sm hover:bg-white"
            >
              {chip}
            </button>
          ))}
        </div>
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void find();
          }}
        >
          <Textarea
            value={moment}
            onChange={(e) => setMoment(e.target.value)}
            placeholder={`${voice.They} is angry.`}
            className="min-h-[88px]"
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Finding…" : "Find 5 Reels"}
          </Button>
        </form>
      </Card>

      {reels.length ? (
        <div className="space-y-3">
          {reels.map((reel, index) => (
            <a
              key={reel.id}
              href={reel.url}
              target="_blank"
              rel="noreferrer"
              className="card-premium flex items-center justify-between gap-3 p-4 hover:shadow-soft"
            >
              <div>
                <p className="text-xs text-muted">Reel {index + 1}</p>
                <p className="mt-1 font-medium capitalize">{reel.title}</p>
              </div>
              <span className="text-sm text-navy">Open in Instagram</span>
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}
