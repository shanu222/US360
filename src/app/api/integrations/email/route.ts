import { requireUser } from "@/server/auth";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { emailSetupStatus, sendEmail } from "@/lib/email";
import { gmailPublicError, gmailStatus } from "@/integrations/gmail";

export async function GET() {
  try {
    const user = await requireUser();
    const gmail = await gmailStatus(user.id);
    return jsonOk({ ...emailSetupStatus(), gmail });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST() {
  try {
    const user = await requireUser();
    const gmail = await gmailStatus(user.id);
    if (!gmail.connected) {
      return jsonError(
        gmail.expired
          ? gmailPublicError("gmail_expired")
          : gmailPublicError("gmail_not_connected"),
        400,
      );
    }
    const to = gmail.email || user.email;
    if (!to) {
      return jsonError("No Gmail address is available on this connection.", 400);
    }
    const sent = await sendEmail({
      userId: user.id,
      to,
      subject: "US360 email reminder test",
      text: "This is a test reminder from US360. If you received it, your connected Gmail account can send US360 reminders. Calendar jobs will use this same Gmail connection — not a shared SMTP mailbox.",
    });
    if (!sent.sent) {
      return jsonError(gmailPublicError(sent.reason), 502);
    }
    return jsonOk({ sent: true, to, from: sent.from });
  } catch (error) {
    return handleApiError(error);
  }
}
