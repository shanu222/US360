import { describe, expect, it } from "vitest";
import { sendEmail } from "@/lib/email";
import { deliverOutbound } from "@/integrations/deliver";

describe("email sending policy", () => {
  it("does not claim sent without a user's Gmail connection", async () => {
    const result = await sendEmail({ to: "maya@example.com", subject: "Hi", text: "Hello" });
    expect(result.sent).toBe(false);
    expect(result.reason).toBe("gmail_not_connected");
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
