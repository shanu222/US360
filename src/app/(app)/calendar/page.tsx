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

export default function CalendarPage() {
  const [items, setItems] = useState<EventItem[]>([]);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("EVENT");
  const [startAt, setStartAt] = useState("");
  const [notes, setNotes] = useState("");

  async function load() {
    const res = await fetch("/api/calendar");
    const json = await res.json();
    setItems(json.data ?? []);
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

  const upcoming = items.filter((e) => new Date(e.startAt).getTime() >= Date.now() - 1000 * 60 * 60 * 12);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-4xl text-navy">Calendar</h1>
      <p className="mt-2 text-muted">
        WhatsApp dates land here automatically after import. You’ll get reminders 7 days, 3 days, 1 day, and on the day.
      </p>
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
            const start = new Date(e.startAt);
            start.setHours(0, 0, 0, 0);
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const days = Math.round((start.getTime() - now.getTime()) / 86400000);
            const when = days <= 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;
            return (
              <Card key={e.id} className={fromChat ? "bg-[linear-gradient(135deg,#fffdfb,#f6ece8)]" : undefined}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{e.title}</p>
                    <p className="text-sm text-muted">{new Date(e.startAt).toLocaleString()} · {when}</p>
                    {e.notes ? <p className="mt-2 text-xs text-muted">{e.notes}</p> : null}
                  </div>
                  <div className="flex flex-col items-end gap-2">
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
