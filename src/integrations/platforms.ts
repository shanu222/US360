import { emailConfigured } from "@/lib/email";
import { instagramConfigured } from "@/integrations/instagram";
import { whatsappConfigured } from "@/integrations/whatsapp";
import { db } from "@/lib/db";

export function facebookConfigured() {
  return Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET);
}

export async function platformStatus(userId: string) {
  const [user, settings, ig, relationship] = await Promise.all([
    db.user.findUnique({ where: { id: userId } }),
    db.userSettings.findUnique({ where: { userId } }),
    db.integrationAccount.findUnique({ where: { userId_provider: { userId, provider: "instagram" } } }),
    db.relationship.findFirst({ where: { userId }, include: { preferences: true }, orderBy: { createdAt: "asc" } }),
  ]);
  const prefs = new Map((relationship?.preferences ?? []).map((p) => [p.key, p.value]));
  const handle = (key: string) => prefs.get(key)?.trim() || "";

  return {
    instagram: {
      label: "Instagram",
      serverConfigured: instagramConfigured(),
      connected: Boolean(ig?.accessToken) || Boolean(handle("partner_instagram")),
      oauth: Boolean(ig?.accessToken),
      handle: handle("partner_instagram") || null,
      auto: false,
      canAutoSend: false,
      fallback: "Open Instagram — never auto-sent",
    },
    facebook: {
      label: "Facebook",
      serverConfigured: facebookConfigured(),
      connected: Boolean(handle("partner_facebook")),
      oauth: false,
      handle: handle("partner_facebook") || null,
      auto: false,
      canAutoSend: false,
      fallback: "Open Facebook — never auto-sent",
    },
    whatsapp: {
      label: "WhatsApp",
      serverConfigured: whatsappConfigured(),
      connected: Boolean(handle("partner_whatsapp") || settings?.whatsappNumber),
      oauth: false,
      handle: handle("partner_whatsapp") || settings?.whatsappNumber || null,
      auto: false,
      canAutoSend: false,
      fallback: "Open WhatsApp — never auto-sent",
    },
    email: {
      label: "Email",
      serverConfigured: emailConfigured(),
      connected: Boolean(handle("partner_email") || user?.email),
      oauth: false,
      handle: handle("partner_email") || user?.email || null,
      auto: Boolean(settings?.emailNotifications),
      canAutoSend: emailConfigured() && Boolean(handle("partner_email") || user?.email),
      fallback: "Reminders go to saved emails when SMTP is configured",
    },
  };
}
