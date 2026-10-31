import { createSupabaseAdmin } from "./supabase/admin";
import { powiadom } from "./powiadomienia";
import { konfigBiura, warunki, type Lokal, type NajemPelny, type Oplata, type WplataPelna } from "./data-najem";
import { najemWMiesiacu, rozliczMiesiac, type Rozliczenie } from "./najem-model";

/**
 * Portal właściciela. Dostęp daje losowy token z adresu, bez konta.
 * Do widoku idą wyłącznie pola z białej listy: bez PESEL-i, wewnętrznych
 * notatek biura i danych kontaktowych najemcy.
 */

export type DostepWlasciciela = { id: string; agency_id: string; nazwa: string; unit_ids: string[] };

export async function dostepWlasciciela(token: string): Promise<DostepWlasciciela | null> {
  if (!/^[A-Za-z0-9_-]{24,64}$/.test(token)) return null;
  const admin = createSupabaseAdmin();
  const { data } = await admin.from("rental_owner_access").select("id, agency_id, nazwa, unit_ids, revoked_at").eq("token", token).maybeSingle();
  if (!data || data.revoked_at) return null;
  await admin.from("rental_owner_access").update({ last_seen_at: new Date().toISOString() }).eq("id", data.id);
  return data as DostepWlasciciela;
}

export type MiesiacWlasciciela = { lokal: string; lokalId: string; r: Rozliczenie; czynsz: number; oplatyWplata: number; koszty: number; kosztyOpis: string | null; pozycje: Oplata[]; kaucja: number; model: string; prowizjaPct: number; przekazano: string | null };

export type LokalWlasciciela = {
  id: string;
  adres: string;
  pow: number | null;
  pokoje: number | null;
  etap: string;
  limit_napraw: number | null;
  najem: { forma: string; od: string; do_dnia: string | null; czynsz: number; oplaty: number; kaucja: number; parking: number } | null;
  najemca: string | null;
  miesiace: MiesiacWlasciciela[];
};

export async function lokaleWlasciciela(d: DostepWlasciciela): Promise<LokalWlasciciela[]> {
  const admin = createSupabaseAdmin();
  const ids = d.unit_ids.length ? d.unit_ids : ["00000000-0000-0000-0000-000000000000"];
  const [u, t, s, p, o, k] = await Promise.all([
    admin.from("rental_units").select("*").eq("agency_id", d.agency_id).in("id", ids),
    admin.from("rental_tenancies").select("*").in("unit_id", ids).order("od", { ascending: false }),
    admin.from("rental_parties").select("unit_id, rola, nazwa").in("unit_id", ids).eq("rola", "najemca"),
    admin.from("rental_payments").select("*").in("unit_id", ids).not("opublikowano", "is", null).order("miesiac", { ascending: false }),
    admin.from("rental_charges").select("*").in("unit_id", ids),
    konfigBiura(d.agency_id),
  ]);
  const najmy = (t.data ?? []) as (NajemPelny & { unit_id: string })[];
  const wplaty = (p.data ?? []) as (WplataPelna & { unit_id: string })[];
  const oplaty = ((o.data ?? []) as (Oplata & { unit_id: string })[]).map((x) => ({ ...x, kwota: Number(x.kwota) }));
  return ((u.data ?? []) as Lokal[]).map((l) => {
    const moje = najmy.filter((n) => n.unit_id === l.id).map((n) => ({ ...n, czynsz: Number(n.czynsz), parking: Number(n.parking), oplaty: Number(n.oplaty), kaucja: Number(n.kaucja) }));
    const moOplaty = oplaty.filter((x) => x.unit_id === l.id);
    const w = warunki(l, k);
    const akt = moje.find((n) => n.aktywny) ?? null;
    return {
      id: l.id,
      adres: l.adres,
      pow: l.pow,
      pokoje: l.pokoje,
      etap: l.etap,
      limit_napraw: l.limit_napraw,
      najem: akt ? { forma: akt.forma, od: akt.od, do_dnia: akt.do_dnia, czynsz: akt.czynsz, oplaty: akt.oplaty, kaucja: akt.kaucja, parking: akt.parking } : null,
      najemca: (s.data ?? []).find((x) => x.unit_id === l.id)?.nazwa ?? null,
      miesiace: wplaty
        .filter((x) => x.unit_id === l.id)
        .map((x) => {
          const wpl = { ...x, czynsz: Number(x.czynsz), oplaty: Number(x.oplaty), koszty: Number(x.koszty) };
          const najem = moje.find((n) => najemWMiesiacu(n, x.miesiac)) ?? null;
          return { lokal: l.adres, lokalId: l.id, r: rozliczMiesiac(x.miesiac, najem, wpl, w, moOplaty), czynsz: wpl.czynsz, oplatyWplata: wpl.oplaty, koszty: wpl.koszty, kosztyOpis: x.koszty_opis, pozycje: moOplaty.filter((a) => a.miesiac === x.miesiac), kaucja: najem?.kaucja ?? 0, model: w.model, prowizjaPct: w.prowizjaPct, przekazano: x.przekazano };
        }),
    };
  });
}

