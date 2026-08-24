"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Review = {
  risk: string;
  labels: string[];
  headline: string;
  explanation: string;
  alternatives: { style: string; text: string }[];
};

export default function BeforeYouSend() {
  const [draft, setDraft] = useState("");
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(false);
  const [chosen, setChosen] = useState<string | null>(null);

  async function analyze() {
    setLoading(true);
    const res = await fetch("/api/ai/tone", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: draft }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(json.error ?? "AI is temporarily unavailable.");
      return;
    }
    setReview(json.data);
    setChosen(null);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-xs uppercase tracking-[0.28em] text-rose">Message review</p>
      <h1 className="mt-2 font-display text-4xl text-navy">Before you send</h1>
      <p className="mt-3 text-muted">You remain in control. This is a pause, not a rewrite mandate.</p>
      <Textarea
        className="mt-6"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder='Fine. Do whatever you want. I don’t care.'
      />
      <Button className="mt-4" onClick={analyze} disabled={!draft.trim() || loading}>
        {loading ? "Reading the tone…" : "Review tone"}
      </Button>

      {review ? (
        <Card className="mt-6">
          <Badge tone={review.risk === "high" ? "warning" : "rose"}>{review.risk} risk</Badge>
          <h2 className="mt-3 font-display text-2xl">{review.headline}</h2>
          <p className="mt-2 text-sm text-muted">{review.explanation}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {review.labels.map((l) => (
              <Badge key={l}>{l}</Badge>
            ))}
          </div>
          <div className="mt-6 space-y-3">
            {review.alternatives.map((alt) => (
              <div key={alt.style} className="rounded-2xl bg-paper p-4">
                <p className="text-xs uppercase tracking-wide text-muted">{alt.style}</p>
                <p className="mt-2 text-sm">{alt.text}</p>
                <Button size="sm" className="mt-3" variant="outline" onClick={() => setChosen(alt.text)}>
                  Use version
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setChosen(draft)}>
              Keep original
            </Button>
            {chosen ? (
              <Button
                onClick={() => {
                  setDraft(chosen);
                  toast.success("Draft updated. Nothing was sent.");
                }}
              >
                Edit / apply
              </Button>
            ) : null}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
