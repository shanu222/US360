import { sendEmail, emailConfigured } from "@/lib/email";
import { sendWhatsAppReminder, whatsappConfigured } from "@/integrations/whatsapp";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type SendChannel = "instagram" | "facebook" | "whatsapp" | "email";

export async function deliverOutbound(opts: {
  userId: string;
  channel: SendChannel;
  body: string;
  subject?: string;
  to?: string | null;
  openUrl?: string | null;
}) {
  if (opts.channel === "email") {
    if (!emailConfigured() || !opts.to) {
      return { status: "manual" as const, sent: false, openUrl: opts.openUrl, reason: "Email SMTP is not configured, or her address is missing." };
    }
    const result = await sendEmail({ to: opts.to, subject: opts.subject || "A note for you", text: opts.body });
    if (result.sent) return { status: "sent" as const, sent: true, openUrl: null as string | null, reason: null };
    return { status: "failed" as const, sent: false, openUrl: opts.openUrl, reason: result.reason ?? "Email provider did not accept the message." };
  }

  if (opts.channel === "whatsapp") {
    if (!whatsappConfigured() || !opts.to) {
      return { status: "manual" as const, sent: false, openUrl: opts.openUrl, reason: "WhatsApp Cloud API is not configured, or her number is missing." };
    }
    const sent = await sendWhatsAppReminder({ to: opts.to, title: (opts.subject || "Reminder").slice(0, 60), when: "now" });
    if (sent.ok) return { status: "sent" as const, sent: true, openUrl: null as string | null, reason: null };
    return { status: "manual" as const, sent: false, openUrl: opts.openUrl, reason: "Meta did not send. Opening WhatsApp instead." };
  }

  return {
    status: "manual" as const,
    sent: false,
    openUrl: opts.openUrl,
    reason: "Manual action required — official APIs cannot DM this platform from US360.",
  };
}

export async function logOutbound(opts: {
  userId: string;
  channel: SendChannel;
  body: string;
  subject?: string;
  to?: string | null;
  openUrl?: string | null;
  scheduledAt?: Date | null;
  result: { status: string; sent: boolean; openUrl?: string | null; reason?: string | null };
}) {
  return db.outboundSend.create({
    data: {
      userId: opts.userId,
      channel: opts.channel,
      status: opts.result.status,
      body: opts.body,
      subject: opts.subject,
      toAddress: opts.to,
      openUrl: opts.result.openUrl ?? opts.openUrl,
      scheduledAt: opts.scheduledAt ?? undefined,
      sentAt: opts.result.sent ? new Date() : undefined,
      error: opts.result.reason,
      metadata: { sent: opts.result.sent } as Prisma.InputJsonValue,
    },
  });
}
