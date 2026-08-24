import webpush from "web-push";
import { db } from "@/lib/db";

function configured() {
  return Boolean(process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
}

export async function sendPush(userId: string, payload: { title: string; body: string; url?: string }) {
  if (!configured()) return { sent: 0 };

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:admin@localhost",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );

  const subs = await db.pushSubscription.findMany({ where: { userId } });
  let sent = 0;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload),
      );
      sent += 1;
    } catch (error) {
      console.error("Push failed", error);
    }
  }
  return { sent };
}
