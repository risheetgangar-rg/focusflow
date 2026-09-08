import "server-only";
import webPush from "web-push";
import type { PushSubscriptionRecord } from "@/types/reminder";

let configured = false;

function ensureConfigured() {
  if (configured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) return false;

  webPush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export interface NotificationPayload {
  title: string;
  body: string;
  url?: string;
}

export interface SendResult {
  endpoint: string;
  ok: boolean;
  expired: boolean;
}

export async function sendPushNotification(
  subscription: PushSubscriptionRecord,
  payload: NotificationPayload,
): Promise<SendResult> {
  if (!ensureConfigured()) {
    return { endpoint: subscription.endpoint, ok: false, expired: false };
  }

  try {
    await webPush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload),
    );
    return { endpoint: subscription.endpoint, ok: true, expired: false };
  } catch (err: unknown) {
    const statusCode = (err as { statusCode?: number }).statusCode;
    const expired = statusCode === 404 || statusCode === 410;
    return { endpoint: subscription.endpoint, ok: false, expired };
  }
}
