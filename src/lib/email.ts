export async function sendEmail(opts: { to: string; subject: string; text: string; html?: string }) {
  const host = process.env.SMTP_HOST;
  if (!host) {
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
    const res = await fetch(`https://${host}/`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    return { sent: res.ok };
  } catch (error) {
    console.error("Email send failed", error);
    return { sent: false };
  }
}
