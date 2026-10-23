import { opisNaTekst } from "../opis-html";
import { createSupabaseAdmin } from "../supabase/admin";

/**
 * Trening na własnej ofercie.
 *
 * Scenariusz mówi, KIM jest klient i czego chce. Kontekst oferty mówi, O CZYM
 * rozmawiacie: ta konkretna nieruchomość, z ceną, metrażem i opisem. Agent
 * ćwiczy przed prawdziwym telefonem dokładnie te pytania, które padną jutro.
 *
 * Do sesji zapisujemy migawkę danych, a nie samo ID: ocena po tygodniu musi
 * odnosić się do tego, co agent wtedy wiedział, nawet jeśli cena się zmieniła.
 */

export type KontekstOferty = {
  propertyId: string;
  tytul: string;
  dzielnica: string;
  miasto: string;
  rodzaj: "sprzedaz" | "wynajem";
  cena: number | null;
  metraz: number | null;
  pokoje: number | null;
  pietro: number | null;
  rok: number | null;
  czynszAdm: number | null;
  opis: string;
};

/** Ulica bez numeru: klient AI nie potrzebuje dokładnego adresu, a to dane z CRM. */
function bezNumeru(adres: string | null): string {
  return (adres ?? "").replace(/\s+\d+[a-zA-Z]?(\s*\/\s*\d+[a-zA-Z]?)?/g, "").split(",")[0].trim();
}

export async function migawkaOferty(agencyId: string, propertyId: string): Promise<KontekstOferty | null> {
  const { data: p } = await createSupabaseAdmin()
    .from("properties")
    .select("*")
    .eq("id", propertyId)
    .eq("agency_id", agencyId)
    .maybeSingle();
  if (!p) return null;
  const n = (v: unknown) => (v == null || v === "" ? null : Number(v));
  return {
    propertyId: p.id,
    tytul: String(p.title ?? ""),
    dzielnica: bezNumeru(p.district ?? p.address ?? null),
    miasto: String(p.city ?? ""),
    rodzaj: p.deal_kind === "wynajem" ? "wynajem" : "sprzedaz",
    cena: n(p.price_pln),
    metraz: n(p.area_m2),
    pokoje: n(p.rooms),
    pietro: n(p.floor),
    rok: n(p.year_built),
    czynszAdm: n(p.admin_fee_pln),
    opis: opisNaTekst(p.description).replace(/\s+/g, " ").trim().slice(0, 900),
  };
}

const zl = (n: number) => new Intl.NumberFormat("pl-PL").format(n) + " zł";

/** Fakty o ofercie, po jednym w linii. Te same dla klienta AI i dla oceny. */
export function faktyOferty(k: KontekstOferty): string[] {
  return [
    k.tytul && `Ogłoszenie: ${k.tytul}`,
    `Lokalizacja: ${[k.dzielnica, k.miasto].filter(Boolean).join(", ") || "nie podano"}`,
    k.cena != null && `${k.rodzaj === "wynajem" ? "Czynsz najmu" : "Cena"}: ${zl(k.cena)}${k.rodzaj === "wynajem" ? " miesięcznie" : ""}`,
    k.metraz != null && `Metraż: ${k.metraz} m²`,
    k.cena != null && k.metraz && k.rodzaj === "sprzedaz" && `Cena za metr: ${zl(Math.round(k.cena / k.metraz))}`,
    k.pokoje != null && `Pokoje: ${k.pokoje}`,
    k.pietro != null && `Piętro: ${k.pietro}`,
    k.rok != null && `Rok budowy: ${k.rok}`,
    k.czynszAdm != null && `Czynsz administracyjny: ${zl(k.czynszAdm)}`,
    k.opis && `Opis z ogłoszenia: ${k.opis}`,
  ].filter((f): f is string => typeof f === "string" && f.length > 0);
}

/** Blok dopisywany do instrukcji klienta AI. */
export function blokOferty(k: KontekstOferty): string {
  const fakty = faktyOferty(k);
  return [
    "",
    "",
    "KONKRETNA OFERTA, O KTÓREJ ROZMAWIACIE (ważniejsze niż ogólny opis nieruchomości w scenariuszu):",
    ...fakty.map((f) => `- ${f}`),
    "",
    "Jak z tego korzystać: odnoś się do tej oferty po nazwie dzielnicy, ceny i metrażu. Zadawaj pytania, które realny klient zadałby o TO mieszkanie: o to, czego brakuje w opisie (stan instalacji, koszty utrzymania, sąsiedztwo, hałas, księga wieczysta, dlaczego właściciel sprzedaje), o cenę na tle okolicy. Jeśli agent poda informację sprzeczną z danymi powyżej, zauważ to i dopytaj. Nie wymyślaj faktów, których nie ma w danych: jeśli czegoś nie wiesz, zapytaj agenta.",
  ].join("\n");
}

/** Kontekst zapisany w sesji. Brak kolumny (przed migracją v49) daje null, nie błąd. */
export async function kontekstSesji(sessionId: string): Promise<KontekstOferty | null> {
  const { data, error } = await createSupabaseAdmin().from("training_sessions").select("context").eq("id", sessionId).maybeSingle();
  if (error || !data?.context) return null;
  const c = data.context as { oferta?: KontekstOferty };
  return c.oferta ?? null;
}
