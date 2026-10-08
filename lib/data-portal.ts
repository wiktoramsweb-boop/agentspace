import { createSupabaseAdmin } from "./supabase/admin";
import { publicAssetUrl } from "./storage";
import { todayPL, addDaysKey } from "./datetime";
import {
  osCzasuDlaKlienta,
  podsumowanieDlaKlienta,
  poprawnyToken,
  stanDostepu,
  zdarzenieDlaKlienta,
  type RodzajDostepu,
  type StatusPropozycji,
  type ZdarzenieAgenta,
  type ZdarzenieKlienta,
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
  process_stage?: string | null;
  zdjecie: string | null;
};

/** Pola nieruchomości, które wolno pokazać klientowi. Lista zamknięta. */
const POLA_NIERUCHOMOSCI =
  "id, title, city, address, price_pln, area_m2, rooms, status, deal_kind, process_stage, photos";

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
  return wszystkieZdjecia(photos)[0] ?? null;
}

/** Cała galeria. Bierzemy wyłącznie adresy, bez opisów i metadanych. */
export function wszystkieZdjecia(photos: unknown): string[] {
  if (!Array.isArray(photos)) return [];
  return photos
    .map((x) => (x && typeof (x as { url?: string }).url === "string" ? (x as { url: string }).url : null))
    .filter((u): u is string => Boolean(u));
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
    .select(POLA_NIERUCHOMOSCI)
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
    .select(POLA_NIERUCHOMOSCI)
    .eq("id", propertyId)
    .eq("agency_id", d.agency_id)
    .maybeSingle();
  if (!nieruchomosc) return null;

  const { data: zdarzenia } = await admin
    .from("activities")
    .select("id, kind, purpose, client_note, client_visible, status, due_at, completed_at")
    .eq("agency_id", d.agency_id)
    .eq("property_id", propertyId)
    .order("due_at", { ascending: false })
    .limit(300);

  const lista = (zdarzenia ?? []) as ZdarzenieAgenta[];
  const dzis = todayPL();

  const propozycje = await propozycjeCeny(d, propertyId);

  return {
    nieruchomosc: {
      ...nieruchomosc,
      zdjecie: pierwszeZdjecie((nieruchomosc as { photos?: unknown }).photos),
    } as NieruchomoscKlienta,
    zdjecia: wszystkieZdjecia((nieruchomosc as { photos?: unknown }).photos),
    osCzasu: osCzasuDlaKlienta(lista),
    podsumowanie: podsumowanieDlaKlienta(lista, dzis, addDaysKey(dzis, -7)),
    propozycje: propozycje.lista,
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
      .select(`${POLA_NIERUCHOMOSCI}, description, property_type, floor, year_built`)
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

/* ─────────────── Marka biura ─────────────── */

export type BrandingBiura = {
  nazwa: string;
  logoUrl: string | null;
  telefon: string | null;
  email: string | null;
  www: string | null;
  /** Pierwsza litera do ikony na ekranie telefonu. */
  inicjal: string;
};

/**
 * Nazwa i logo biura, którym podpisany jest portal.
 *
 * Klient podpisał umowę ze swoim biurem, nie z AgentSpace, więc aplikacja na
 * jego telefonie ma się nazywać tak, jak biuro. Nazwa AgentSpace nie pada
 * w portalu ani razu.
 */
export async function brandingBiura(agencyId: string): Promise<BrandingBiura> {
  const admin = createSupabaseAdmin();
  const [{ data: agencja }, { data: ust }] = await Promise.all([
    admin.from("agencies").select("name").eq("id", agencyId).maybeSingle(),
    admin.from("agency_settings").select("company, logo_path").eq("agency_id", agencyId).maybeSingle(),
  ]);

  const firma = ((ust?.company ?? {}) as Record<string, string | undefined>) ?? {};
  const nazwa = (firma.name || (agencja?.name as string | undefined) || "Twoje biuro").trim();

  return {
    nazwa,
    logoUrl: ust?.logo_path ? publicAssetUrl("agency-assets", ust.logo_path as string) : null,
    telefon: firma.phone?.trim() || null,
    email: firma.email?.trim() || null,
    www: firma.www?.trim() || null,
    inicjal: nazwa.charAt(0).toUpperCase() || "B",
  };
}

/** Agent prowadzący sprawę: klient ma wiedzieć, do kogo dzwonić. */
export async function opiekunKlienta(d: DostepKlienta): Promise<{ imie: string; telefon: string | null } | null> {
  const admin = createSupabaseAdmin();
  const { data: klient } = await admin
    .from("clients")
    .select("agent_id")
    .eq("id", d.client_id)
    .eq("agency_id", d.agency_id)
    .maybeSingle();
  if (!klient?.agent_id) return null;

  const { data: profil } = await admin
    .from("profiles")
    .select("full_name, phone")
    .eq("id", klient.agent_id)
    .maybeSingle();
  if (!profil) return null;

  return { imie: (profil.full_name as string | null) ?? "Twój agent", telefon: (profil.phone as string | null) ?? null };
}

/* ─────────────── Kalendarz ─────────────── */

export type WpisKalendarza = ZdarzenieKlienta & { nieruchomosc: string; propertyId: string };

/**
 * Wszystkie udostępnione zdarzenia ze wszystkich nieruchomości klienta.
 *
 * Jedno zapytanie po całym zbiorze zamiast pętli po nieruchomościach: kalendarz
 * otwiera się przy każdym przesunięciu miesiąca, więc nie może robić N zapytań.
 */
export async function kalendarzKlienta(d: DostepKlienta): Promise<WpisKalendarza[]> {
  const lista = await nieruchomosciKlienta(d);
  if (lista.length === 0) return [];
  const nazwy = new Map(lista.map((n) => [n.id, n.title]));

  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("activities")
    .select("id, kind, purpose, client_note, client_visible, status, due_at, completed_at, property_id")
    .eq("agency_id", d.agency_id)
    .in("property_id", [...nazwy.keys()])
    .order("due_at", { ascending: true })
    .limit(500);

  const wpisy: WpisKalendarza[] = [];
  for (const row of (data ?? []) as (ZdarzenieAgenta & { property_id: string })[]) {
    const z = zdarzenieDlaKlienta(row);
    if (!z || !z.kiedy) continue;
    wpisy.push({ ...z, propertyId: row.property_id, nieruchomosc: nazwy.get(row.property_id) ?? "" });
  }
  return wpisy.sort((a, b) => String(a.kiedy).localeCompare(String(b.kiedy)));
}

/* ─────────────── Wiadomości ─────────────── */

export type WiadomoscPortalu = {
  id: string;
  autor: "klient" | "agent";
  tresc: string;
  created_at: string;
};

export async function wiadomosciKlienta(d: DostepKlienta): Promise<{ ready: boolean; lista: WiadomoscPortalu[] }> {
  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("client_portal_messages")
    .select("id, autor, tresc, created_at")
    .eq("access_id", d.id)
    .order("created_at", { ascending: true })
    .limit(200);

  // Brak tabeli = migracja v47 nieuruchomiona. Portal ma wtedy działać dalej,
  // tylko bez tej jednej zakładki.
  if (error) return { ready: false, lista: [] };
  return { ready: true, lista: (data ?? []) as WiadomoscPortalu[] };
}

/* ─────────────── Propozycje zmiany ceny ─────────────── */

export type PropozycjaCeny = {
  id: string;
  property_id: string;
  cena_obecna: number | null;
  cena_proponowana: number;
  uzasadnienie: string | null;
  status: StatusPropozycji;
  created_at: string;
  decided_at: string | null;
};

export async function propozycjeCeny(
  d: DostepKlienta,
  propertyId?: string,
): Promise<{ ready: boolean; lista: PropozycjaCeny[] }> {
  const admin = createSupabaseAdmin();
  let q = admin
    .from("client_price_proposals")
    .select("id, property_id, cena_obecna, cena_proponowana, uzasadnienie, status, created_at, decided_at")
    .eq("access_id", d.id)
    .order("created_at", { ascending: false });
  if (propertyId) q = q.eq("property_id", propertyId);

  const { data, error } = await q;
  if (error) return { ready: false, lista: [] };
  return { ready: true, lista: (data ?? []) as PropozycjaCeny[] };
}

/* ─────────────── Pojedyncza oferta kupującego ─────────────── */

export type SzczegolyOferty = OfertaDlaKupujacego & {
  zdjecia: string[];
  property_type?: string | null;
  floor?: number | null;
  year_built?: number | null;
};

/**
 * Jedna oferta w pełnej wersji.
 *
 * Zaczynamy od listy ofert tego klienta, a nie od zapytania po id - dzięki
 * temu podmiana identyfikatora w adresie nie otworzy cudzej oferty.
 */
export async function ofertaDlaKupujacego(d: DostepKlienta, propertyId: string): Promise<SzczegolyOferty | null> {
  const oferty = await ofertyKupujacego(d);
  const moja = oferty.find((o) => o.id === propertyId);
  if (!moja) return null;

  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("properties")
    .select("photos, property_type, floor, year_built")
    .eq("id", propertyId)
    .eq("agency_id", d.agency_id)
    .maybeSingle();

  return {
    ...moja,
    zdjecia: wszystkieZdjecia((data as { photos?: unknown } | null)?.photos),
    property_type: (data as { property_type?: string | null } | null)?.property_type ?? null,
    floor: (data as { floor?: number | null } | null)?.floor ?? null,
    year_built: (data as { year_built?: number | null } | null)?.year_built ?? null,
  };
}
