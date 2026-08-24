"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { extractWhatsAppTextFromZip } from "@/chat/unzip-client";

type Result = {
  summary: string;
  partnerName: string;
  messageCount: number;
  facts: number;
  likes: string[];
  dislikes: string[];
  foods: string[];
  places: string[];
  topics: { topic: string; count: number }[];
  communicationStyle: string[];
  calendarEvents?: number;
  pendingCalendar?: number;
  reelQueries?: string[];
};

export function ChatImportFlow({ allowSkip }: { allowSkip: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"idle" | "reading" | "analyzing">("idle");
  const [result, setResult] = useState<Result | null>(null);
  const [fileLabel, setFileLabel] = useState<string | null>(null);

  async function onFile(file: File) {
    setBusy("reading");
    setResult(null);
    setFileLabel(file.name);
    try {
      let text = "";
      let chatFileName = file.name;
      if (file.name.toLowerCase().endsWith(".txt")) {
        text = await file.text();
      } else {
        const extracted = await extractWhatsAppTextFromZip(await file.arrayBuffer());
        text = extracted.text;
        chatFileName = extracted.chatFileName;
      }
      if (text.length < 40) throw new Error("NO_CHAT_TXT");
      if (text.length > 7_500_000) {
        toast.error("That chat is too large to upload in one piece. Export without media, or a shorter date range.");
        setBusy("idle");
        return;
      }
      setBusy("analyzing");
      const res = await fetch("/api/chat/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fileName: file.name, chatFileName, text }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not read that export.");
        setBusy("idle");
        return;
      }
      setResult(json.data as Result);
      setBusy("idle");
    } catch (error) {
      const message =
        error instanceof Error && error.message === "NO_CHAT_TXT"
          ? "No chat text was found in that ZIP. Export the chat from WhatsApp again."
          : "Could not open that ZIP. Use WhatsApp → Export chat.";
      toast.error(message);
      setBusy("idle");
    }
  }

  async function skip() {
    setBusy("analyzing");
    await fetch("/api/chat/skip", { method: "POST" });
    setBusy("idle");
    router.push("/home");
    router.refresh();
  }

  function goHome() {
    router.push("/home");
    router.refresh();
  }

  const working = busy !== "idle";

  return (
    <div className="bg-mesh min-h-screen px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <p className="text-center font-display text-4xl text-navy">US360</p>
        <p className="mt-2 text-center text-xs uppercase tracking-[0.28em] text-muted">WhatsApp chat import</p>

        <div className="card-premium mt-8 p-8">
          <h1 className="font-display text-3xl text-navy">Read your chat history</h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            After login, US360 can learn from a WhatsApp export — likes, routines, dates, and how you write —
            without sending the chat to an AI. Drop the ZIP WhatsApp creates. Only the text file inside is read;
            photos and voice notes stay on your device.
          </p>

          {!result ? (
            <>
              <label className="mt-6 flex cursor-pointer flex-col items-center rounded-3xl border border-dashed border-line bg-paper px-6 py-10 text-center hover:border-navy">
                <input
                  type="file"
                  accept=".zip,.txt,application/zip"
                  className="hidden"
                  disabled={working}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void onFile(file);
                    e.currentTarget.value = "";
                  }}
                />
                <span className="text-sm font-medium text-navy">
                  {working ? (busy === "reading" ? "Opening ZIP…" : "Reading the whole chat…") : "Upload WhatsApp chat ZIP"}
                </span>
                <span className="mt-2 text-xs text-muted">
                  WhatsApp → Contact → Export chat → ZIP. With or without media is fine.
                </span>
                {fileLabel ? <span className="mt-3 text-xs text-ink">{fileLabel}</span> : null}
              </label>
              {allowSkip ? (
                <div className="mt-6 flex justify-center">
                  <Button type="button" variant="ghost" disabled={working} onClick={skip}>
                    I’ll do this later
                  </Button>
                </div>
              ) : (
                <div className="mt-6 flex justify-center">
                  <Button type="button" variant="ghost" disabled={working} onClick={goHome}>
                    Back to home
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="mt-6 space-y-4">
              <p className="text-sm leading-6 text-ink">{result.summary}</p>
              <p className="text-xs uppercase tracking-[0.2em] text-rose">
                {result.messageCount.toLocaleString()} messages · {result.facts} details saved · {result.calendarEvents ?? 0} confirmed dates · {result.pendingCalendar ?? 0} to confirm · {result.partnerName}
              </p>
              <ChipRow label="Reel searches" items={result.reelQueries ?? []} />
              <ChipRow label="Style" items={result.communicationStyle} />
              <ChipRow label="Likes" items={result.likes} />
              <ChipRow label="Foods" items={result.foods} />
              <ChipRow label="Places" items={result.places} />
              <ChipRow label="Topics" items={result.topics.map((t) => t.topic)} />
              {result.dislikes.length ? <ChipRow label="Boundaries" items={result.dislikes} /> : null}
              <p className="text-xs text-muted">
                Clear dates are on Calendar. Uncertain ones wait for your confirmation there. Reminders fire 7 / 3 / 1 / day-of.
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                <Button className="w-full" onClick={goHome}>
                  Continue to home
                </Button>
                <Button className="w-full" variant="outline" onClick={() => router.push("/calendar")}>
                  Open calendar
                </Button>
                <Button className="w-full" variant="outline" onClick={() => router.push("/reels")}>
                  Search Reels
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChipRow({ label, items }: { label: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-muted">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.slice(0, 8).map((item) => (
          <span key={item} className="rounded-full bg-paper px-3 py-1 text-xs">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
