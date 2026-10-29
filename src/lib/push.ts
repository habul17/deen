import "server-only";
import webpush from "web-push";

let configured = false;

export function pushConfigured() {
  if (configured) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? "mailto:admin@example.com", pub, priv);
  configured = true;
  return true;
}

export type PushPayload = { title: string; body: string; tag: string; url: string; actions?: { action: string; title: string }[] };

/** Returns false when the subscription is gone and should be deleted. */
export async function sendPush(sub: { endpoint: string; p256dh: string; auth: string }, payload: PushPayload) {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload),
      { TTL: 60 * 30, urgency: "high" },
    );
    return true;
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) return false;
    console.error("[push] send failed", status, (err as Error).message);
    return true;
  }
}
