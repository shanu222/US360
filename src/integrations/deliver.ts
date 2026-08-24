import { sendEmail, emailConfigured } from "@/lib/email";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type SendChannel = "instagram" | "facebook" | "whatsapp" | "email";

const MANUAL: Record<Exclude<SendChannel, "email">, string> = {
  instagram: "Instagram is never auto-sent. Open Instagram and send it yourself.",
  facebook: "Facebook is never auto-sent. Open Facebook and send it yourself.",
  whatsapp: "WhatsApp is never auto-sent. Open WhatsApp and send it yourself.",
};

export async function deliverOutbound(opts: {
  userId: string;
  channel: SendChannel;
  body: string;
  subject?: string;
  to?: string | null;
  openUrl?: string | null;
  purpose?: "reminder" | "reel" | "message";
}) {
  if (opts.channel !== "email") {
    return {
      status: "manual" as const,
      sent: false,
      openUrl: opts.openUrl,
      reason: MANUAL[opts.channel],
    };
  }

  if (opts.purpose === "reel") {
    return {
      status: "manual" as const,
      sent: false,
      openUrl: opts.openUrl,
      reason: "Reels are never auto-sent. Open the linked app and share it yourself.",
    };
  }

  if (!emailConfigured() || !opts.to) {
    return {
      status: "manual" as const,
      sent: false,
      openUrl: opts.openUrl,
      reason: "Email SMTP is not configured, or no saved address was found.",
    };
  }

  const result = await sendEmail({
    to: opts.to,
    subject: opts.subject || "A note for you",
    text: opts.body,
  });
  if (result.sent) return { status: "sent" as const, sent: true, openUrl: null as string | null, reason: null };
  return {
    status: "failed" as const,
    sent: false,
    openUrl: opts.openUrl,
    reason: result.reason ?? "The mail server did not accept the message.",
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
