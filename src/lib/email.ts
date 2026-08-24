import nodemailer from "nodemailer";
import { gmailOAuthConfigured } from "@/integrations/google-oauth";
import { gmailStatus, sendGmailForUser } from "@/integrations/gmail";

function smtpPort() {
  const port = Number(process.env.SMTP_PORT || 587);
  return Number.isFinite(port) && port > 0 ? port : 587;
}

export function smtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM);
}

export function smtpReady() {
  return smtpConfigured() && Boolean(process.env.SMTP_USER && process.env.SMTP_PASSWORD);
}

/** Shared SMTP is off unless an operator explicitly opts in. Per-user Gmail is the send path. */
export function smtpSharedFallbackEnabled() {
  return process.env.SMTP_ALLOW_SHARED_FALLBACK === "true" && smtpConfigured();
}

export function emailConfigured() {
  return gmailOAuthConfigured() || smtpSharedFallbackEnabled();
}

export function emailReady() {
  return gmailOAuthConfigured() || smtpReady();
}

export function emailSetupStatus() {
  return {
    configured: emailConfigured(),
    ready: emailReady(),
    gmailOAuth: gmailOAuthConfigured(),
    smtpFallback: smtpSharedFallbackEnabled(),
    hasHost: Boolean(process.env.SMTP_HOST),
    hasPort: Boolean(process.env.SMTP_PORT),
    hasUser: Boolean(process.env.SMTP_USER),
    hasPassword: Boolean(process.env.SMTP_PASSWORD),
    hasFrom: Boolean(process.env.SMTP_FROM),
    docs: "/docs/email",
  };
}

function looksLikeEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

async function sendSharedSmtp(opts: { to: string; subject: string; text: string; html?: string }) {
  const port = smtpPort();
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASSWORD
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
  });
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html ?? `<p>${opts.text.replaceAll("\n", "<br/>")}</p>`,
  });
  if (!info.messageId && !info.accepted?.length) {
    return { sent: false as const, reason: "provider_rejected", from: null as string | null };
  }
  return { sent: true as const, from: process.env.SMTP_FROM ?? null };
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  userId?: string;
}) {
  const to = opts.to.trim();
  if (!looksLikeEmail(to)) {
    return { sent: false as const, reason: "invalid_address", from: null as string | null };
  }

  if (opts.userId) {
    const gmail = await sendGmailForUser({
      userId: opts.userId,
      to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    });
    if (gmail.sent || gmail.reason !== "gmail_not_connected") {
      return gmail;
    }
    if (smtpSharedFallbackEnabled()) {
      try {
        return await sendSharedSmtp(opts);
      } catch (error) {
        console.error("Email send failed", error);
        return { sent: false as const, reason: "provider_rejected", from: null as string | null };
      }
    }
    return { sent: false as const, reason: "gmail_not_connected", from: null as string | null };
  }

  if (!smtpSharedFallbackEnabled()) {
    console.info("[email:dev]", opts.subject, "->", to);
    return { sent: false as const, reason: "gmail_not_connected", from: null as string | null };
  }

  try {
    return await sendSharedSmtp(opts);
  } catch (error) {
    console.error("Email send failed", error);
    return { sent: false as const, reason: "provider_rejected", from: null as string | null };
  }
}

export async function userCanSendEmail(userId: string) {
  const status = await gmailStatus(userId);
  return status.connected || smtpSharedFallbackEnabled();
}
