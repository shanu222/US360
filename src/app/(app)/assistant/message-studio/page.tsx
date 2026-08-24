"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MESSAGE_CATEGORIES } from "@/types";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { copyToClipboard } from "@/lib/utils";

export default function MessageStudioPage() {
  const [intent, setIntent] = useState("");
  const [category, setCategory] = useState("ROMANTIC");
  const [tone, setTone] = useState("natural");
  const [length, setLength] = useState("medium");
  const [soundLikeMe, setSoundLikeMe] = useState(false);
  const [samples, setSamples] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function generate() {
    if (soundLikeMe && samples) {
      await fetch("/api/writing-style", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ samples }),
      });
    }
    setLoading(true);
    const res = await fetch("/api/ai/message", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ intent, category, tone, length, soundLikeMe }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(json.error ?? "AI is temporarily unavailable.");
      return;
    }
    setMessages(json.data.messages ?? []);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-4xl text-navy">Message studio</h1>
      <p className="mt-2 text-muted">Suggestions only. You approve anything that leaves this page.</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {MESSAGE_CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full px-3 py-1.5 text-xs ${category === c ? "bg-navy text-cream" : "bg-paper"}`}
          >
            {c.replaceAll("_", " ")}
          </button>
        ))}
      </div>
      <div className="mt-6 space-y-4">
        <div>
          <Label>What do you want to say?</Label>
          <Textarea value={intent} onChange={(e) => setIntent(e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Tone</Label>
            <Input value={tone} onChange={(e) => setTone(e.target.value)} />
          </div>
          <div>
            <Label>Length</Label>
            <Input value={length} onChange={(e) => setLength(e.target.value)} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={soundLikeMe} onChange={(e) => setSoundLikeMe(e.target.checked)} />
          Sound like me
        </label>
        {soundLikeMe ? (
          <Textarea
            placeholder="Paste a few messages you’ve actually sent."
            value={samples}
            onChange={(e) => setSamples(e.target.value)}
          />
        ) : null}
        <Button onClick={generate} disabled={!intent.trim() || loading}>
          {loading ? "Writing…" : "Generate suggestions"}
        </Button>
      </div>
      <div className="mt-6 space-y-3">
        {messages.map((m, i) => (
          <Card key={i}>
            <p className="text-sm leading-6">{m}</p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(m).then(() => toast.success("Copied"))}>
                Copy
              </Button>
              <Button
                size="sm"
                onClick={async () => {
                  await fetch("/api/messages", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ content: m, category, approved: true }),
                  });
                  toast.success("Saved. Ready for you to send yourself.");
                }}
              >
                Save
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
