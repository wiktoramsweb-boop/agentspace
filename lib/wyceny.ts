import { createHash } from "node:crypto";
import { createSupabaseAdmin } from "./supabase/admin";
import { geocodePl } from "./geocode";
import { juzLiczone, stanProby, zuzyjProbe, type StanProby } from "./proba";
import { wycenaZRcn, type WycenaRcn } from "./rcn";
import { celZParametrow, liczbaZ, OGRZEWANIE, opisParametrow, type ParametryWyceny } from "./rcn-parametry";
import type { CelWyceny } from "./rcn-wycena";
import type { DaneRaportu } from "./wycena-pdf";
import { todayPL } from "./datetime";
import { zakresUzytkownika } from "./auth";
import type { ProfileWithAgency } from "./types";

/**
 * Liczenie i zapis wycen. Ta sama droga dla strony wyceny i asystenta AI, żeby
 * limity próby, geokodowanie i zapis nie rozjechały się między nimi.
 */

export type OfertaDoWyceny = { id: string; address: string | null; city: string | null; lat: number | null; lng: number | null; area_m2: number | null; rooms: number | null; floor: number | null; price_pln: number | null; deal_kind: string };

export type WynikLiczenia = {
  adres: string;
  cel: Omit<CelWyceny, "x" | "y">;
  proba: StanProby;
  zablokowana: boolean;
  brak: string | null;
  wycena: WycenaRcn | null;
  raport: DaneRaportu | null;
  zapisanaId: string | null;
  powiazanaOferta: string | null;
};

export async function policzWycene(user: ProfileWithAgency, p: ParametryWyceny, oferta: OfertaDoWyceny | null, zapytano: boolean): Promise<WynikLiczenia> {
  let lat = liczbaZ(p, "lat") || oferta?.lat || null;
  let lng = liczbaZ(p, "lng") || oferta?.lng || null;
  const adres = p.address || [oferta?.address, oferta?.city].filter(Boolean).join(", ");
  const cel = celZParametrow(p, oferta);
  const ogrzewanie = OGRZEWANIE[p.ogrzewanie ?? ""] ?? null;

  // Adres wpisany bez wyboru z podpowiedzi: dociągamy współrzędne sami.
  if ((!lat || !lng) && adres) {
    const g = await geocodePl(adres, 1).catch(() => []);
    if (g[0]) {
      lat = g[0].lat;
      lng = g[0].lng;
    }
  }

  // Okres próbny i demo: trzy wyceny. Ślad zapytania sprawia, że odświeżenie
  // tej samej wyceny nie zabiera kolejnego podejścia.
  let proba = await stanProby(user, "wycena");
  const slad = createHash("sha1").update(JSON.stringify([adres, lat, lng, cel])).digest("hex").slice(0, 12);
  const zablokowana = zapytano && proba.naProbie && proba.zostalo <= 0 && !(await juzLiczone(user, "wycena", slad));
  let wycena: WycenaRcn | null = null;
  let brak: string | null = null;
  if (zapytano && !zablokowana) {
    if (!lat || !lng) brak = "Nie udało się ustalić położenia. Wybierz adres z podpowiedzi albo uzupełnij współrzędne oferty.";
    else if (!cel.pow) brak = "Podaj metraż mieszkania.";
    else wycena = await wycenaZRcn(lat, lng, cel);
  }
  const w = wycena?.wynik ?? null;
  if (w && proba.naProbie) {
    await zuzyjProbe(user, "wycena", slad);
    proba = await stanProby(user, "wycena");
  }
  const dzis = todayPL();
  const raport: DaneRaportu | null =
    w && wycena
      ? {
          adres: adres || "Mieszkanie",
          dla: p.dla?.slice(0, 80) || null,
          biuro: user.agency?.name ?? "Biuro nieruchomości",
          agent: user.full_name ?? "",
          data: `${dzis.slice(8, 10)}.${dzis.slice(5, 7)}.${dzis.slice(0, 4)}`,
          promien: wycena.promien,
          parametry: opisParametrow(cel, ogrzewanie),
          wybranyStan: cel.stan ?? "standard",
          wynik: w,
        }
      : null;

  let zapisanaId: string | null = null;
  let powiazanaOferta: string | null = oferta?.id ?? null;
  if (raport && user.agency_id) {
    const z = await zapiszWycene(user, { raport, parametry: { ...p, ...(lat && lng ? { lat: String(lat), lng: String(lng) } : {}) }, slad, propertyId: oferta?.id ?? null });
    zapisanaId = z?.id ?? null;
    powiazanaOferta = z?.propertyId ?? powiazanaOferta;
  }
  return { adres, cel, proba, zablokowana, brak, wycena, raport, zapisanaId, powiazanaOferta };
}

