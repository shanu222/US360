"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoveCard } from "@/components/love-card";
import { copyCardImageToClipboard } from "@/lib/card-download";
import { composeWhatsAppText, whatsappClickUrl } from "@/lib/whatsapp-open";
import { commandExamples, voiceFor, type PartnerVoice } from "@/lib/voice";

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
  lifestyle?: {
    city: string | null;
    weather: { summary: string; tempC: number | null; source: string } | null;
    summary: string;
    restaurants: Array<{
      key: string;
      name: string;
      city: string;
      area?: string;
      priceRange?: string;
      mapsUrl: string;
      website?: string;
      freshness: string;
      lastVerifiedAt?: string | null;
      hoursLabel?: string;
      openNow?: boolean | null;
      reasons: string[];
    }>;
    places: Array<{ key: string; name: string; mapsUrl: string; reasons: string[]; freshness: string }>;
    order: { main: string; side: string; drink: string; dessert: string; why: string } | null;
    dateNight: { vibe: string; dinner: { name: string } | null; activity: { name: string } | null; timing: string; message: string } | null;
    dayPlan: Array<{ when: string; title: string; detail: string }> | null;
  } | null;
};

const CHANNELS = ["instagram", "facebook", "whatsapp", "email"] as const;

export function CommandBar({ compact }: { compact?: boolean }) {
  const [command, setCommand] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [channels, setChannels] = useState<string[]>(["email", "whatsapp"]);
  const [accounts, setAccounts] = useState<Record<string, { connected: boolean; canAutoSend: boolean; fallback: string; handle?: string | null }>>({});
  const [voice, setVoice] = useState<PartnerVoice>(voiceFor("female"));
  const examples = commandExamples(voice.gender);

  useEffect(() => {
    fetch("/api/integrations/status")
      .then((r) => r.json())
      .then((j) => setAccounts(j.data ?? {}))
      .catch(() => {});
    fetch("/api/profile")
      .then((r) => r.json())
      .then((j) => setVoice(voiceFor(j.data?.partnerGender)))
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
    if (sendNow && picked.includes("card")) {
      const node = document.getElementById("command-card-art");
      if (node instanceof HTMLElement) {
        try {
          await copyCardImageToClipboard(node);
          toast.message("Card image copied. Paste it into the WhatsApp chat.");
        } catch {
          /* text + links still open in WhatsApp */
        }
      }
    }
    const sendChannels = sendNow ? Array.from(new Set([...channels, "whatsapp"])) : channels;
    const res = await fetch("/api/command/apply", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        actionIds: picked,
        channels: sendChannels,
        sendNow,
        message: result.message,
        pendingEvent: result.pendingEvent,
        reminderPlan: result.reminderPlan,
        card: result.card,
        reelUrl: result.reel?.url,
        imageUrls: [result.reel?.url].filter(Boolean),
        share: result.share,
        venue: result.lifestyle?.restaurants[0]
          ? { key: result.lifestyle.restaurants[0].key, name: result.lifestyle.restaurants[0].name, city: result.lifestyle.restaurants[0].city, kind: "restaurant" }
          : result.lifestyle?.places[0]
            ? { key: result.lifestyle.places[0].key, name: result.lifestyle.places[0].name, city: result.lifestyle.city ?? "", kind: "place" }
            : null,
      }),
    });
    const json = await res.json();
    if (!res.ok) return toast.error(json.error ?? "Could not apply.");
    const deliveries = (json.data?.deliveries ?? []) as Array<{ channel: string; status: string; sent: boolean; openUrl?: string; reason?: string }>;
    if (!sendNow) {
      toast.success("Prepared. Nothing was sent until you choose Send.");
      return;
    }
    const whatsappUrl =
      (json.data?.whatsappUrl as string | undefined) ||
      deliveries.find((d) => d.channel === "whatsapp")?.openUrl ||
      whatsappClickUrl(
        accounts.whatsapp?.handle ?? "",
        composeWhatsAppText({
          reminder: picked.includes("reminder_her") ? result.reminderPlan?.herMessage : null,
          message: picked.includes("message") ? result.message : null,
          card: picked.includes("card") ? result.card?.message : null,
          reelUrl: picked.includes("reel") ? result.reel?.url : null,
        }),
      );
    if (sendNow && whatsappUrl) {
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    }
    if (!deliveries.length) {
      toast.message("WhatsApp opened with the reminder, Reel, card, and links. You tap send.");
      return;
    }
    for (const d of deliveries) {
      if (d.sent) toast.success(`${d.channel}: sent.`);
      else if (d.channel === "whatsapp") {
        toast.message("WhatsApp opened with the packed message. You tap send — nothing is auto-sent.");
      } else {
        toast.message(`${d.channel}: ${d.reason ?? "Manual action required"}`);
        if (d.openUrl && d.channel !== "whatsapp") window.open(d.openUrl, "_blank", "noopener,noreferrer");
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
          Uses the WhatsApp export, {voice.their} profile, calendar, and what previously helped. A Reel is only suggested when it
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
            placeholder={examples[0]}
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
            {examples.map((ex) => (
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
                  <p className="font-medium">{voice.Them}</p>
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
              <div id="command-card-art">
                <LoveCard message={result.card.message} themeId={result.card.theme} kicker="" />
              </div>
              <Button size="sm" asChild>
                <Link href="/cards">Edit in studio</Link>
              </Button>
            </div>
          ) : null}

          {result.lifestyle ? (
            <Card>
              <p className="text-xs uppercase tracking-[0.2em] text-rose">City · food · places</p>
              <CardTitle className="mt-2">{result.lifestyle.city ? `Tonight in ${result.lifestyle.city}` : "Add your city"}</CardTitle>
              <p className="mt-2 text-sm text-muted">{result.lifestyle.summary}</p>
              {result.lifestyle.weather ? (
                <p className="mt-1 text-xs text-muted">
                  Weather: {result.lifestyle.weather.summary}
                  {result.lifestyle.weather.tempC != null ? ` · ${Math.round(result.lifestyle.weather.tempC)}°C` : ""} ({result.lifestyle.weather.source})
                </p>
              ) : null}

              {result.lifestyle.restaurants.length ? (
                <div className="mt-4 space-y-3">
                  <p className="text-sm font-medium">Dinner suggestions</p>
                  {result.lifestyle.restaurants.slice(0, 3).map((r, i) => (
                    <div key={r.key} className="rounded-2xl bg-paper p-3">
                      <p className="font-medium">
                        {i === 0 ? "🥇 " : i === 1 ? "🥈 " : "🥉 "}
                        {r.name}
                      </p>
                      <p className="text-xs text-muted">
                        {r.area || r.city}
                        {r.priceRange ? ` · ${r.priceRange}` : ""}
                        {r.openNow === true ? " · open at this time" : r.openNow === false ? " · may be closed" : ""}
                        {` · ${r.freshness}`}
                        {r.lastVerifiedAt ? ` · last verified ${new Date(r.lastVerifiedAt).toLocaleString()}` : r.freshness === "catalog" ? " · catalog (not live-verified)" : ""}
                      </p>
                      <ul className="mt-2 list-disc pl-5 text-xs text-muted">
                        {r.reasons.slice(0, 4).map((why) => (
                          <li key={why}>{why}</li>
                        ))}
                      </ul>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <a href={r.mapsUrl} target="_blank" rel="noreferrer">
                            Directions
                          </a>
                        </Button>
                        {r.website ? (
                          <Button size="sm" variant="ghost" asChild>
                            <a href={r.website} target="_blank" rel="noreferrer">
                              Website
                            </a>
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {result.lifestyle.order ? (
                <div className="mt-4 rounded-2xl bg-paper p-3 text-sm">
                  <p className="font-medium">Recommended order</p>
                  <p className="mt-2">Main: {result.lifestyle.order.main}</p>
                  <p>Side: {result.lifestyle.order.side}</p>
                  <p>Drink: {result.lifestyle.order.drink}</p>
                  <p>Dessert: {result.lifestyle.order.dessert}</p>
                  <p className="mt-2 text-xs text-muted">{result.lifestyle.order.why}</p>
                </div>
              ) : null}

              {result.lifestyle.places.length ? (
                <div className="mt-4 space-y-3">
                  <p className="text-sm font-medium">Places</p>
                  {result.lifestyle.places.slice(0, 3).map((p) => (
                    <div key={p.key} className="rounded-2xl bg-paper p-3">
                      <p className="font-medium">{p.name}</p>
                      <ul className="mt-2 list-disc pl-5 text-xs text-muted">
                        {p.reasons.slice(0, 4).map((why) => (
                          <li key={why}>{why}</li>
                        ))}
                      </ul>
                      <Button size="sm" className="mt-2" variant="outline" asChild>
                        <a href={p.mapsUrl} target="_blank" rel="noreferrer">
                          Details / directions
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : null}

              {result.lifestyle.dateNight ? (
                <div className="mt-4 rounded-2xl bg-paper p-3 text-sm">
                  <p className="font-medium">Date night · {result.lifestyle.dateNight.vibe}</p>
                  <p className="mt-2">Dinner: {result.lifestyle.dateNight.dinner?.name ?? "Pick from the list above"}</p>
                  <p>Activity: {result.lifestyle.dateNight.activity?.name ?? "A quiet walk nearby"}</p>
                  <p className="mt-2 text-muted">{result.lifestyle.dateNight.timing}</p>
                  <p className="mt-2 italic">“{result.lifestyle.dateNight.message}”</p>
                </div>
              ) : null}

              {result.lifestyle.dayPlan ? (
                <div className="mt-4 space-y-2 text-sm">
                  <p className="font-medium">Today’s plan</p>
                  {result.lifestyle.dayPlan.map((b) => (
                    <p key={b.when}>
                      <span className="font-medium">{b.when}:</span> {b.title} — {b.detail}
                    </p>
                  ))}
                </div>
              ) : null}

              {!result.lifestyle.city ? (
                <Button className="mt-4" size="sm" asChild>
                  <Link href="/profile">Set city on Profile</Link>
                </Button>
              ) : null}
            </Card>
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
              Send opens WhatsApp with the reminder, Reel link, card words, and image links packed in — you tap send.
              A card image is copied when possible so you can paste it in the chat. Email can go automatically from
              your connected Gmail. Instagram and Facebook stay open-and-send. Nothing is auto-sent on WhatsApp.
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
              {voice.They} responded well
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