export type ZgloszenieWlasciciela = { id: string; lokal: string; lokalId: string; rodzaj: string; tytul: string; stan: string; koszt: number | null; termin: string | null; zgoda: string; created_at: string };

export async function zgloszeniaWlasciciela(d: DostepWlasciciela, lokale: { id: string; adres: string }[]): Promise<ZgloszenieWlasciciela[]> {
  const { data } = await createSupabaseAdmin().from("rental_events").select("id, unit_id, rodzaj, tytul, stan, koszt, termin, zgoda, created_at").in("unit_id", lokale.map((l) => l.id)).eq("dla_wlasciciela", true).order("created_at", { ascending: false }).limit(200);
  return ((data ?? []) as (Omit<ZgloszenieWlasciciela, "lokal" | "lokalId"> & { unit_id: string })[]).map((z) => ({ ...z, lokalId: z.unit_id, lokal: lokale.find((l) => l.id === z.unit_id)?.adres ?? "" }));
}

export type DokumentWlasciciela = { id: string; nazwa: string; rodzaj: string; lokal: string; data: string };

export async function dokumentyWlasciciela(lokale: { id: string; adres: string }[], agencyId: string): Promise<DokumentWlasciciela[]> {
  const { data } = await createSupabaseAdmin().from("documents").select("id, name, kind, entity_id, created_at").eq("agency_id", agencyId).eq("entity_type", "najem").in("entity_id", lokale.map((l) => l.id)).neq("kind", "inne").order("created_at", { ascending: false }).limit(300);
  return ((data ?? []) as { id: string; name: string; kind: string; entity_id: string; created_at: string }[]).map((x) => ({ id: x.id, nazwa: x.name, rodzaj: x.kind, lokal: lokale.find((l) => l.id === x.entity_id)?.adres ?? "", data: x.created_at }));
}

export type WiadomoscWlasciciela = { id: string; autor: string; tresc: string; created_at: string; read_at: string | null };

export async function wiadomosciWlasciciela(accessId: string): Promise<WiadomoscWlasciciela[]> {
  const { data } = await createSupabaseAdmin().from("rental_owner_messages").select("id, autor, tresc, created_at, read_at").eq("access_id", accessId).order("created_at").limit(500);
  return (data ?? []) as WiadomoscWlasciciela[];
}

/** Do opiekuna lokalu trafia dzwonek, gdy właściciel coś zrobił. */
export async function powiadomOpiekuna(unitId: string, agencyId: string, tytul: string, tresc?: string) {
  const { data } = await createSupabaseAdmin().from("rental_units").select("opiekun_id").eq("id", unitId).maybeSingle();
  await powiadom(agencyId, [data?.opiekun_id], { tytul, tresc: tresc ?? null, adres: `/app/najem/${unitId}?z=portal`, pilne: true });
}

/** Wiadomość systemowa w portalu właściciela: nowe rozliczenie albo koszt do akceptacji. */
export async function powiadomWlasciciela(unitId: string, tekst: string) {
  const admin = createSupabaseAdmin();
  const { data } = await admin.from("rental_owner_access").select("id, agency_id").contains("unit_ids", [unitId]).is("revoked_at", null).maybeSingle();
  if (data) await admin.from("rental_owner_messages").insert({ access_id: data.id, agency_id: data.agency_id, autor: "biuro", tresc: tekst });
}
