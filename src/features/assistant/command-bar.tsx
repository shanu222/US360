"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoveCard } from "@/components/love-card";

type Result = {
  id?: string | null;
  situationDetected: string;
  recommendedAction: string;
  approach: string;
  avoid: string[];
  message: string | null;
  reel: { id: string; url: string; category: string; reason: string } | null;
  card: { id: string; theme: string; message: string; category: string } | null;
  timing: string;
  plan: {
    date: { title: string; when: string; type: string };
    gift: string;
    message: string;
    cardCategory: string;
    reelCategory: string;
    reminders: string[];
    activity: string;
  } | null;
  pendingEvent: { title: string; type: string; startAt: string; notes: string } | null;
  historyNotes: string[];
  nothingNeeded: boolean;
  emotion: string;
  situation: string;
  relationshipState: string;
  priority: string;
};

const EXAMPLES = [
  "She is angry because I forgot to call her.",
  "She has an exam tomorrow. Make something nice for her.",
  "She is sad. Suggest something I can send her.",
  "Find a funny Reel according to this situation.",
  "She needs space. Don't remind me for 3 hours.",
  "Prepare everything for her birthday.",
  "Look at our previous arguments and tell me what usually works.",
];

export function CommandBar({ compact }: { compact?: boolean }) {
  const [command, setCommand] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function submit(text = command) {
    if (!text.trim()) return;
    setLoading(true);
    const res = await fetch("/api/command", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ command: text }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) return toast.error(json.error ?? "Could not read that command.");
    setResult(json.data);
    setCommand(text);
  }

  async function feedback(outcome: string) {
    if (!result?.id) return toast.message("Marked locally.");
    await fetch("/api/command/feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ commandRunId: result.id, outcome }),
    });
    toast.success("Saved. That will weight similar moments later.");
  }

  async function saveEvent() {
    if (!result?.pendingEvent) return;
    const res = await fetch("/api/command/event", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(result.pendingEvent),
    });
    if (!res.ok) return toast.error("Could not save the date.");
    toast.success("On the calendar with reminders.");
  }

  async function saveSituation() {
    if (!result) return;
    await fetch("/api/command/situation", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        command,
        summary: result.situationDetected,
        approach: result.approach,
        avoid: result.avoid,
        message: result.message,
        recommendation: result.recommendedAction,
      }),
    });
    toast.success("Situation saved.");
  }

  async function copyMessage() {
    if (!result?.message) return;
    await navigator.clipboard.writeText(result.message);
    toast.success("Copied. Paste it where you send from.");
  }

  return (
    <div className="space-y-4">
      <Card className="bg-[linear-gradient(135deg,#fffdfb,#f6ece8)]">
        <p className="text-xs uppercase tracking-[0.28em] text-rose">Rule-based assistant</p>
        <CardTitle className="mt-2">{compact ? "Tell US360" : "Tell US360 what you need…"}</CardTitle>
        <CardDescription className="mt-2">
          No AI decides this. The engine reads your words, profile, imported chat, and what previously helped.
        </CardDescription>
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <Textarea
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="She is angry because I forgot to call her."
            className="min-h-[96px]"
          />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Reading…" : "Run command"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/profile">Relationship profile</Link>
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/timeline">Timeline</Link>
            </Button>
          </div>
        </form>
        {!compact ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => void submit(ex)}
                className="rounded-full bg-paper px-3 py-1 text-left text-xs text-ink hover:bg-white"
              >
                {ex}
              </button>
            ))}
          </div>
        ) : null}
      </Card>

      {result ? (
        <div className="space-y-4">
          <Card>
            <div className="flex flex-wrap gap-2">
              <Badge tone="rose">{result.emotion.replaceAll("_", " ")}</Badge>
              <Badge>{result.situation.replaceAll("_", " ")}</Badge>
              <Badge tone="navy">{result.priority}</Badge>
              <Badge tone="success">{result.relationshipState}</Badge>
            </div>
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-rose">Situation detected</p>
            <CardTitle className="mt-2">{result.situationDetected}</CardTitle>
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-rose">Recommended action</p>
            <p className="mt-2 font-medium">{result.recommendedAction}</p>
            <p className="mt-3 text-sm leading-6 text-muted">{result.approach}</p>
            {result.nothingNeeded ? (
              <p className="mt-4 rounded-2xl bg-paper px-4 py-3 text-sm">Nothing needed right now. Restraint is the move.</p>
            ) : null}
          </Card>

          {result.historyNotes.length ? (
            <Card>
              <p className="text-xs uppercase tracking-[0.2em] text-rose">From previous records</p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
                {result.historyNotes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </Card>
          ) : null}

          <Card>
            <p className="text-xs uppercase tracking-[0.2em] text-rose">Avoid</p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
              {result.avoid.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </Card>

          {result.message ? (
            <Card>
              <p className="text-xs uppercase tracking-[0.2em] text-rose">Suggested message</p>
              <p className="mt-3 font-display text-2xl leading-snug">{result.message}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" onClick={copyMessage}>
                  Copy message
                </Button>
                <Button size="sm" variant="outline" onClick={() => void submit("Make it shorter.")}>
                  Make it simple
                </Button>
                <Button size="sm" variant="outline" onClick={() => void submit("Make it more romantic.")}>
                  Make it more romantic
                </Button>
              </div>
            </Card>
          ) : null}

          <Card>
            <p className="text-xs uppercase tracking-[0.2em] text-rose">Recommended Reel</p>
            {result.reel ? (
              <>
                <p className="mt-2 text-sm">
                  Category: {result.reel.category}. {result.reel.reason}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" asChild>
                    <a href={result.reel.url} target="_blank" rel="noreferrer">
                      Open Instagram & Share
                    </a>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/reels">Choose another</Link>
                  </Button>
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted">No Reel recommended right now.</p>
            )}
          </Card>

          {result.card ? (
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-rose">Card ready</p>
              <LoveCard message={result.card.message} themeId={result.card.theme} kicker={result.card.category.replaceAll("_", " ")} />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" asChild>
                  <Link href="/cards">Edit in studio</Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/daily-love">Schedule</Link>
                </Button>
              </div>
            </div>
          ) : (
            <Card>
              <p className="text-xs uppercase tracking-[0.2em] text-rose">Optional card</p>
              <p className="mt-2 text-sm text-muted">Ask “Create a card for her” if you want one prepared.</p>
              <Button className="mt-3" size="sm" variant="outline" onClick={() => void submit(`${command} Create a card for her.`)}>
                Create card
              </Button>
            </Card>
          )}

          <Card>
            <p className="text-xs uppercase tracking-[0.2em] text-rose">Recommended timing</p>
            <p className="mt-2 text-sm leading-6">{result.timing}</p>
          </Card>

          {result.pendingEvent ? (
            <Card>
              <p className="text-xs uppercase tracking-[0.2em] text-rose">Save this date?</p>
              <p className="mt-2 font-medium">
                {result.pendingEvent.title} · {new Date(result.pendingEvent.startAt).toLocaleString()}
              </p>
              <Button className="mt-3" size="sm" onClick={saveEvent}>
                Save to calendar
              </Button>
            </Card>
          ) : null}

          {result.plan ? (
            <Card>
              <p className="text-xs uppercase tracking-[0.2em] text-rose">Prepare everything</p>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
                <li>
                  Date: {result.plan.date.title} ({result.plan.date.type})
                </li>
                <li>{result.plan.gift}</li>
                <li>Message: {result.plan.message}</li>
                <li>Card: {result.plan.cardCategory.replaceAll("_", " ")}</li>
                <li>Reel: {result.plan.reelCategory}</li>
                <li>Reminders: {result.plan.reminders.join(" · ")}</li>
                <li>{result.plan.activity}</li>
              </ol>
            </Card>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={saveSituation}>
              Save situation
            </Button>
            <Button variant="outline" size="sm" onClick={() => void feedback("HELPFUL")}>
              Helpful
            </Button>
            <Button variant="outline" size="sm" onClick={() => void feedback("NOT_HELPFUL")}>
              Not helpful
            </Button>
            <Button variant="outline" size="sm" onClick={() => void feedback("SENT")}>
              I sent it
            </Button>
            <Button variant="outline" size="sm" onClick={() => void feedback("POSITIVE_RESPONSE")}>
              She responded well
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
