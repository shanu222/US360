"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { LoveCard } from "@/components/love-card";
import { voiceFor, type PartnerVoice } from "@/lib/voice";
import { examplesForFocus, expandCommand, focusCopy, type CommandFocus } from "@/lib/command-focus";
import { LifestyleResult, type LifestyleSlice } from "@/features/assistant/lifestyle-result";

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
  lifestyle?: LifestyleSlice | null;
};

export function CommandBar({
  focus = "moment",
}: {
  compact?: boolean;
  focus?: CommandFocus;
}) {
  const [command, setCommand] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [voice, setVoice] = useState<PartnerVoice>(voiceFor("female"));
  const examples = useMemo(() => examplesForFocus(focus, voice.gender), [focus, voice.gender]);
  const copy = focusCopy(focus);
  const hasLifestyle = Boolean(
    result?.lifestyle &&
      (result.lifestyle.restaurants.length || result.lifestyle.places.length || result.lifestyle.dateNight || result.lifestyle.dayPlan),
  );
  const showFood = Boolean(result && (focus === "food" || (focus === "moment" && hasLifestyle && result.lifestyle?.restaurants.length)));
  const showPlaces = Boolean(result && (focus === "places" || (focus === "moment" && hasLifestyle && !result.lifestyle?.restaurants.length && result.lifestyle?.places.length)));
  const showMoment = Boolean(result && focus === "moment" && !showFood && !showPlaces);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((j) => setVoice(voiceFor(j.data?.partnerGender)))
      .catch(() => {});
  }, []);

  async function submit(text = command) {
    const next = expandCommand(text, focus);
    if (!next.trim()) return;
    setLoading(true);
    const res = await fetch("/api/command", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ command: next }),
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

  async function copyMessage() {
    if (!result?.message) return;
    await navigator.clipboard.writeText(result.message);
    toast.success("Copied. Paste it where you send from.");
  }

  return (
    <div className="space-y-4">
      <Card className="bg-[linear-gradient(135deg,#fffdfb,#f6ece8)]">
        <p className="text-xs uppercase tracking-[0.28em] text-rose">{copy.kicker}</p>
        <CardTitle className="mt-2">{copy.title}</CardTitle>
        <CardDescription className="mt-2">{copy.description}</CardDescription>
        <div className="mt-4 flex flex-wrap gap-2">
          {examples.map((ex) => (
            <button
              key={ex.command}
              type="button"
              onClick={() => void submit(ex.command)}
              className="rounded-full bg-paper px-3 py-1.5 text-left text-sm text-ink hover:bg-white"
            >
              {ex.label}
            </button>
          ))}
        </div>
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
            placeholder={copy.placeholder}
            className="min-h-[72px]"
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Looking…" : copy.submit}
          </Button>
        </form>
      </Card>

      {result ? (
        <div className="space-y-4">
          {showFood && result.lifestyle ? <LifestyleResult lifestyle={result.lifestyle} show="food" /> : null}
          {showPlaces && result.lifestyle ? <LifestyleResult lifestyle={result.lifestyle} show="places" /> : null}

          {focus === "moment" && hasLifestyle && !showFood && !showPlaces ? (
            <Card>
              <p className="text-sm">This looks like food or a place to go.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" asChild>
                  <Link href="/food">Food</Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/explore">Explore</Link>
                </Button>
              </div>
            </Card>
          ) : null}

          {showMoment ? (
            <Card>
              <p className="text-xs uppercase tracking-[0.2em] text-rose">Next step</p>
              <CardTitle className="mt-2">{result.situationDetected}</CardTitle>
              <p className="mt-3 font-medium">{result.recommendedAction}</p>
              <p className="mt-3 text-sm leading-6 text-muted">{result.approach}</p>
              {result.nothingNeeded ? (
                <p className="mt-4 rounded-2xl bg-paper px-4 py-3 text-sm">Nothing needed right now. Give it a little space.</p>
              ) : null}
              {result.avoid.slice(0, 2).length ? (
                <p className="mt-4 text-sm text-muted">Avoid: {result.avoid.slice(0, 2).join(" · ")}</p>
              ) : null}
            </Card>
          ) : null}

          {showMoment && result.reminderPlan ? (
            <Card>
              <p className="text-xs uppercase tracking-[0.2em] text-rose">{result.reminderPlan.eventTitle}</p>
              <p className="mt-2 text-sm">{new Date(result.reminderPlan.startAt).toLocaleString()}</p>
              <p className="mt-3 text-sm">{result.reminderPlan.userMessage}</p>
            </Card>
          ) : null}

          {result.message && (showMoment || picked.includes("message")) ? (
            <Card>
              <p className="text-xs uppercase tracking-[0.2em] text-rose">Suggested message</p>
              <p className="mt-3 font-display text-2xl leading-snug">{result.message}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" onClick={copyMessage}>
                  Copy
                </Button>
              </div>
            </Card>
          ) : null}

          {showMoment ? (
            <p className="text-sm text-muted">
              Need a Reel for this?{" "}
              <Link className="underline" href="/reels">
                Find 5 Reels
              </Link>
            </p>
          ) : null}

          {showMoment && result.card && picked.includes("card") ? (
            <div className="space-y-3">
              <div id="command-card-art">
                <LoveCard message={result.card.message} themeId={result.card.theme} kicker="" />
              </div>
              <Button size="sm" asChild>
                <Link href="/cards">Edit in studio</Link>
              </Button>
            </div>
          ) : null}

          {result ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => void feedback("HELPFUL")}>
                Helpful
              </Button>
              <Button variant="outline" size="sm" onClick={() => void feedback("NOT_HELPFUL")}>
                Not helpful
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setResult(null)}>
                Start over
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
