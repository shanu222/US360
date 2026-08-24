import { requireUser } from "@/server/auth";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { sendWhatsAppReminder, whatsappSetupStatus } from "@/integrations/whatsapp";
import { db } from "@/lib/db";

export async function GET() {
  try {
    await requireUser();
    return jsonOk(whatsappSetupStatus());
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST() {
  try {
    const user = await requireUser();
    const status = whatsappSetupStatus();
    if (!status.configured) {
      return jsonError("WhatsApp Cloud API is not configured on the server yet.", 503);
    }
    const settings = await db.userSettings.findUnique({ where: { userId: user.id } });
    if (!settings?.whatsappNumber || !settings.whatsappReminders) {
      return jsonError("Save your WhatsApp number and enable reminders first.", 400);
    }
    const sent = await sendWhatsAppReminder({
      to: settings.whatsappNumber,
      title: "Reminder",
      when: "now",
    });
    if (!sent.ok) return jsonError("Meta did not accept the test message. Check the template name and number.", 502);
    return jsonOk({ sent: true });
  } catch (error) {
    return handleApiError(error);
  }
}
