import { describe, expect, it } from "vitest";
import { GMAIL_SCOPES, gmailAuthUrl, gmailOAuthConfigured, gmailRedirectUri } from "@/integrations/google-oauth";
import { buildGmailRaw, gmailPublicError } from "@/integrations/gmail";

describe("Gmail OAuth helpers", () => {
  it("requests offline Gmail send scope and does not put secrets in the URL", () => {
    const prevId = process.env.AUTH_GOOGLE_ID;
    const prevSecret = process.env.AUTH_GOOGLE_SECRET;
    process.env.AUTH_GOOGLE_ID = "client-id.apps.googleusercontent.com";
    process.env.AUTH_GOOGLE_SECRET = "client-secret";
    expect(gmailOAuthConfigured()).toBe(true);
    const url = gmailAuthUrl("user123.abc");
    expect(url).toContain("accounts.google.com");
    expect(url).toContain("access_type=offline");
    expect(url).toContain("gmail.send");
    expect(url).toContain("user123.abc");
    expect(url).not.toContain("client-secret");
    expect(GMAIL_SCOPES.join(" ")).toContain("gmail.send");
    expect(gmailRedirectUri()).toMatch(/\/api\/integrations\/gmail\/callback$/);
    if (prevId) process.env.AUTH_GOOGLE_ID = prevId;
    else delete process.env.AUTH_GOOGLE_ID;
    if (prevSecret) process.env.AUTH_GOOGLE_SECRET = prevSecret;
    else delete process.env.AUTH_GOOGLE_SECRET;
  });

  it("builds a Gmail API raw message from the connected From address", () => {
    const raw = buildGmailRaw({
      from: "shahnawaz@gmail.com",
      to: "partner@gmail.com",
      subject: "Exam tomorrow",
      text: "Good luck today.",
    });
    const decoded = Buffer.from(raw.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    expect(decoded).toContain("From: shahnawaz@gmail.com");
    expect(decoded).toContain("To: partner@gmail.com");
    expect(decoded).toContain("Good luck today.");
    expect(decoded).not.toContain("SMTP_PASSWORD");
  });

  it("returns reconnect copy when Gmail authorization is gone", () => {
    expect(gmailPublicError("gmail_expired")).toMatch(/Reconnect Gmail/i);
    expect(gmailPublicError("gmail_not_connected")).toMatch(/Connect Gmail/i);
  });
});
