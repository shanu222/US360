"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoveCard } from "@/components/love-card";

type Action = {
  id: string;
  kind: string;
  title: string;
  detail: string;
  required: boolean;
  selected: boolean;
};

type Result = {
  id?: string | null;
  situationDetected: string;
  recommendedAction: string;
  approach: string;
  avoid: string[];
  message: string | null;
  reel: {
    id: string;
    url: string;
    category: string;
    reason: string;
    query?: string;
    searchUrl?: string;
    caption?: string;
    fromLibrary?: boolean;
  } | null;
  share: {
    caption: string;
    whatsapp: string;
    instagram: string;
    instagramProfile: string | null;
    instagramDm: string | null;
    facebook: string;
    email?: string | null;
    missingWhatsapp: boolean;
    missingInstagram: boolean;
    missingEmail?: boolean;
  } | null;
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
  reminderPlan: {
    eventTitle: string;
    eventType: string;
    startAt: string;
    forName: string;
    userReminderAt: string;
    herReminderAt: string;
    userMessage: string;
    herMessage: string;
  } | null;
  actions: Action[];
  historyNotes: string[];
  nothingNeeded: boolean;
  emotion: string;
  situation: string;
  relationshipState: string;
  priority: string;
};

const EXAMPLES = [
  "She is angry.",
  "She is angry because I forgot to call her.",
  "She is sad today.",
  "She has an exam tomorrow.",
  "She is stressed.",
  "What should I do?",
  "Find a Reel for this situation.",
  "Find something nice to send her.",
  "She did really well in her exam.",
  "I want to make her smile.",
];

const CHANNELS = ["instagram", "facebook", "whatsapp", "email"] as const;

