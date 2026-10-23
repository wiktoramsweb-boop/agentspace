import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { createSupabaseAdmin } from "../supabase/admin";
import { odszyfruj, zaszyfruj } from "../szyfr";

/**
 * Połączenie z OLX Group API (Otodom).
 *
 * Każde biuro łączy własne konto Otodom (OAuth). Access token żyje godzinę,
 * więc przed każdym wywołaniem sprawdzamy ważność i odświeżamy po cichu:
 * agent nie może zauważyć, że token wygasł. Gdy biuro cofnie dostęp po
 * stronie Otodom, odświeżenie się nie uda i oznaczamy połączenie jako zerwane.
 */

const API = "https://api.olxgroup.com";
const UA = "AgentSpace";
export const PORTAL = "otodom";

export function konfiguracjaOtodom(): { gotowe: boolean; brakuje: string[] } {
  const brakuje = ["OTODOM_CLIENT_ID", "OTODOM_CLIENT_SECRET", "OTODOM_API_KEY", "PORTAL_TOKEN_KEY"].filter((k) => !process.env[k]?.trim());
  return { gotowe: brakuje.length === 0, brakuje };
}

function naglowkiPodstawowe(): Record<string, string> {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-API-KEY": process.env.OTODOM_API_KEY!.trim(),
    "User-Agent": UA,
  };
}

function basic(): string {
  return Buffer.from(`${process.env.OTODOM_CLIENT_ID!.trim()}:${process.env.OTODOM_CLIENT_SECRET!.trim()}`).toString("base64");
}

/* ───────────── state OAuth: podpisany, żeby nikt nie podpiął swojego konta pod cudze biuro ───────────── */

export function stanAutoryzacji(agencyId: string, userId: string): string {
  const tresc = `${agencyId}.${userId}.${Date.now()}.${randomBytes(6).toString("hex")}`;
  const podpis = createHmac("sha256", process.env.OTODOM_CLIENT_SECRET!.trim()).update(tresc).digest("base64url").slice(0, 22);
  return Buffer.from(`${tresc}.${podpis}`).toString("base64url");
}

export function sprawdzStan(stan: string): { agencyId: string; userId: string } | null {
  try {
    const t = Buffer.from(stan, "base64url").toString("utf8");
    const czesci = t.split(".");
    if (czesci.length !== 5) return null;
    const [agencyId, userId, kiedy, losowe, podpis] = czesci;
    const oczekiwany = createHmac("sha256", process.env.OTODOM_CLIENT_SECRET!.trim()).update(`${agencyId}.${userId}.${kiedy}.${losowe}`).digest("base64url").slice(0, 22);
    if (podpis.length !== oczekiwany.length || !timingSafeEqual(Buffer.from(podpis), Buffer.from(oczekiwany))) return null;
    // Autoryzacja trwa chwilę: stan starszy niż 30 minut odrzucamy.
    if (Date.now() - Number(kiedy) > 30 * 60_000) return null;
    return { agencyId, userId };
  } catch {
    return null;
  }
}

export function adresAutoryzacji(stan: string): string {
  const q = new URLSearchParams({ response_type: "code", client_id: process.env.OTODOM_CLIENT_ID!.trim(), state: stan });
  return `https://www.otodom.pl/pl/crm/authorization/?${q}`;
}

/* ───────────── tokeny ───────────── */

type Tokeny = { access_token: string; refresh_token: string; expires_in: number };

