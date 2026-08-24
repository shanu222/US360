import nodemailer from "nodemailer";

function smtpPort() {
  const port = Number(process.env.SMTP_PORT || 587);
  return Number.isFinite(port) && port > 0 ? port : 587;
}

export function emailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM);
}

export function emailReady() {
  return emailConfigured() && Boolean(process.env.SMTP_USER && process.env.SMTP_PASSWORD);
}

export function emailSetupStatus() {
  return {
    configured: emailConfigured(),
    ready: emailReady(),
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

export async function sendEmail(opts: { to: string; subject: string; text: string; html?: string }) {
  const to = opts.to.trim();
  if (!looksLikeEmail(to)) {
    return { sent: false as const, reason: "invalid_address" };
  }
  if (!emailConfigured()) {
    console.info("[email:dev]", opts.subject, "->", to);
    return { sent: false as const, reason: "smtp_unconfigured" };
  }

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

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html ?? `<p>${opts.text.replaceAll("\n", "<br/>")}</p>`,
    });
    if (!info.messageId && !info.accepted?.length) {
      return { sent: false as const, reason: "provider_rejected" };
    }
    return { sent: true as const };
  } catch (error) {
    console.error("Email send failed", error);
    return { sent: false as const, reason: "provider_rejected" };
  }
}