/** Zapis po cichu: bez migracji v58 wycena działa jak dotąd, tylko bez historii. */
async function zapiszWycene(
  user: ProfileWithAgency,
  z: { raport: DaneRaportu; parametry: ParametryWyceny; slad: string; propertyId: string | null },
): Promise<{ id: string; propertyId: string | null } | null> {
  const admin = createSupabaseAdmin();
  const { wynik } = z.raport;
  const { podglad: _pomin, ...parametry } = z.parametry;
  const wiersz = {
    agency_id: user.agency_id,
    agent_id: user.id,
    adres: z.raport.adres.slice(0, 200),
    dla: z.raport.dla,
    pow: liczbaZ(z.parametry, "pow"),
    szacunek: wynik.szacunek,
    cena_m2: wynik.cenaM2,
    cena_ofertowa: wynik.cenaOfertowa,
    pewnosc: wynik.pewnosc,
    zrodlo: z.parametry.zrodlo?.slice(0, 600) || null,
    cena_ogloszenia: liczbaZ(z.parametry, "cena_ogl"),
    parametry,
    raport: z.raport,
    slad: z.slad,
    updated_at: new Date().toISOString(),
  };
  const { data: byla, error } = await admin.from("valuations").select("id, property_id").eq("agent_id", user.id).eq("slad", z.slad).maybeSingle();
  if (error) return null;
  if (byla) {
    const propertyId = z.propertyId ?? (byla.property_id as string | null);
    await admin.from("valuations").update({ ...wiersz, property_id: propertyId }).eq("id", byla.id);
    return { id: byla.id as string, propertyId };
  }
  const { data } = await admin.from("valuations").insert({ ...wiersz, property_id: z.propertyId }).select("id").single();
  return data ? { id: data.id as string, propertyId: z.propertyId } : null;
}

export type WycenaNaLiscie = {
  id: string;
  adres: string;
  dla: string | null;
  pow: number | null;
  szacunek: number;
  cena_m2: number | null;
  pewnosc: string | null;
  property_id: string | null;
  agent_id: string | null;
  updated_at: string;
  properties?: { title: string } | null;
  profiles?: { full_name: string | null } | null;
};

const POLA_LISTY = "id, adres, dla, pow, szacunek, cena_m2, pewnosc, property_id, agent_id, updated_at, properties(title), profiles(full_name)";

/** `null` znaczy: tabeli jeszcze nie ma (migracja v58). */
export async function listaWycen(user: ProfileWithAgency, szukaj = ""): Promise<WycenaNaLiscie[] | null> {
  if (!user.agency_id) return [];
  let q = createSupabaseAdmin().from("valuations").select(POLA_LISTY).eq("agency_id", user.agency_id).order("updated_at", { ascending: false }).limit(200);
  if (zakresUzytkownika(user) === "wlasne") q = q.eq("agent_id", user.id);
  const fraza = szukaj.replace(/[%,()]/g, " ").trim();
  if (fraza) q = q.or(`adres.ilike.%${fraza}%,dla.ilike.%${fraza}%`);
  const { data, error } = await q;
  return error ? null : (data as unknown as WycenaNaLiscie[]);
}

export async function wycenyOferty(agencyId: string, propertyId: string): Promise<WycenaNaLiscie[]> {
  const { data, error } = await createSupabaseAdmin().from("valuations").select(POLA_LISTY).eq("agency_id", agencyId).eq("property_id", propertyId).order("updated_at", { ascending: false }).limit(20);
  return error ? [] : (data as unknown as WycenaNaLiscie[]);
}

export type WycenaPelna = WycenaNaLiscie & { raport: DaneRaportu; parametry: ParametryWyceny; zrodlo: string | null; cena_ogloszenia: number | null };

export async function wycenaPoId(user: ProfileWithAgency, id: string): Promise<WycenaPelna | null> {
  if (!user.agency_id || !/^[0-9a-f-]{36}$/.test(id)) return null;
  const { data } = await createSupabaseAdmin().from("valuations").select(`${POLA_LISTY}, raport, parametry, zrodlo, cena_ogloszenia`).eq("id", id).eq("agency_id", user.agency_id).maybeSingle();
  const w = data as unknown as WycenaPelna | null;
  if (!w) return null;
  // Wycena przy ofercie jest wspólna dla biura, luźna należy do autora.
  if (zakresUzytkownika(user) === "wlasne" && w.agent_id !== user.id && !w.property_id) return null;
  return w;
}
