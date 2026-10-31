import { createSupabaseAdmin } from "./supabase/admin";
import { konfiguracja, najemWMiesiacu, rozliczMiesiac, type Konfig, type Najem, type Naliczenie, type Rozliczenie, type Wplata } from "./najem-model";
import { todayPL } from "./datetime";

/** Dane modułu najmu. Wszystko odczytywane po biurze osoby: moduł pilnuje `requireModul("najem")`. */

export type Lokal = {
  id: string;
  adres: string;
  miasto: string | null;
  lat: number | null;
  lng: number | null;
  pow: number | null;
  pokoje: number | null;
  kw: string | null;
  etap: string;
  typ_najmu: string;
  model: string;
  prowizja_pct: number | null;
  parking_w_podstawie: boolean;
  oplata_startowa: number | null;
  czynsz_oczekiwany: number | null;
  czynsz_min: number | null;
  limit_napraw: number | null;
  oplaty_admin: number | null;
  umowa_od: string | null;
  ankieta: Record<string, string>;
  liczniki: Record<string, string>;
  kroki: Record<string, boolean>;
  notatka: string | null;
  kanban_pos: number | null;
  opiekun_id: string | null;
  updated_at: string;
};

export type NajemPelny = Najem & { kaucja_stan: string; dzien_platnosci: number; us_zgloszono: string | null };
export type Strona = { id: string; rola: string; nazwa: string; telefon: string | null; email: string | null; uwagi: string | null };
export type Zdarzenie = { id: string; rodzaj: string; tytul: string; stan: string; koszt: number | null; termin: string | null; created_at: string; zgoda?: string; od_wlasciciela?: boolean };
export type WplataPelna = Wplata & { koszty_opis: string | null; przekazano: string | null; opublikowano?: string | null };
export type Oplata = Naliczenie & { id: string; odczyt: number | null; opis: string | null };

const liczby = <T extends Record<string, unknown>>(w: T, pola: (keyof T)[]): T => {
  const k = { ...w };
  for (const p of pola) if (k[p] != null) (k as Record<string, unknown>)[p as string] = Number(k[p]);
  return k;
};
const POLA_NAJMU: (keyof NajemPelny)[] = ["czynsz", "parking", "oplaty", "kaucja"];
const POLA_WPLATY: (keyof WplataPelna)[] = ["czynsz", "oplaty", "koszty"];

export async function konfigBiura(agencyId: string | null): Promise<Konfig> {
  const { data } = await createSupabaseAdmin().from("rental_settings").select("config").eq("agency_id", agencyId ?? "").maybeSingle();
  return konfiguracja(agencyId, (data?.config ?? null) as Partial<Konfig> | null);
}

export const warunki = (l: Pick<Lokal, "model" | "prowizja_pct" | "parking_w_podstawie">, k: Konfig) => ({ model: l.model, prowizjaPct: l.prowizja_pct != null ? Number(l.prowizja_pct) : k.prowizjaPct, parkingWPodstawie: l.parking_w_podstawie });

export type LokalNaLiscie = Lokal & { najem: NajemPelny | null; najemcy: string[]; wlasciciel: string | null; wplaty: WplataPelna[]; najmy: NajemPelny[]; oplaty: Oplata[] };

/** `null`: brak migracji v60. */
export async function lokaleBiura(agencyId: string | null, odMiesiaca: string): Promise<LokalNaLiscie[] | null> {
  if (!agencyId) return [];
  const admin = createSupabaseAdmin();
  const { data, error } = await admin.from("rental_units").select("*").eq("agency_id", agencyId).order("updated_at", { ascending: false }).limit(1000);
  if (error) return null;
  const [t, s, p, o] = await Promise.all([
    admin.from("rental_tenancies").select("*").eq("agency_id", agencyId),
    admin.from("rental_parties").select("unit_id, rola, nazwa").eq("agency_id", agencyId),
    admin.from("rental_payments").select("*").eq("agency_id", agencyId).gte("miesiac", odMiesiaca),
    admin.from("rental_charges").select("*").eq("agency_id", agencyId).gte("miesiac", odMiesiaca),
  ]);
  const oplaty = ((o.data ?? []) as (Oplata & { unit_id: string })[]).map((x) => ({ ...x, kwota: Number(x.kwota) }));
  const najmy = ((t.data ?? []) as (NajemPelny & { unit_id: string })[]).map((n) => liczby(n, POLA_NAJMU));
  const strony = (s.data ?? []) as { unit_id: string; rola: string; nazwa: string }[];
  const wplaty = ((p.data ?? []) as (WplataPelna & { unit_id: string })[]).map((w) => liczby(w, POLA_WPLATY));
  return ((data ?? []) as Lokal[]).map((l) => {
    const moje = najmy.filter((n) => n.unit_id === l.id);
    return {
      ...l,
      ankieta: l.ankieta ?? {},
      kroki: l.kroki ?? {},
      liczniki: l.liczniki ?? {},
      najmy: moje,
      najem: moje.find((n) => n.aktywny) ?? null,
      najemcy: strony.filter((x) => x.unit_id === l.id && (x.rola === "najemca" || x.rola === "wspolnajemca")).map((x) => x.nazwa),
      wlasciciel: strony.find((x) => x.unit_id === l.id && x.rola === "wlasciciel")?.nazwa ?? null,
      wplaty: wplaty.filter((w) => w.unit_id === l.id),
      oplaty: oplaty.filter((x) => x.unit_id === l.id),
    };
  });
}

