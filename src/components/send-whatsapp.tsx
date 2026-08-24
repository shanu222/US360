"use client";

import { useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { copyCardImageToClipboard } from "@/lib/card-download";
import { composeWhatsAppText, whatsappClickUrl } from "@/lib/whatsapp-open";

export function SendWhatsAppButton({
  reminder,
  message,
  card,
  reelUrl,
  imageUrls,
  cardNodeId,
  label = "Send on WhatsApp",
  size = "sm",
}: {
  reminder?: string | null;
  message?: string | null;
  card?: string | null;
  reelUrl?: string | null;
  imageUrls?: string[];
  cardNodeId?: string;
  label?: string;
  size?: "sm" | "lg" | "default";
}) {
  const busy = useRef(false);

  async function send() {
    if (busy.current) return;
    busy.current = true;
    try {
      if (cardNodeId) {
        const node = document.getElementById(cardNodeId);
        if (node instanceof HTMLElement) {
          try {
            await copyCardImageToClipboard(node);
            toast.message("Card image copied. Paste it into the WhatsApp chat.");
          } catch {
            /* clipboard image is best-effort; text + links still go through */
          }
        }
      }
      const status = await fetch("/api/integrations/status").then((r) => r.json());
      const phone = status.data?.whatsapp?.handle as string | undefined;
      const text = composeWhatsAppText({ reminder, message, card, reelUrl, imageUrls });
      window.open(whatsappClickUrl(phone, text), "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Could not open WhatsApp.");
    } finally {
      busy.current = false;
    }
  }

  return (
    <Button size={size} variant="outline" type="button" onClick={() => void send()}>
      {label}
    </Button>
  );
}
