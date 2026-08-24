export function composeWhatsAppText(parts: {
  reminder?: string | null;
  message?: string | null;
  card?: string | null;
  reelUrl?: string | null;
  imageUrls?: Array<string | null | undefined>;
}) {
  const seen = new Set<string>();
  const lines: string[] = [];
  const push = (value?: string | null) => {
    const text = (value ?? "").trim();
    if (!text || seen.has(text)) return;
    seen.add(text);
    lines.push(text);
  };
  push(parts.reminder);
  push(parts.message);
  push(parts.card);
  push(parts.reelUrl);
  for (const url of parts.imageUrls ?? []) push(url);
  return lines.join("\n\n");
}

export function whatsappClickUrl(phone: string | null | undefined, text: string) {
  const encoded = encodeURIComponent(text.trim().slice(0, 1800));
  const digits = (phone ?? "").replace(/[^\d]/g, "");
  if (!encoded) {
    return digits.length >= 10 ? `https://wa.me/${digits}` : "https://wa.me/";
  }
  return digits.length >= 10 ? `https://wa.me/${digits}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
}
