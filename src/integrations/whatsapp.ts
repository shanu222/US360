import { appUrl } from "@/lib/env";

export function whatsappConfigured() {
  return Boolean(
    process.env.WHATSAPP_TOKEN &&
      process.env.WHATSAPP_PHONE_NUMBER_ID &&
      process.env.WHATSAPP_REMINDER_TEMPLATE,
  );
}

export function whatsappSetupStatus() {
  return {
    configured: whatsappConfigured(),
    hasToken: Boolean(process.env.WHATSAPP_TOKEN),
    hasPhoneNumberId: Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID),
    hasTemplate: Boolean(process.env.WHATSAPP_REMINDER_TEMPLATE),
    webhookUrl: `${appUrl()}/api/integrations/whatsapp/webhook`,
    docs: "/docs/whatsapp",
  };
}

function digits(value: string) {
  return value.replace(/[^\d]/g, "");
}

function messagesEndpoint() {
  const base = (process.env.WHATSAPP_API_BASE || "https://graph.facebook.com/v21.0").replace(/\/$/, "");
  return `${base}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
}

export async function sendWhatsAppReminder(opts: { to: string; title: string; when: string; body?: string }) {
  if (!whatsappConfigured()) {
    return { ok: false as const, reason: "not_configured" };
  }
  const to = digits(opts.to);
  if (to.length < 10) return { ok: false as const, reason: "invalid_number" };

  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: process.env.WHATSAPP_REMINDER_TEMPLATE,
      language: { code: process.env.WHATSAPP_TEMPLATE_LANG || "en" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: (opts.title || "event").slice(0, 60) },
            { type: "text", text: (opts.when || "soon").slice(0, 40) },
          ],
        },
      ],
    },
  };

  const res = await fetch(messagesEndpoint(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error("whatsapp send failed", err);
    return { ok: false as const, reason: "api_error" };
  }
  return { ok: true as const };
}
