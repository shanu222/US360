import { z } from "zod";
import { requireUser } from "@/server/auth";
import { db } from "@/lib/db";
import { handleApiError, jsonOk } from "@/lib/api";
import { emailSetupStatus } from "@/lib/email";
import { gmailStatus } from "@/integrations/gmail";
import { parseGender } from "@/lib/voice";

export async function GET() {
  try {
    const user = await requireUser();
    const settings = await db.userSettings.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });
    const relationship = await db.relationship.findFirst({
      where: { userId: user.id },
      include: { preferences: true },
      orderBy: { createdAt: "asc" },
    });
    const partnerEmail = relationship?.preferences.find((p) => p.key === "partner_email")?.value?.trim() || null;
    const gmail = await gmailStatus(user.id);
    return jsonOk({
      ...settings,
      timezone: user.timezone,
      accountEmail: user.email,
      myEmail: gmail.email || user.email,
      partnerEmail,
      partnerGender: parseGender(relationship?.partnerGender),
      email: emailSetupStatus(),
      gmail,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

const schema = z.object({
  automationMode: z.enum(["SMART", "ASSISTED", "MANUAL"]).optional(),
  morningTime: z.string().optional(),
  afternoonTime: z.string().optional(),
  eveningTime: z.string().optional(),
  nightTime: z.string().optional(),
  notificationsEnabled: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  notifyMorning: z.boolean().optional(),
  notifyEvening: z.boolean().optional(),
  notifyNight: z.boolean().optional(),
  notifyEvents: z.boolean().optional(),
  aiShareMemories: z.boolean().optional(),
  aiShareCalendar: z.boolean().optional(),
  aiShareSituations: z.boolean().optional(),
  quietHoursStart: z.string().optional(),
  quietHoursEnd: z.string().optional(),
  timezone: z.string().optional(),
  whatsappNumber: z.string().optional(),
  whatsappReminders: z.boolean().optional(),
  autoInstagram: z.boolean().optional(),
  autoFacebook: z.boolean().optional(),
  autoWhatsapp: z.boolean().optional(),
  autoEmail: z.boolean().optional(),
  emailCalendarReminders: z.boolean().optional(),
  emailEventReminders: z.boolean().optional(),
  emailImportantDates: z.boolean().optional(),
  emailRelationshipReminders: z.boolean().optional(),
  emailScheduledMessages: z.boolean().optional(),
  autoPartnerEmail: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());
    const { timezone, autoPartnerEmail, autoEmail, ...rest } = body;
    if (timezone) {
      await db.user.update({ where: { id: user.id }, data: { timezone } });
    }
    const partnerFlag = autoPartnerEmail ?? autoEmail;
    const settings = await db.userSettings.upsert({
      where: { userId: user.id },
      update: {
        ...rest,
        ...(partnerFlag !== undefined ? { autoPartnerEmail: partnerFlag, autoEmail: partnerFlag } : {}),
      },
      create: {
        userId: user.id,
        ...rest,
        ...(partnerFlag !== undefined ? { autoPartnerEmail: partnerFlag, autoEmail: partnerFlag } : {}),
      },
    });
    return jsonOk(settings);
  } catch (error) {
    return handleApiError(error);
  }
}
