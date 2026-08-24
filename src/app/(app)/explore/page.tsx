"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CommandBar } from "@/features/assistant/command-bar";

type Pending = { kind: string; title: string; quote: string; whenHint?: string };

export default function ExplorePage() {
  const [pending, setPending] = useState<Pending[]>([]);
  const [vibe, setVibe] = useState("");

  async function load() {
    const res = await fetch("/api/lifestyle/pending");
    const json = await res.json();
    setPending(json.data ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function decide(item: Pending, action: "confirm" | "dismiss" | "calendar") {
    const res = await fetch("/api/lifestyle/pending", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: item.title, quote: item.quote, action }),
    });
    if (!res.ok) return toast.error("Could not update that.");
    toast.success(action === "confirm" ? "Saved to memory." : action === "calendar" ? "Added to calendar." : "Ignored.");
    load();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-4xl text-navy">What should we eat / visit?</h1>
        <p className="mt-2 text-muted">
          Uses your city (not a home address), her food likes, chat mentions, calendar, and a mix of catalog + optional
          live search. Nothing is booked automatically.
        </p>
        <p className="mt-2 text-sm">
          Set city and food likes on{" "}
          <Link className="underline" href="/profile">
            Profile
          </Link>
          .
        </p>
      </div>

      <Card>
        <p className="text-xs uppercase tracking-[0.2em] text-rose">Date night mood</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {["casual", "romantic", "budget", "special occasion", "outdoor", "quiet", "luxury", "adventure", "food-focused"].map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setVibe(id)}
              className={`rounded-full px-3 py-1 text-xs ${vibe === id ? "bg-navy text-cream" : "bg-paper"}`}
            >
              {id}
            </button>
          ))}
        </div>
        {vibe ? (
          <p className="mt-3 text-sm text-muted">
            Type a command below, for example: “Plan a {vibe} date for us tonight.”
          </p>
        ) : null}
      </Card>

      {pending.length ? (
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-rose">From the WhatsApp export</p>
          <p className="mt-2 text-sm text-muted">Food and place mentions. Confirm before they stay in memory or on the calendar.</p>
          <div className="mt-4 space-y-3">
            {pending.map((item) => (
              <div key={`${item.title}-${item.quote}`} className="rounded-2xl bg-paper p-3">
                <p className="font-medium">
                  {item.kind}: {item.title}
                </p>
                <p className="mt-1 text-sm italic">“{item.quote}”</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => void decide(item, "confirm")}>
                    Save
                  </Button>
                  {item.kind === "plan" ? (
                    <Button size="sm" variant="outline" onClick={() => void decide(item, "calendar")}>
                      Add to calendar
                    </Button>
                  ) : null}
                  <Button size="sm" variant="ghost" onClick={() => void decide(item, "dismiss")}>
                    Ignore
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <CommandBar />
    </div>
  );
}
