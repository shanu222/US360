export function emailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM);
}

export async function sendEmail(opts: { to: string; subject: string; text: string; html?: string }) {
  if (!emailConfigured()) {
    console.info("[email:dev]", opts.subject, "->", opts.to);
    return { sent: false, reason: "smtp_unconfigured" };
  }

  const payload = {
    from: process.env.SMTP_FROM ?? "US360 <noreply@localhost>",
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html ?? `<p>${opts.text}</p>`,
  };

  try {
    const res = await fetch(`https://${process.env.SMTP_HOST}/`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { sent: false, reason: "provider_rejected" };
    return { sent: true as const };
  } catch (error) {
    console.error("Email send failed", error);
    return { sent: false, reason: "network_error" };
  }
}
