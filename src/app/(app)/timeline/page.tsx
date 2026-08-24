"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";

type Item = { at: string | null; event: string; situation: string; outcome?: string; source: string };

export default function TimelinePage() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    fetch("/api/timeline")
      .then((r) => r.json())
      .then((j) => setItems(j.data ?? []));
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="font-display text-4xl text-navy">Relationship timeline</h1>
        <p className="mt-2 text-muted">
          Built from WhatsApp import, situations, calendar, cards, and commands — not an AI recap.
        </p>
      </div>
      {items.length === 0 ? (
        <EmptyState title="No timeline yet" description="Import a WhatsApp ZIP, save a situation, or run a command." />
      ) : (
        items.map((item, i) => (
          <Card key={`${item.at}-${i}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-muted">{item.at ? new Date(item.at).toLocaleString() : "Undated"}</p>
                <p className="mt-1 font-medium">{item.event}</p>
                {item.outcome ? <p className="mt-1 text-sm text-muted">{item.outcome}</p> : null}
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge>{item.situation.toLowerCase()}</Badge>
                <Badge tone="rose">{item.source}</Badge>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
