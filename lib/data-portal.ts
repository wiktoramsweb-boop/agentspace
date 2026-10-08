import { createSupabaseAdmin } from "./supabase/admin";
import { todayPL, addDaysKey } from "./datetime";
import {
  osCzasuDlaKlienta,
  podsumowanieDlaKlienta,
  poprawnyToken,
  stanDostepu,
  type RodzajDostepu,
  type ZdarzenieAgenta,
} from "./portal-klienta";

/**
 * Dane portalu klienta.
 *
 * Każde zapytanie startuje od tokenu i NIGDY nie przyjmuje id biura ani
 * klienta z adresu. Dzięki temu nie da się podmienić parametru i zajrzeć
 * do cudzej nieruchomości: zakres wynika z tego, co wisi przy tokenie.
 */

export type DostepKlienta = {
  id: string;
  agency_id: string;
  client_id: string;
  rodzaj: RodzajDostepu;
  expires_at: string | null;
  revoked_at: string | null;
};

export type NieruchomoscKlienta = {
  id: string;
  title: string;
  city: string | null;
  address: string | null;
  price_pln: number | null;
  area_m2: number | null;
  rooms: number | null;
  status: string;
  deal_kind: string;
  zdjecie: string | null;
};

/** Dostęp po tokenie. Zwraca null, gdy token jest zły, odwołany albo wygasł. */
export async function dostepPoTokenie(token: string): Promise<DostepKlienta | null> {
  if (!poprawnyToken(token)) return null;

  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("client_portal_access")
    .select("id, agency_id, client_id, rodzaj, expires_at, revoked_at")
    .eq("token", token)
    .maybeSingle();

  if (!stanDostepu(data, todayPL()).aktywny) return null;

  // Ślad ostatniego wejścia: agent widzi, czy klient w ogóle zagląda.
  void admin
    .from("client_portal_access")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", (data as DostepKlienta).id);

  return data as DostepKlienta;
}

/**
 * Pierwsze zdjęcie oferty, do kafelka.
 * Zdjęcia siedzą w kolumnie JSON na nieruchomości, nie w osobnej tabeli.
 */
function pierwszeZdjecie(photos: unknown): string | null {
  if (!Array.isArray(photos)) return null;
  const p = photos.find((x) => x && typeof (x as { url?: string }).url === "string");
  return (p as { url?: string } | undefined)?.url ?? null;
}

/** Nieruchomości, które widzi sprzedający. */
export async function nieruchomosciKlienta(d: DostepKlienta): Promise<NieruchomoscKlienta[]> {
  const admin = createSupabaseAdmin();
  const { data: przypisane } = await admin
    .from("client_portal_properties")
    .select("property_id")
    .eq("access_id", d.id);

  const ids = (przypisane ?? []).map((r) => r.property_id as string);
  if (ids.length === 0) return [];

  const { data } = await admin
    .from("properties")
    .select("id, title, city, address, price_pln, area_m2, rooms, status, deal_kind, photos")
    .in("id", ids)
    // Warunek na biuro mimo że id pochodzą z przypisania: gdyby ktoś kiedyś
    // wstawił tam obce id, nie wyjdzie poza swoje biuro.
    .eq("agency_id", d.agency_id);

  return ((data ?? []) as (Omit<NieruchomoscKlienta, "zdjecie"> & { photos?: unknown })[]).map((p) => ({
    ...p,
    zdjecie: pierwszeZdjecie(p.photos),
  }));
}

/** Oś czasu i liczby dla jednej nieruchomości. */
export async function procesNieruchomosci(d: DostepKlienta, propertyId: string) {
  const admin = createSupabaseAdmin();

  // Sprawdzenie, czy ta nieruchomość w ogóle należy do tego dostępu.
  const { data: ma } = await admin
    .from("client_portal_properties")
    .select("property_id")
    .eq("access_id", d.id)
    .eq("property_id", propertyId)
    .maybeSingle();
  if (!ma) return null;

  const { data: nieruchomosc } = await admin
    .from("properties")
    .select("id, title, city, address, price_pln, area_m2, rooms, status, deal_kind, photos")
    .eq("id", propertyId)
    .eq("agency_id", d.agency_id)
    .maybeSingle();
  if (!nieruchomosc) return null;

  const { data: zdarzenia } = await admin
    .from("activities")
    .select("id, kind, client_note, client_visible, status, due_at, completed_at")
    .eq("agency_id", d.agency_id)
    .eq("property_id", propertyId)
    .order("due_at", { ascending: false })
    .limit(300);

  const lista = (zdarzenia ?? []) as ZdarzenieAgenta[];
  const dzis = todayPL();

  return {
    nieruchomosc: {
      ...nieruchomosc,
      zdjecie: pierwszeZdjecie((nieruchomosc as { photos?: unknown }).photos),
    } as NieruchomoscKlienta,
    osCzasu: osCzasuDlaKlienta(lista),
    podsumowanie: podsumowanieDlaKlienta(lista, dzis, addDaysKey(dzis, -7)),
  };
}

/* ─────────────── Kupujący ─────────────── */

export type OfertaDlaKupujacego = NieruchomoscKlienta & {
  description: string | null;
  reakcja: "lubi" | "nie_lubi" | null;
};

/**
 * Oferty podesłane kupującemu.
 *
 * Źródłem są dopasowania ze statusem „wysłane" - czyli to, co agent
 * świadomie wypuścił. Dopasowania o statusie „nowe" są wewnętrzną
 * propozycją systemu i klienta nie dotyczą.
 */
export async function ofertyKupujacego(d: DostepKlienta): Promise<OfertaDlaKupujacego[]> {
  const admin = createSupabaseAdmin();

  const { data: poszukiwania } = await admin
    .from("searches")
    .select("id")
    .eq("agency_id", d.agency_id)
    .eq("client_id", d.client_id);

  const searchIds = (poszukiwania ?? []).map((s) => s.id as string);
  if (searchIds.length === 0) return [];

  const { data: dopasowania } = await admin
    .from("search_matches")
    .select("property_id, status")
    .in("search_id", searchIds)
    .in("status", ["wyslane", "zainteresowany", "odrzucone"]);

  const ids = [...new Set((dopasowania ?? []).map((m) => m.property_id as string))];
  if (ids.length === 0) return [];

  const [{ data: oferty }, { data: reakcje }] = await Promise.all([
    admin
      .from("properties")
      .select("id, title, city, address, price_pln, area_m2, rooms, status, deal_kind, description, photos")
      .in("id", ids)
      .eq("agency_id", d.agency_id),
    admin.from("client_offer_feedback").select("property_id, reakcja").eq("access_id", d.id),
  ]);

  const mojeReakcje = new Map(
    ((reakcje ?? []) as { property_id: string; reakcja: string }[]).map((r) => [r.property_id, r.reakcja]),
  );
  return ((oferty ?? []) as (Omit<OfertaDlaKupujacego, "zdjecie" | "reakcja"> & {
    photos?: unknown;
  })[]).map((p) => ({
    ...p,
    zdjecie: pierwszeZdjecie(p.photos),
    reakcja: (mojeReakcje.get(p.id) as "lubi" | "nie_lubi" | undefined) ?? null,
  }));
}

/** Terminy, w których kupujący może oglądać. */
export async function dostepnoscKupujacego(d: DostepKlienta) {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("client_availability")
    .select("id, dzien, od, do_godz")
    .eq("access_id", d.id)
    .gte("dzien", todayPL())
    .order("dzien", { ascending: true });
  return (data ?? []) as { id: string; dzien: string; od: string; do_godz: string }[];
}
