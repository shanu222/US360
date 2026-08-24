import { sendEmail } from "@/lib/email";
import { db } from "@/lib/db";
import { gmailStatus } from "@/integrations/gmail";
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
  audience?: "user" | "partner";
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

  if (!opts.to) {
    return {
      status: "manual" as const,
      sent: false,
      openUrl: opts.openUrl,
      reason: "No saved email address was found for this reminder.",
    };
  }

  const gmail = await gmailStatus(opts.userId);
  if (!gmail.connected) {
    return {
      status: gmail.expired ? ("expired" as const) : ("manual" as const),
      sent: false,
      openUrl: opts.openUrl,
      reason: gmail.expired
        ? "Gmail connection expired. Reconnect Gmail in Settings."
        : "Connect Gmail in Settings to send this from your account.",
    };
  }

  const result = await sendEmail({
    userId: opts.userId,
    to: opts.to,
    subject: opts.subject || "A note for you",
    text: opts.body,
  });
  if (result.sent) return { status: "sent" as const, sent: true, openUrl: null as string | null, reason: null, from: result.from };
  return {
    status: result.reason === "gmail_expired" ? ("expired" as const) : ("failed" as const),
    sent: false,
    openUrl: opts.openUrl,
    reason: result.reason ?? "Gmail did not accept the message.",
    from: result.from ?? null,
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
