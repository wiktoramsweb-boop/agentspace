// Czyste funkcje Dyżuru AI: podpis Twilio, TwiML i stan rozmowy w adresie.
// Bez importów aplikacji, żeby test (npm run test:dyzur) działał w czystym Node.
import { createHmac, timingSafeEqual } from "node:crypto";

/* ── Podpis Twilio ─────────────────────────────────────────── */

/**
 * Twilio podpisuje każde zapytanie: HMAC-SHA1 z pełnego adresu i parametrów
 * POST (posortowanych, sklejonych klucz+wartość) kluczem Auth Token. Bez tej
 * kontroli każdy mógłby udawać połączenie i palić kredyty biura.
 */
export function podpisTwilioOk(url: string, params: Record<string, string>, podpis: string | null, token: string): boolean {
  if (!podpis || !token) return false;
  const dane = url + Object.keys(params).sort().map((k) => k + params[k]).join("");
  const oczekiwany = createHmac("sha1", token).update(dane, "utf8").digest("base64");
  const a = Buffer.from(oczekiwany);
  const b = Buffer.from(podpis);
  return a.length === b.length && timingSafeEqual(a, b);
}

/* ── TwiML ─────────────────────────────────────────────────── */

const xml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const GLOS = () => process.env.DYZUR_GLOS || "Polly.Ola-Neural";

export function twimlRozmowa(tekst: string, akcja: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Gather input="speech" language="pl-PL" speechTimeout="auto" actionOnEmptyResult="true" action="${xml(akcja)}" method="POST"><Say language="pl-PL" voice="${GLOS()}">${xml(tekst)}</Say></Gather></Response>`;
}

export function twimlKoniec(tekst: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Say language="pl-PL" voice="${GLOS()}">${xml(tekst)}</Say><Hangup/></Response>`;
}

export function twiml(body: string): Response {
  return new Response(body, { headers: { "Content-Type": "text/xml; charset=utf-8" } });
}

/* ── Stan rozmowy w adresie ────────────────────────────────── */

/**
 * Historię rozmowy wozimy w adresie kolejnego kroku. Twilio podpisuje adres,
 * więc nikt jej po drodze nie podmieni, a serwer nie musi niczego trzymać.
 */
export type StanDyzuru = { a: string; l: string | null; h: [0 | 1, string][]; t?: number };

export function stanDoParametru(s: StanDyzuru): string {
  return Buffer.from(JSON.stringify(s), "utf8").toString("base64url");
}

export function stanZParametru(v: string | null): StanDyzuru | null {
  if (!v) return null;
  try {
    const s = JSON.parse(Buffer.from(v, "base64url").toString("utf8")) as StanDyzuru;
    return typeof s.a === "string" && Array.isArray(s.h) ? s : null;
  } catch {
    return null;
  }
}