export function rozliczLokal(l: LokalNaLiscie, miesiac: string, k: Konfig): Rozliczenie {
  const najem = l.najmy.find((n) => najemWMiesiacu(n, miesiac)) ?? null;
  return rozliczMiesiac(miesiac, najem, l.wplaty.find((w) => w.miesiac === miesiac) ?? null, warunki(l, k), l.oplaty);
}

export async function kartaLokalu(agencyId: string, id: string) {
  const admin = createSupabaseAdmin();
  const { data: l } = await admin.from("rental_units").select("*").eq("id", id).eq("agency_id", agencyId).maybeSingle();
  if (!l) return null;
  const [t, s, p, z, o, d] = await Promise.all([
    admin.from("rental_tenancies").select("*").eq("unit_id", id).order("od", { ascending: false }),
    admin.from("rental_parties").select("id, rola, nazwa, telefon, email, uwagi").eq("unit_id", id).order("created_at"),
    admin.from("rental_payments").select("*").eq("unit_id", id).order("miesiac", { ascending: false }),
    admin.from("rental_events").select("*").eq("unit_id", id).order("created_at", { ascending: false }).limit(100),
    admin.from("rental_charges").select("*").eq("unit_id", id).order("miesiac", { ascending: false }).limit(600),
    admin.from("rental_owner_access").select("id, token, nazwa, unit_ids, last_seen_at, revoked_at").eq("agency_id", agencyId).contains("unit_ids", [id]).is("revoked_at", null).maybeSingle(),
  ]);
  return {
    lokal: { ...(l as Lokal), ankieta: l.ankieta ?? {}, kroki: l.kroki ?? {}, liczniki: l.liczniki ?? {} },
    najmy: ((t.data ?? []) as NajemPelny[]).map((n) => liczby(n, POLA_NAJMU)),
    strony: (s.data ?? []) as Strona[],
    wplaty: ((p.data ?? []) as WplataPelna[]).map((w) => liczby(w, POLA_WPLATY)),
    zdarzenia: (z.data ?? []) as Zdarzenie[],
    oplaty: ((o.data ?? []) as Oplata[]).map((x) => ({ ...x, kwota: Number(x.kwota), odczyt: x.odczyt != null ? Number(x.odczyt) : null })),
    portal: { gotowy: !d.error && !o.error, dostep: (d.data ?? null) as { id: string; token: string; nazwa: string; unit_ids: string[]; last_seen_at: string | null } | null },
  };
}

export type Alert = { tekst: string; href: string; pilne: boolean };

/** Co wymaga działania: kończące się umowy, zaległości i terminy z urzędem. */
export function alertyNajmu(lokale: LokalNaLiscie[], k: Konfig): Alert[] {
  const dzis = todayPL();
  const miesiac = dzis.slice(0, 7);
  const dzien = Number(dzis.slice(8, 10));
  const wyniki: Alert[] = [];
  const dniDo = (d: string) => Math.round((Date.parse(d) - Date.parse(dzis)) / 86_400_000);
  for (const l of lokale) {
    const n = l.najem;
    if (!n) continue;
    const href = `/app/najem/${l.id}`;
    if (n.do_dnia) {
      const d = dniDo(n.do_dnia);
      if (d < 0) wyniki.push({ tekst: `${l.adres}: umowa najmu wygasła ${-d} dni temu`, href, pilne: true });
      else if (d <= 60) wyniki.push({ tekst: `${l.adres}: umowa kończy się za ${d} dni`, href, pilne: d <= 14 });
    }
    if (n.forma === "okazjonalny" && !n.us_zgloszono) {
      const d = 14 - -dniDo(n.od);
      wyniki.push({ tekst: d >= 0 ? `${l.adres}: zgłoś najem do urzędu skarbowego, zostało ${d} dni` : `${l.adres}: minął termin zgłoszenia najmu do urzędu skarbowego`, href, pilne: true });
    }
    const r = rozliczLokal(l, miesiac, k);
    if (r.zaleglosc > 0 && dzien > n.dzien_platnosci) wyniki.push({ tekst: `${l.adres}: brakuje ${r.zaleglosc.toLocaleString("pl-PL")} zł za ten miesiąc`, href, pilne: true });
  }
  return wyniki.sort((a, b) => Number(b.pilne) - Number(a.pilne));
}
