"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";

const TYPES = ["BIRTHDAY", "ANNIVERSARY", "EVENT", "EXAM", "WORK", "FAMILY", "PERSONAL", "CUSTOM"];

type EventItem = {
  id: string;
  title: string;
  type: string;
  startAt: string;
  notes?: string | null;
};

type Pending = {
  title: string;
  at: string;
  type: string;
  hint: string;
  quote: string;
};

function daysUntil(iso: string) {
  const start = new Date(iso);
  start.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((start.getTime() - now.getTime()) / 86400000);
}

function whenLabel(days: number) {
  if (days <= 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
}

export default function CalendarPage() {
  const [items, setItems] = useState<EventItem[]>([]);
  const [pending, setPending] = useState<Pending[]>([]);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("EVENT");
  const [startAt, setStartAt] = useState("");
  const [notes, setNotes] = useState("");

  async function load() {
    const [cal, pend] = await Promise.all([fetch("/api/calendar"), fetch("/api/calendar/pending")]);
    const json = await cal.json();
    const pjson = await pend.json();
    setItems(json.data ?? []);
    setPending(pjson.data ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/calendar", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, type, startAt, notes, reminderDays: [7, 3, 1, 0] }),
    });
    if (!res.ok) return toast.error("Could not save event");
    setTitle("");
    setNotes("");
    toast.success("Reminders set for 7 days, 3 days, tomorrow, and the day.");
    load();
  }

  async function decide(item: Pending, action: "confirm" | "dismiss") {
    const res = await fetch("/api/calendar/pending", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: item.title, at: item.at, action }),
    });
    if (!res.ok) return toast.error("Could not update that date.");
    toast.success(action === "confirm" ? "Added to calendar with reminders." : "Dismissed.");
    load();
  }

  const upcoming = items
    .filter((e) => new Date(e.startAt).getTime() >= Date.now() - 1000 * 60 * 60 * 12)
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-4xl text-navy">Calendar</h1>
      <p className="mt-2 text-muted">
        Clear dates from WhatsApp are added automatically. Uncertain ones wait for you. Reminders go out 7 days, 3 days, tomorrow, and on the day — plus WhatsApp if Cloud API is configured.
      </p>

      {pending.length ? (
        <div className="mt-6 space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-rose">Confirm from chat</p>
          {pending.map((item) => {
            const days = daysUntil(item.at);
            return (
              <Card key={`${item.title}-${item.at}`} className="bg-[linear-gradient(135deg,#fffdfb,#f6ece8)]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted">
                      {new Date(item.at).toLocaleString()} · {whenLabel(days)}
                    </p>
                    <p className="mt-2 text-xs text-muted">{item.hint}</p>
                    <p className="mt-1 text-sm italic">“{item.quote}”</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => void decide(item, "confirm")}>
                      Add
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => void decide(item, "dismiss")}>
                      Dismiss
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : null}

      <form onSubmit={add} className="card-premium mt-6 grid gap-4 p-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <Label>Type</Label>
          <select className="h-12 w-full rounded-2xl border border-line bg-white px-4" value={type} onChange={(e) => setType(e.target.value)}>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Date</Label>
          <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} required />
        </div>
        <div className="md:col-span-2">
          <Label>Notes</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <Button type="submit">Add date</Button>
      </form>
      <div className="mt-6 space-y-3">
        {upcoming.length === 0 ? (
          <EmptyState title="No upcoming dates yet" description="Import a WhatsApp ZIP or add a birthday, exam, or anything you don’t want to miss." />
        ) : (
          upcoming.map((e) => {
            const fromChat = (e.notes ?? "").toLowerCase().includes("whatsapp");
            const days = daysUntil(e.startAt);
            return (
              <Card key={e.id} className={days <= 1 ? "bg-[linear-gradient(135deg,#fff6f4,#f4ece4)]" : fromChat ? "bg-[linear-gradient(135deg,#fffdfb,#f6ece8)]" : undefined}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{e.title}</p>
                    <p className="text-sm text-muted">{new Date(e.startAt).toLocaleString()} · {whenLabel(days)}</p>
                    {e.notes ? <p className="mt-2 whitespace-pre-wrap text-xs text-muted">{e.notes}</p> : null}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge tone={days <= 1 ? "rose" : "default"}>{whenLabel(days)}</Badge>
                    <Badge>{e.type.toLowerCase()}</Badge>
                    {fromChat ? <Badge tone="rose">from chat</Badge> : null}
                    <Badge tone="success">reminders on</Badge>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
