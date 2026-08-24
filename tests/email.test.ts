import { describe, expect, it } from "vitest";
import { emailConfigured, emailReady, sendEmail } from "@/lib/email";
import { deliverOutbound } from "@/integrations/deliver";

describe("email configuration", () => {
  it("is off without SMTP_HOST and SMTP_FROM", () => {
    const host = process.env.SMTP_HOST;
    const from = process.env.SMTP_FROM;
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_FROM;
    expect(emailConfigured()).toBe(false);
    expect(emailReady()).toBe(false);
    if (host) process.env.SMTP_HOST = host;
    if (from) process.env.SMTP_FROM = from;
  });

  it("does not claim sent when SMTP is missing", async () => {
    const host = process.env.SMTP_HOST;
    const from = process.env.SMTP_FROM;
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_FROM;
    const result = await sendEmail({ to: "maya@example.com", subject: "Hi", text: "Hello" });
    expect(result.sent).toBe(false);
    expect(result.reason).toBe("smtp_unconfigured");
    if (host) process.env.SMTP_HOST = host;
    if (from) process.env.SMTP_FROM = from;
  });
});

describe("outbound delivery policy", () => {
  it("never auto-sends Instagram, Facebook, or WhatsApp", async () => {
    for (const channel of ["instagram", "facebook", "whatsapp"] as const) {
      const result = await deliverOutbound({
        userId: "user",
        channel,
        body: "Good luck today.",
        to: "923001234567",
        openUrl: "https://wa.me/923001234567",
      });
      expect(result.sent).toBe(false);
      expect(result.status).toBe("manual");
    }
  });

  it("never auto-sends Reels even by email", async () => {
    const result = await deliverOutbound({
      userId: "user",
      channel: "email",
      body: "https://www.instagram.com/reel/demo",
      to: "maya@example.com",
      purpose: "reel",
    });
    expect(result.sent).toBe(false);
    expect(result.status).toBe("manual");
  });
});