async function zadanieTokenu(body: Record<string, string>): Promise<Tokeny> {
  const r = await fetch(`${API}/oauth/v1/token`, {
    method: "POST",
    headers: { ...naglowkiPodstawowe(), Authorization: `Basic ${basic()}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  const d = (await r.json().catch(() => ({}))) as Partial<Tokeny> & { error?: string; error_description?: string; message?: string };
  if (!r.ok || !d.access_token || !d.refresh_token) {
    throw new Error(d.error_description || d.message || d.error || `Otodom odpowiedział ${r.status}`);
  }
  return d as Tokeny;
}

async function zapiszTokeny(agencyId: string, t: Tokeny, extra: Record<string, unknown> = {}) {
  const { error } = await createSupabaseAdmin()
    .from("portal_connections")
    .upsert(
      {
        agency_id: agencyId,
        portal: PORTAL,
        access_token_enc: zaszyfruj(t.access_token),
        refresh_token_enc: zaszyfruj(t.refresh_token),
        // Minuta zapasu, żeby nie wysłać tokenu, który wygaśnie w drodze.
        expires_at: new Date(Date.now() + (t.expires_in - 60) * 1000).toISOString(),
        revoked_at: null,
        last_error: null,
        ...extra,
      },
      { onConflict: "agency_id,portal" },
    );
  if (error) throw new Error(/portal_connections/.test(error.message) ? "Brak tabel eksportu. Uruchom lib/SETUP-v50-portale.sql w Supabase." : error.message);
}

export async function polaczKodem(agencyId: string, userId: string, code: string): Promise<void> {
  const t = await zadanieTokenu({ grant_type: "authorization_code", code });
  // Dopóki OLX nie zatwierdzi integracji, działa tylko konto testowe, a ono
  // wymaga prefiksu [qatest-mercury]. Po zatwierdzeniu ustawiamy OTODOM_PRODUKCJA=1.
  await zapiszTokeny(agencyId, t, { connected_by: userId, connected_at: new Date().toISOString(), test_mode: process.env.OTODOM_PRODUKCJA !== "1" });
}

export type Polaczenie = { polaczone: boolean; test: boolean; od: string | null; blad: string | null; tabele: boolean };

export async function stanPolaczenia(agencyId: string): Promise<Polaczenie> {
  const { data, error } = await createSupabaseAdmin()
    .from("portal_connections")
    .select("refresh_token_enc, revoked_at, connected_at, test_mode, last_error")
    .eq("agency_id", agencyId)
    .eq("portal", PORTAL)
    .maybeSingle();
  if (error) return { polaczone: false, test: false, od: null, blad: null, tabele: false };
  return {
    polaczone: Boolean(data?.refresh_token_enc && !data.revoked_at),
    test: Boolean(data?.test_mode),
    od: (data?.connected_at as string) ?? null,
    blad: (data?.last_error as string) ?? null,
    tabele: true,
  };
}

async function waznyToken(agencyId: string): Promise<string> {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("portal_connections")
    .select("access_token_enc, refresh_token_enc, expires_at, revoked_at")
    .eq("agency_id", agencyId)
    .eq("portal", PORTAL)
    .maybeSingle();
  if (!data?.refresh_token_enc || data.revoked_at) throw new BladOtodom("Biuro nie jest połączone z Otodom. Połącz konto w Ustawieniach → Portale ogłoszeniowe.", 0);
  if (data.access_token_enc && data.expires_at && new Date(data.expires_at as string).getTime() > Date.now()) {
    return odszyfruj(data.access_token_enc as string);
  }
  try {
    const t = await zadanieTokenu({ grant_type: "refresh_token", refresh_token: odszyfruj(data.refresh_token_enc as string) });
    await zapiszTokeny(agencyId, t);
    return t.access_token;
  } catch (e) {
    // Odświeżenie odrzucone: biuro cofnęło dostęp albo token wygasł na dobre.
    await admin
      .from("portal_connections")
      .update({ revoked_at: new Date().toISOString(), last_error: `Połączenie wygasło: ${e instanceof Error ? e.message : "błąd"}` })
      .eq("agency_id", agencyId)
      .eq("portal", PORTAL);
    throw new BladOtodom("Połączenie z Otodom wygasło albo zostało cofnięte. Połącz konto ponownie w Ustawieniach → Portale.", 401);
  }
}

export class BladOtodom extends Error {
  constructor(
    message: string,
    public status: number,
    public szczegoly?: unknown,
  ) {
    super(message);
  }
}

/** Wywołanie API w imieniu biura. Przy 401/403 raz odświeżamy token i ponawiamy. */
export async function wywolaj<T = Record<string, unknown>>(agencyId: string, metoda: "GET" | "POST" | "PUT" | "DELETE", sciezka: string, body?: unknown): Promise<T> {
  for (let proba = 0; proba < 2; proba++) {
    const token = await waznyToken(agencyId);
    const r = await fetch(`${API}${sciezka}`, {
      method: metoda,
      headers: { ...naglowkiPodstawowe(), Authorization: `Bearer ${token}` },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(20000),
    });
    if ((r.status === 401 || r.status === 403) && proba === 0) {
      await createSupabaseAdmin().from("portal_connections").update({ expires_at: new Date(0).toISOString() }).eq("agency_id", agencyId).eq("portal", PORTAL);
      continue;
    }
    const tekst = await r.text();
    let d: unknown = {};
    try {
      d = tekst ? JSON.parse(tekst) : {};
    } catch {
      d = { message: tekst.slice(0, 300) };
    }
    if (!r.ok) {
      const m = d as { message?: string; error?: string; detail?: string; errors?: unknown };
      throw new BladOtodom(m.message || m.detail || m.error || `Otodom odpowiedział ${r.status}`, r.status, d);
    }
    return d as T;
  }
  throw new BladOtodom("Otodom odrzucił autoryzację.", 401);
}

/* ───────────── słownik lokalizacji ───────────── */

type Miejscowosc = { id: number; name: string; region?: { name?: string } };

const pamiecMiast = new Map<string, number | null>();

/**
 * ID miejscowości ze słownika Otodom. Otodom wymaga city_id obok współrzędnych.
 * Szukamy po nazwie z adresu oferty i bierzemy dokładne trafienie.
 */
export async function idMiasta(agencyId: string, miasto: string): Promise<number | null> {
  const nazwa = miasto.trim();
  if (!nazwa) return null;
  const klucz = nazwa.toLowerCase();
  if (pamiecMiast.has(klucz)) return pamiecMiast.get(klucz)!;
  const q = new URLSearchParams({ search: nazwa, exact: "true", limit: "10" });
  const d = await wywolaj<{ data?: Miejscowosc[] } | Miejscowosc[]>(agencyId, "GET", `/locations/v1/urn:site:otodompl/cities?${q}`).catch(() => null);
  const lista = (Array.isArray(d) ? d : d?.data) ?? [];
  const traf = lista.find((m) => m.name?.toLowerCase() === klucz) ?? lista[0];
  const id = traf?.id ?? null;
  pamiecMiast.set(klucz, id);
  return id;
}
