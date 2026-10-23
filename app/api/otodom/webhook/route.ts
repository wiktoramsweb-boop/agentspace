import { createHmac, timingSafeEqual } from "node:crypto";
import { zapiszBlad } from "@/lib/blad";

/**
 * Powiadomienia z Otodom (OLX Group API): wynik publikacji ogłoszenia,
 * zmiany statusu, błędy walidacji.
 *
 * Odpowiadamy od razu 200: OLX daje 2 sekundy, a przy innym kodzie ponawia
 * wysyłkę 32 razy. Podpis to HMAC-SHA1 z „object_id,transaction_id”
 * kluczem OTODOM_WEBHOOK_SECRET, w nagłówku x-signature.
 */
function podpisOk(cialo: { object_id?: string; transaction_id?: string }, podpis: string | null): boolean {
  const sekret = process.env.OTODOM_WEBHOOK_SECRET;
  if (!sekret || !podpis) return false;
  const oczekiwany = createHmac("sha1", sekret).update(`${cialo.object_id ?? ""},${cialo.transaction_id ?? ""}`).digest("hex");
  const a = Buffer.from(oczekiwany);
  const b = Buffer.from(podpis.trim().toLowerCase());
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  let cialo: Record<string, unknown> = {};
  try {
    cialo = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: true });
  }
  const ok = podpisOk(cialo as { object_id?: string; transaction_id?: string }, req.headers.get("x-signature"));
  if (!ok) {
    // Zły albo brak podpisu: nie przetwarzamy, ale odpowiadamy 200, żeby OLX nie ponawiał.
    console.warn("otodom webhook: niepoprawny podpis", cialo.flow, cialo.event_type);
    return Response.json({ ok: true });
  }
  // Ogłoszenia i ich statusy zapiszemy, gdy powstanie moduł publikacji.
  // Na razie odnotowujemy błędy publikacji, żeby nie zginęły.
  if (typeof cialo.event_type === "string" && /error|fail/i.test(cialo.event_type)) {
    await zapiszBlad("otodom/webhook", new Error(`${cialo.event_type}: ${String(cialo.error_message ?? "").slice(0, 300)}`));
  }
  return Response.json({ ok: true });
}

/** Ręczne sprawdzenie w przeglądarce, że adres działa. */
export async function GET() {
  return Response.json({ ok: true, usluga: "AgentSpace, powiadomienia Otodom" });
}
