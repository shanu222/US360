"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea, Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { copyToClipboard } from "@/lib/utils";

type Analysis = {
  recommendation: string;
  confidence: string;
  summary: string;
  reasoning_summary: string;
  avoid: string[];
  next_step: string;
  suggested_message?: string;
  gesture?: string;
  needs_space: boolean;
  remember?: { title: string; content: string; category?: string }[];
};

export function AssistantStudio({
  mode,
  heading,
  placeholder,
}: {
  mode: "situation" | "apologize" | "fight";
  heading: string;
  placeholder: string;
}) {
  const [description, setDescription] = useState("");
  const [feel, setFeel] = useState("");
  const [want, setWant] = useState(mode === "fight" ? "Not sure" : "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [message, setMessage] = useState("");

  async function analyze() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/situation", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          description,
          howUserFeels: feel,
          whatUserWants: want,
          afterArgument: mode === "fight",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "AI is temporarily unavailable.");
      setAnalysis(json.data.analysis);
      setMessage(json.data.analysis.suggested_message ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  }

  async function saveMemory(item: { title: string; content: string; category?: string }) {
    await fetch("/api/memories", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(item),
    });
    toast.success("Saved to memory.");
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-rose">Private assistant</p>
        <h1 className="mt-2 font-display text-4xl text-navy md:text-5xl">{heading}</h1>
        <p className="mt-3 max-w-xl text-muted">
          Describe what happened. US360 will offer a possible next step — not a verdict.
        </p>
        <div className="mt-6 space-y-4">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={placeholder} />
          <div>
            <Label>How do you feel?</Label>
            <Input value={feel} onChange={(e) => setFeel(e.target.value)} placeholder="Hurt, confused, sorry, unsure…" />
          </div>
          {mode === "fight" ? (
            <div className="flex flex-wrap gap-2">
              {["Fix it", "Talk", "Give space", "Understand", "Apologize", "Not sure"].map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setWant(w)}
                  className={`rounded-full px-4 py-2 text-sm ${want === w ? "bg-navy text-cream" : "bg-paper"}`}
                >
                  {w}
                </button>
              ))}
            </div>
          ) : (
            <div>
              <Label>What do you want?</Label>
              <Input value={want} onChange={(e) => setWant(e.target.value)} />
            </div>
          )}
          <Button onClick={analyze} disabled={loading || !description.trim()}>
            {loading ? "Listening…" : "Help me see this clearly"}
          </Button>
          {error ? (
            <Card className="border-danger/30">
              <p className="font-medium">AI is temporarily unavailable.</p>
              <p className="mt-1 text-sm text-muted">{error}</p>
              <div className="mt-4 flex gap-2">
                <Button size="sm" onClick={analyze}>
                  Retry
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <a href="/assistant/message-studio">Write manually</a>
                </Button>
              </div>
            </Card>
          ) : null}
        </div>
      </div>

      <div>
        {!analysis ? (
          <Card className="min-h-72">
            <p className="text-sm text-muted">Your recommendation will appear here. Assumptions will be labeled as such.</p>
          </Card>
        ) : (
          <Card>
            <Badge tone="navy">{analysis.recommendation.replaceAll("_", " ")}</Badge>
            <p className="mt-2 text-xs uppercase tracking-wide text-muted">Confidence: {analysis.confidence}</p>
            <h2 className="mt-4 font-display text-2xl">Based on what you described</h2>
            <p className="mt-2 text-sm leading-6">{analysis.summary}</p>
            <p className="mt-3 text-sm text-muted">{analysis.reasoning_summary}</p>
            <h3 className="mt-5 text-sm font-medium">What to avoid</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
              {analysis.avoid.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
            <h3 className="mt-5 text-sm font-medium">Suggested next step</h3>
            <p className="mt-2 text-sm">{analysis.next_step}</p>
            {analysis.gesture ? <p className="mt-3 text-sm text-muted">{analysis.gesture}</p> : null}
            {message ? (
              <div className="mt-5 rounded-2xl bg-paper p-4">
                <p className="text-xs uppercase tracking-wide text-muted">Optional message</p>
                <Textarea className="mt-2 bg-white" value={message} onChange={(e) => setMessage(e.target.value)} />
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(message).then(() => toast.success("Copied"))}>
                    Copy
                  </Button>
                  <Button size="sm" variant="outline" onClick={analyze}>
                    Regenerate
                  </Button>
                  <Button
                    size="sm"
                    onClick={async () => {
                      await fetch("/api/messages", {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({ content: message, category: "APOLOGY", approved: true }),
                      });
                      toast.success("Saved. Nothing was sent.");
                    }}
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : null}
            {analysis.remember?.length ? (
              <div className="mt-5 rounded-2xl border border-line p-4">
                <p className="text-sm font-medium">Would you like me to remember this?</p>
                {analysis.remember.map((m) => (
                  <div key={m.title} className="mt-3 flex items-center justify-between gap-3 text-sm">
                    <span>{m.title}</span>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveMemory(m)}>
                        Save
                      </Button>
                      <Button size="sm" variant="ghost">
                        Don’t save
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </Card>
        )}
      </div>
    </div>
  );
}
