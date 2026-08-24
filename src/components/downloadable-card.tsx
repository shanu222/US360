"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LoveCard } from "@/components/love-card";
import { downloadCardFile } from "@/lib/card-download";

export function DownloadableCard({
  id,
  message,
  themeId,
  partnerName,
  kicker,
  className,
}: {
  id?: string;
  message: string;
  themeId: string;
  partnerName?: string | null;
  kicker?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [format, setFormat] = useState<"png" | "pdf">("png");
  const [busy, setBusy] = useState(false);

  async function download() {
    if (!ref.current) return;
    setBusy(true);
    try {
      await downloadCardFile(ref.current, format, `card-${id ?? "preview"}`);
      toast.success(format === "png" ? "High-quality image saved." : "Print-ready PDF saved.");
    } catch {
      toast.error("Could not export that card. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div ref={ref}>
        <LoveCard message={message} themeId={themeId} partnerName={partnerName} kicker={kicker} className={className} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 rounded-full border border-line bg-white px-3 py-2 text-xs">
          <input type="radio" name={`fmt-${id ?? "preview"}`} checked={format === "png"} onChange={() => setFormat("png")} />
          High-quality image
        </label>
        <label className="flex items-center gap-2 rounded-full border border-line bg-white px-3 py-2 text-xs">
          <input type="radio" name={`fmt-${id ?? "preview"}`} checked={format === "pdf"} onChange={() => setFormat("pdf")} />
          Professional PDF
        </label>
        <Button size="sm" variant="outline" disabled={busy || !message} onClick={() => void download()}>
          {busy ? "Preparing…" : format === "png" ? "Download image" : "Download PDF"}
        </Button>
      </div>
    </div>
  );
}
