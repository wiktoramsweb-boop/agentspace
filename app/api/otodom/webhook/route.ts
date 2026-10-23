import { createHmac, timingSafeEqual } from "node:crypto";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { zapiszBlad } from "@/lib/blad";

/**
 * Powiadomienia z Otodom (OLX Group API): wynik publikacji ogłoszenia,
 * zmiany statusu, błędy walidacji.
 *
 * Odpowiadamy 200 zawsze i szybko: OLX daje 2 sekundy, a przy innym kodzie
 * ponawia wysyłkę 32 razy. Podpis to HMAC-SHA1 z „object_id,transaction_id”
 * kluczem OTODOM_WEBHOOK_SECRET, w nagłówku x-signature.
 */
type Powiadomienie = {
  transaction_id?: string;
  object_id?: string;
  flow?: string;
  event_type?: string;
  error_message?: string;
  data?: { code?: string; url?: string | null; detail?: string; validation?: { detail?: string; field?: string }[] | null; reason?: string };
};

function podpisOk(p: Powiadomienie, podpis: string | null): boolean {
  const sekret = process.env.OTODOM_WEBHOOK_SECRET;
  if (!sekret || !podpis) return false;
  const oczekiwany = createHmac("sha1", sekret).update(`${p.object_id ?? ""},${p.transaction_id ?? ""}`).digest("hex");
  const a = Buffer.from(oczekiwany);
  const b = Buffer.from(podpis.trim().toLowerCase());
  return a.length === b.length && timingSafeEqual(a, b);
}

function opisBledu(p: Powiadomienie): string | null {
  if (!/error/i.test(p.event_type ?? "")) return null;
  const walidacja = (p.data?.validation ?? []).map((v) => [v.field?.replace("urn:concept:", ""), v.detail].filter(Boolean).join(": ")).filter(Boolean);
  return [p.error_message || p.data?.detail || "Otodom odrzucił ogłoszenie.", ...walidacja].join(" · ").slice(0, 900);
}

export async function POST(req: Request) {
  let p: Powiadomienie = {};
  try {
    p = (await req.json()) as Powiadomienie;
  } catch {
    return Response.json({ ok: true });
  }
  if (!podpisOk(p, req.headers.get("x-signature"))) {
    console.warn("otodom webhook: niepoprawny podpis", p.flow, p.event_type);
    return Response.json({ ok: true });
  }

  try {
    const admin = createSupabaseAdmin();
    const uuid = p.object_id ?? null;
    const { data: wpis } = uuid
      ? await admin.from("portal_listings").select("id, agency_id").eq("advert_uuid", uuid).maybeSingle()
      : { data: null };
    const blad = opisBledu(p);
    const kod = p.data?.code || (blad ? "blad" : null);

    await admin.from("portal_events").insert({
      portal: "otodom",
      agency_id: wpis?.agency_id ?? null,
      advert_uuid: uuid,
      transaction_id: p.transaction_id ?? null,
      flow: p.flow ?? null,
      event_type: p.event_type ?? null,
      code: kod,
      message: blad ?? p.data?.reason ?? null,
      payload: p,
    });

    if (wpis) {
      await admin
        .from("portal_listings")
        .update({
          ...(kod ? { status: kod } : {}),
          ...(p.data?.url ? { url: p.data.url } : {}),
          last_error: blad,
          updated_at: new Date().toISOString(),
        })
        .eq("id", wpis.id);
    }
  } catch (e) {
    await zapiszBlad("otodom/webhook", e);
  }
  return Response.json({ ok: true });
}

/** Ręczne sprawdzenie w przeglądarce, że adres działa. */
export async function GET() {
  return Response.json({ ok: true, usluga: "AgentSpace, powiadomienia Otodom" });
}