export function CommandBar({ compact }: { compact?: boolean }) {
  const [command, setCommand] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [channels, setChannels] = useState<string[]>(["whatsapp"]);
  const [accounts, setAccounts] = useState<Record<string, { connected: boolean; canAutoSend: boolean; fallback: string }>>({});

  useEffect(() => {
    fetch("/api/integrations/status")
      .then((r) => r.json())
      .then((j) => setAccounts(j.data ?? {}))
      .catch(() => {});
  }, []);

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
    const data = json.data as Result;
    setResult(data);
    setPicked((data.actions ?? []).filter((a) => a.selected).map((a) => a.id));
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

  async function apply(sendNow: boolean) {
    if (!result) return;
    const res = await fetch("/api/command/apply", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        actionIds: picked,
        channels,
        sendNow,
        message: result.message,
        pendingEvent: result.pendingEvent,
        reminderPlan: result.reminderPlan,
        card: result.card,
        reelUrl: result.reel?.url,
        share: result.share,
      }),
    });
    const json = await res.json();
    if (!res.ok) return toast.error(json.error ?? "Could not apply.");
    const deliveries = (json.data?.deliveries ?? []) as Array<{ channel: string; status: string; sent: boolean; openUrl?: string; reason?: string }>;
    if (!sendNow) {
      toast.success("Prepared. Nothing was sent until you choose Send.");
      return;
    }
    if (!deliveries.length) {
      toast.message("Saved locally. Choose a platform to send.");
      return;
    }
    for (const d of deliveries) {
      if (d.sent) toast.success(`${d.channel}: sent.`);
      else {
        toast.message(`${d.channel}: ${d.reason ?? "Manual action required"}`);
        if (d.openUrl) window.open(d.openUrl, "_blank", "noopener,noreferrer");
      }
    }
  }

  async function copyMessage() {
    if (!result?.message) return;
    await navigator.clipboard.writeText(result.message);
    toast.success("Copied. Paste it where you send from.");
  }

  function toggleAction(id: string) {
    setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  function toggleChannel(id: string) {
    setChannels((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  return (
    <div className="space-y-4">
      <Card className="bg-[linear-gradient(135deg,#fffdfb,#f6ece8)]">
        <p className="text-xs uppercase tracking-[0.28em] text-rose">Tell US360</p>
        <CardTitle className="mt-2">{compact ? "What is happening?" : "Describe the moment. The rest is prepared for you."}</CardTitle>
        <CardDescription className="mt-2">
          Uses the WhatsApp export, her profile, calendar, and what previously helped. A Reel is only suggested when it
          actually fits — never because a library needs filling.
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
            placeholder="She is angry."
            className="min-h-[96px]"
          />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Reading…" : "What should I do?"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/profile">Relationship profile</Link>
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
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-rose">Recommended</p>
            <p className="mt-2 font-medium">{result.recommendedAction}</p>
            <p className="mt-3 text-sm leading-6 text-muted">{result.approach}</p>
            {result.nothingNeeded ? (
              <p className="mt-4 rounded-2xl bg-paper px-4 py-3 text-sm">Do not send anything right now. Restraint is the move.</p>
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
            <p className="text-xs uppercase tracking-[0.2em] text-rose">Do not send</p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
              {result.avoid.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </Card>

          {result.reminderPlan ? (
            <Card>
              <p className="text-xs uppercase tracking-[0.2em] text-rose">
                {result.reminderPlan.eventType === "EXAM" ? "📚 Exam" : "Upcoming"} — {result.reminderPlan.eventTitle}
              </p>
              <p className="mt-2 text-sm">
                For: {result.reminderPlan.forName} · {new Date(result.reminderPlan.startAt).toLocaleString()}
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 text-sm">
                <div className="rounded-2xl bg-paper p-3">
                  <p className="font-medium">You</p>
                  <p className="text-xs text-muted">{new Date(result.reminderPlan.userReminderAt).toLocaleString()}</p>
                  <p className="mt-2">{result.reminderPlan.userMessage}</p>
                </div>
                <div className="rounded-2xl bg-paper p-3">
                  <p className="font-medium">Her</p>
                  <p className="text-xs text-muted">{new Date(result.reminderPlan.herReminderAt).toLocaleString()}</p>
                  <p className="mt-2">{result.reminderPlan.herMessage}</p>
                </div>
              </div>
            </Card>
          ) : null}

          {(result.actions ?? []).length ? (
            <Card>
              <p className="text-xs uppercase tracking-[0.2em] text-rose">Recommended actions</p>
              <div className="mt-3 space-y-2">
                {result.actions.map((a) => (
                  <label key={a.id} className="flex items-start gap-3 rounded-2xl bg-paper px-3 py-2 text-sm">
                    <input type="checkbox" checked={picked.includes(a.id)} onChange={() => toggleAction(a.id)} />
                    <span>
                      <span className="font-medium">{a.title}</span>
                      <span className="mt-1 block text-xs text-muted">{a.detail}</span>
                    </span>
                  </label>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => setPicked(result.actions.map((a) => a.id))}>
                  Do all
                </Button>
                <Button size="sm" variant="outline" onClick={() => setPicked(result.actions.filter((a) => a.required).map((a) => a.id))}>
                  Select required
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setPicked([])}>
                  Cancel
                </Button>
              </div>
            </Card>
          ) : null}

          {result.message && picked.includes("message") ? (
            <Card>
              <p className="text-xs uppercase tracking-[0.2em] text-rose">Suggested message</p>
              <p className="mt-3 font-display text-2xl leading-snug">{result.message}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" onClick={copyMessage}>
                  Edit / copy
                </Button>
                <Button size="sm" variant="outline" onClick={() => void submit("Make it shorter.")}>
                  Make it simple
                </Button>
              </div>
            </Card>
          ) : null}

          {result.reel && picked.includes("reel") ? (
            <Card>
              <p className="text-xs uppercase tracking-[0.2em] text-rose">Situational Reel</p>
              <p className="mt-2 text-sm leading-6">{result.reel.reason}</p>
              {result.reel.searchUrl ? (
                <Button className="mt-3" size="sm" variant="outline" asChild>
                  <a href={result.reel.searchUrl} target="_blank" rel="noreferrer">
                    Open matching Instagram search
                  </a>
                </Button>
              ) : null}
            </Card>
          ) : result.reel === null ? (
            <Card>
              <p className="text-xs uppercase tracking-[0.2em] text-rose">Reel</p>
              <p className="mt-2 text-sm text-muted">No Reel recommended right now.</p>
            </Card>
          ) : null}

          {result.card && picked.includes("card") ? (
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-rose">Card</p>
              <LoveCard message={result.card.message} themeId={result.card.theme} kicker="" />
              <Button size="sm" asChild>
                <Link href="/cards">Edit in studio</Link>
              </Button>
            </div>
          ) : null}

          <Card>
            <p className="text-xs uppercase tracking-[0.2em] text-rose">Send through</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {CHANNELS.map((id) => {
                const meta = accounts[id];
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleChannel(id)}
                    className={`rounded-full px-3 py-1 text-xs ${channels.includes(id) ? "bg-navy text-cream" : "bg-paper"}`}
                  >
                    {id} {meta?.connected ? "✓" : ""}
                    {meta && !meta.canAutoSend ? " · manual" : ""}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-muted">
              Instagram and Facebook always need a tap in the app. WhatsApp and email send only after the official API
              confirms — never a fake “sent”.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => void apply(false)}>
                Preview & schedule
              </Button>
              <Button size="sm" onClick={() => void apply(true)}>
                Send now
              </Button>
            </div>
          </Card>

          <Card>
            <p className="text-xs uppercase tracking-[0.2em] text-rose">Timing</p>
            <p className="mt-2 text-sm leading-6">{result.timing}</p>
          </Card>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => void feedback("HELPFUL")}>
              Helpful
            </Button>
            <Button variant="outline" size="sm" onClick={() => void feedback("NOT_HELPFUL")}>
              Not helpful
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
