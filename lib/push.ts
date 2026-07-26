import webpush from "web-push";
import { createSupabaseAdmin } from "./supabase/admin";

const PUB = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const PRIV = process.env.VAPID_PRIVATE_KEY;
const SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:kontakt@agentspace.pl";

let configured = false;
function ensureConfigured(): boolean {
  if (configured) return true;
  if (!PUB || !PRIV) return false;
  webpush.setVapidDetails(SUBJECT, PUB, PRIV);
  configured = true;
  return true;
}

export type PushPayload = { title: string; body: string; url?: string };

export type WebPushSubscription = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export async function saveSubscription(
  agentId: string,
  agencyId: string | null,
  sub: WebPushSubscription,
): Promise<void> {
  const admin = createSupabaseAdmin();
  await admin.from("push_subscriptions").upsert(
    {
      agent_id: agentId,
      agency_id: agencyId,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
    },
    { onConflict: "endpoint" },
  );
}

export async function deleteSubscription(endpoint: string): Promise<void> {
  const admin = createSupabaseAdmin();
  await admin.from("push_subscriptions").delete().eq("endpoint", endpoint);
}

type SubRow = { id: string; endpoint: string; p256dh: string; auth: string };

/** Wysyła powiadomienie na wszystkie urządzenia agenta. Zwraca liczbę wysłanych. */
export async function sendPushToAgent(
  agentId: string,
  payload: PushPayload,
): Promise<number> {
  if (!ensureConfigured()) return 0;
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("agent_id", agentId);

  let sent = 0;
  for (const s of (data ?? []) as SubRow[]) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload),
      );
      sent += 1;
    } catch (err) {
      const code = (err as { statusCode?: number })?.statusCode;
      // 404/410 — subskrypcja wygasła, usuń ją
      if (code === 404 || code === 410) {
        await admin.from("push_subscriptions").delete().eq("id", s.id);
      } else {
        console.error("push send error:", code);
      }
    }
  }
  return sent;
}

export function isPushConfigured(): boolean {
  return Boolean(PUB && PRIV);
}
