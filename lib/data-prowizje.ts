import { createSupabaseAdmin } from "./supabase/admin";
import { adresZMiastem } from "./adres";
import { todayPL } from "./datetime";
import type { Deal } from "./types";

/**
 * Dane zakładki Prowizje dla jednej osoby: jej transakcje z ofertą i klientem,
 * oferty i klienci do szybkiego wyboru oraz podpowiedzi, co warto zrobić.
 */

export type TransakcjaWidok = Deal & {
  oferta: { id: string; adres: string; lat: number | null; lng: number | null; rodzaj: string } | null;
  klient: { id: string; nazwa: string } | null;
};

export type OfertaWybor = {
  id: string;
  tytul: string;
  adres: string;
  cena: number | null;
  rodzaj: "sprzedaz" | "wynajem";
  wlascicielId: string | null;
  etap: string | null;
  maTransakcje: boolean;
};

export type KlientWybor = { id: string; nazwa: string; typ: string; status: string };

export type Podpowiedz = {
  id: string;
  rodzaj: "oferta" | "klient" | "termin" | "brak_daty";
  tytul: string;
  opis: string;
  ofertaId?: string;
  klientId?: string;
  transakcjaId?: string;
};

const ETAPY_PRZED_TRANSAKCJA = new Set(["zlozona_oferta", "oplata_rezerwacyjna", "umowa_przedwstepna", "wygrana"]);
const ETYKIETY_ETAPU: Record<string, string> = {
  zlozona_oferta: "złożona oferta",
  oplata_rezerwacyjna: "opłata rezerwacyjna",
  umowa_przedwstepna: "umowa przedwstępna",
  wygrana: "transakcja wygrana",
};

export async function daneProwizji(userId: string, agencyId: string | null) {
  const admin = createSupabaseAdmin();
  const [{ data: deals }, { data: oferty }, { data: klienci }] = await Promise.all([
    admin.from("deals").select("*").eq("agent_id", userId).order("created_at", { ascending: false }).limit(300),
    admin
      .from("properties")
      .select("id, title, address, city, price_pln, deal_kind, owner_client_id, process_stage, status, lat, lng")
      .eq("agent_id", userId)
      .order("updated_at", { ascending: false })
      .limit(400),
    agencyId
      ? admin.from("clients").select("id, name, type, status").eq("agent_id", userId).order("updated_at", { ascending: false }).limit(600)
      : Promise.resolve({ data: [] as { id: string; name: string; type: string; status: string }[] }),
  ]);

  const listaOfert = oferty ?? [];
  const listaKlientow = klienci ?? [];
  const ofertaPoId = new Map(listaOfert.map((o) => [o.id as string, o]));
  const klientPoId = new Map(listaKlientow.map((k) => [k.id as string, k]));

  // Transakcje mogą dotyczyć ofert i klientów spoza listy tej osoby (np. przepisanych).
  const brakOfert = [...new Set((deals ?? []).map((d) => d.property_id).filter((x): x is string => !!x && !ofertaPoId.has(x)))];
  const brakKlientow = [...new Set((deals ?? []).map((d) => d.client_id).filter((x): x is string => !!x && !klientPoId.has(x)))];
  const [{ data: dodatkoweOferty }, { data: dodatkowiKlienci }] = await Promise.all([
    brakOfert.length
      ? admin.from("properties").select("id, title, address, city, price_pln, deal_kind, owner_client_id, process_stage, status, lat, lng").in("id", brakOfert)
      : Promise.resolve({ data: [] as typeof listaOfert }),
    brakKlientow.length
      ? admin.from("clients").select("id, name, type, status").in("id", brakKlientow)
      : Promise.resolve({ data: [] as typeof listaKlientow }),
  ]);
  for (const o of dodatkoweOferty ?? []) ofertaPoId.set(o.id as string, o);
  for (const k of dodatkowiKlienci ?? []) klientPoId.set(k.id as string, k);

  const transakcje: TransakcjaWidok[] = ((deals ?? []) as Deal[]).map((d) => {
    const o = d.property_id ? ofertaPoId.get(d.property_id) : undefined;
    const k = d.client_id ? klientPoId.get(d.client_id) : undefined;
    return {
      ...d,
      oferta: o
        ? { id: o.id, adres: adresZMiastem(o.address, o.city) || o.title, lat: o.lat ?? null, lng: o.lng ?? null, rodzaj: o.deal_kind }
        : null,
      klient: k ? { id: k.id, nazwa: k.name } : null,
    };
  });

  const zTransakcja = new Set(transakcje.map((t) => t.property_id).filter(Boolean));
  const klienciZTransakcja = new Set(transakcje.map((t) => t.client_id).filter(Boolean));

  const ofertyWybor: OfertaWybor[] = listaOfert
    .filter((o) => o.status !== "archiwum")
    .map((o) => ({
      id: o.id,
      tytul: o.title,
      adres: adresZMiastem(o.address, o.city) || o.title,
      cena: o.price_pln ?? null,
      rodzaj: o.deal_kind === "wynajem" ? "wynajem" : "sprzedaz",
      wlascicielId: o.owner_client_id ?? null,
      etap: o.process_stage ?? null,
      maTransakcje: zTransakcja.has(o.id),
    }));

  const klienciWybor: KlientWybor[] = listaKlientow.map((k) => ({ id: k.id, nazwa: k.name, typ: k.type, status: k.status }));

  // ── Podpowiedzi ──
  const dzis = todayPL();
  const podpowiedzi: Podpowiedz[] = [];
  for (const o of ofertyWybor) {
    if (o.maTransakcje || !o.etap || !ETAPY_PRZED_TRANSAKCJA.has(o.etap)) continue;
    podpowiedzi.push({
      id: `o-${o.id}`,
      rodzaj: "oferta",
      tytul: `${o.adres}: ${ETYKIETY_ETAPU[o.etap]}`,
      opis: "Oferta jest blisko finału, a nie ma jeszcze transakcji. Załóż ją, żeby prowizja liczyła się do prognozy.",
      ofertaId: o.id,
      klientId: o.wlascicielId ?? undefined,
    });
  }
  for (const k of klienciWybor) {
    if (k.status !== "negocjacje" || klienciZTransakcja.has(k.id)) continue;
    podpowiedzi.push({
      id: `k-${k.id}`,
      rodzaj: "klient",
      tytul: `${k.nazwa} negocjuje`,
      opis: "Klient jest na etapie negocjacji. Dodaj transakcję, żeby widzieć, ile może Ci dać.",
      klientId: k.id,
    });
  }
  for (const t of transakcje) {
    if (t.status !== "w_toku") continue;
    if (t.expected_close && t.expected_close < dzis) {
      podpowiedzi.push({
        id: `t-${t.id}`,
        rodzaj: "termin",
        tytul: `${t.title}: minął planowany termin`,
        opis: "Zamknij transakcję albo przesuń datę w karcie, żeby prognoza się zgadzała.",
        transakcjaId: t.id,
      });
    } else if (!t.expected_close) {
      podpowiedzi.push({
        id: `d-${t.id}`,
        rodzaj: "brak_daty",
        tytul: `${t.title}: brak planowanej daty`,
        opis: "Bez daty transakcja nie wchodzi do prognozy kwartału.",
        transakcjaId: t.id,
      });
    }
  }

  return { transakcje, ofertyWybor, klienciWybor, podpowiedzi: podpowiedzi.slice(0, 8) };
}
