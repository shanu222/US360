"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePartnerVoice } from "@/lib/use-partner-voice";

type Idea = { title: string; why: string; budget: string; preparation: string; message?: string; effort: string };

export default function IdeasPage() {
  const voice = usePartnerVoice();
  const [occasion, setOccasion] = useState("Just because");
  const [budget, setBudget] = useState("prefer free or low");
  const [timeAvailable, setTimeAvailable] = useState("this evening");
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(false);

  async function run(path: string, body: object) {
    setLoading(true);
    const res = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) return toast.error(json.error ?? "AI is temporarily unavailable.");
    setIdeas(json.data.ideas ?? []);
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-4xl text-navy">Ideas</h1>
      <p className="mt-2 text-muted">Make {voice.them} smile without making expensive spending the default.</p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button onClick={() => run("/api/ai/smile", { budget, time: timeAvailable })} disabled={loading}>
          Make {voice.them} smile
        </Button>
        <Button variant="outline" onClick={() => run("/api/ai/gifts", { occasion, budget, timeAvailable })} disabled={loading}>
          Gift ideas
        </Button>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div>
          <Label>Occasion</Label>
          <Input value={occasion} onChange={(e) => setOccasion(e.target.value)} />
        </div>
        <div>
          <Label>Budget</Label>
          <Input value={budget} onChange={(e) => setBudget(e.target.value)} />
        </div>
        <div>
          <Label>Time available</Label>
          <Input value={timeAvailable} onChange={(e) => setTimeAvailable(e.target.value)} />
        </div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {ideas.map((idea) => (
          <Card key={idea.title}>
            <Badge tone={idea.effort === "free" ? "success" : idea.effort === "low" ? "rose" : "warning"}>{idea.effort}</Badge>
            <h2 className="mt-3 font-display text-2xl">{idea.title}</h2>
            <p className="mt-2 text-sm text-muted">{idea.why}</p>
            <p className="mt-3 text-sm">Budget: {idea.budget}</p>
            <p className="text-sm">Preparation: {idea.preparation}</p>
            {idea.message ? <p className="mt-3 rounded-2xl bg-paper p-3 text-sm">{idea.message}</p> : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
