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

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  /** Powiadomienia z tym samym znacznikiem podmieniają się zamiast mnożyć. */
  tag?: string;
  /** Zostaje na ekranie, dopóki agent go nie dotknie. Dla leadów i pilnych zadań. */
  important?: boolean;
  /** Ikona powiadomienia (dla klientów: ikona ich biura). */
  icon?: string;
};

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
      // 404/410 - subskrypcja wygasła, usuń ją
      if (code === 404 || code === 410) {
        await admin.from("push_subscriptions").delete().eq("id", s.id);
      } else {
        console.error("push send error:", code);
      }
    }
  }
  return sent;
}

/**
 * Powiadomienie do całego biura.
 *
 * Używane, gdy zgłoszenie ze strony nie ma jeszcze przypisanego opiekuna:
 * lepiej, żeby zobaczyli je wszyscy, niż żeby przeleżało do rana.
 */
export async function sendPushToAgency(
  agencyId: string,
  payload: PushPayload,
): Promise<number> {
  if (!ensureConfigured()) return 0;
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("push_subscriptions")
    .select("agent_id")
    .eq("agency_id", agencyId);

  const agentIds = [...new Set((data ?? []).map((row) => row.agent_id as string))];
  let sent = 0;
  for (const agentId of agentIds) sent += await sendPushToAgent(agentId, payload);
  return sent;
}

export function isPushConfigured(): boolean {
  return Boolean(PUB && PRIV);
}

/* ─────────────── Powiadomienia dla klientów biura ─────────────── */

/**
 * Klienci mają własną tabelę subskrypcji, kluczowaną dostępem do portalu,
 * a nie kontem w aplikacji. Powód jest prosty: klient nie ma konta, a jego
 * dostęp da się odwołać jednym kliknięciem i wtedy powiadomienia też mają
 * przestać chodzić.
 */
export async function zapiszSubskrypcjeKlienta(
  accessId: string,
  sub: WebPushSubscription,
): Promise<boolean> {
  const admin = createSupabaseAdmin();
  const { error } = await admin.from("client_push_subscriptions").upsert(
    {
      access_id: accessId,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
    },
    { onConflict: "endpoint" },
  );
  return !error;
}

export async function usunSubskrypcjeKlienta(endpoint: string): Promise<void> {
  const admin = createSupabaseAdmin();
  await admin.from("client_push_subscriptions").delete().eq("endpoint", endpoint);
}

/**
 * Powiadomienie do klienta.
 *
 * Treść przychodzi gotowa z warstwy, która już przycięła dane: tutaj nie ma
 * żadnej logiki o tym, co klient może zobaczyć, bo dublowanie tej decyzji
 * w drugim miejscu to najprostsza droga do wycieku.
 */
export async function wyslijPushDoKlienta(accessId: string, payload: PushPayload): Promise<number> {
  if (!ensureConfigured()) return 0;
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("client_push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("access_id", accessId);

  let wyslane = 0;
  for (const s of (data ?? []) as SubRow[]) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload),
      );
      wyslane += 1;
    } catch (err) {
      const kod = (err as { statusCode?: number })?.statusCode;
      if (kod === 404 || kod === 410) {
        await admin.from("client_push_subscriptions").delete().eq("id", s.id);
      }
    }
  }
  return wyslane;
}

/**
 * Powiadomienie o nowym zdarzeniu w sprawie klienta.
 *
 * Szuka aktywnych dostępów przypiętych do tej nieruchomości i wysyła im
 * krótką informację. Treść nie zawiera nazwisk ani numerów, tylko to,
 * co i tak stoi w portalu.
 */
export async function powiadomKlientowONieruchomosci(
  propertyId: string,
  payload: PushPayload,
): Promise<void> {
  const admin = createSupabaseAdmin();
  const { data: przypisania } = await admin
    .from("client_portal_properties")
    .select("access_id")
    .eq("property_id", propertyId);

  const idy = [...new Set((przypisania ?? []).map((p) => p.access_id as string))];
  if (idy.length === 0) return;

  const { data: dostepy } = await admin
    .from("client_portal_access")
    .select("id, token")
    .in("id", idy)
    .is("revoked_at", null);

  for (const d of (dostepy ?? []) as { id: string; token: string }[]) {
    await wyslijPushDoKlienta(d.id, { ...payload, url: `/klient/${d.token}`, icon: `/klient/${d.token}/ikona?r=192` });
  }
}
