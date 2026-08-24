import { requireUser } from "@/server/auth";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { emailSetupStatus, sendEmail } from "@/lib/email";

export async function GET() {
  try {
    await requireUser();
    return jsonOk(emailSetupStatus());
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST() {
  try {
    const user = await requireUser();
    const status = emailSetupStatus();
    if (!status.configured) {
      return jsonError("SMTP is not configured on the server yet. See /docs/email.", 503);
    }
    if (!user.email) {
      return jsonError("Your account has no email address.", 400);
    }
    const sent = await sendEmail({
      to: user.email,
      subject: "US360 email reminder test",
      text: "This is a test reminder from US360. If you received it, SMTP is working. Calendar reminders will use this same path.",
    });
    if (!sent.sent) {
      return jsonError("The mail server did not accept the test. Check SMTP host, port, username, password, and From address.", 502);
    }
    return jsonOk({ sent: true, to: user.email });
  } catch (error) {
    return handleApiError(error);
  }
}
